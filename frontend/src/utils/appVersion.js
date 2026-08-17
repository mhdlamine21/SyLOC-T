/**
 * Garde-fou anti "vieille version" côté navigateur.
 *
 * 1. Supprime tout service worker et tout Cache Storage résiduel (cause n°1
 *    des applications figées sur une version ancienne).
 * 2. Compare en continu l'identifiant de build embarqué (__APP_BUILD_ID__)
 *    avec /version.json (jamais mis en cache). En cas d'écart -> rechargement
 *    forcé, une seule fois, sans boucle.
 */

const BUILD_ID =
  typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "dev";
const STORAGE_KEY = "syloc:lastReloadedBuild";
const CHECK_INTERVAL_MS = 60_000;

async function purgeServiceWorkersAndCaches() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* silencieux : non bloquant */
  }
}

function hardReload(remoteBuildId) {
  const already = sessionStorage.getItem(STORAGE_KEY);
  if (already === remoteBuildId) return; // évite toute boucle de rechargement
  sessionStorage.setItem(STORAGE_KEY, remoteBuildId);
  const url = new URL(window.location.href);
  url.searchParams.set("_v", remoteBuildId);
  window.location.replace(url.toString());
}

async function checkForUpdate() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.buildId && data.buildId !== BUILD_ID) {
      await purgeServiceWorkersAndCaches();
      hardReload(data.buildId);
    }
  } catch {
    /* hors ligne : on réessaiera */
  }
}

export function initAppVersionGuard() {
  if (typeof window === "undefined") return;
  purgeServiceWorkersAndCaches();
  checkForUpdate();
  setInterval(checkForUpdate, CHECK_INTERVAL_MS);
  window.addEventListener("focus", checkForUpdate);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
  window.__SYLOC_BUILD_ID__ = BUILD_ID;
}

export const APP_BUILD_ID = BUILD_ID;
