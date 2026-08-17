#!/usr/bin/env node
/**
 * Installe automatiquement les dépendances si nécessaire.
 * - node_modules absent  -> installation
 * - package.json / package-lock.json modifiés depuis la dernière install -> installation
 * Sinon : ne fait rien (démarrage instantané).
 *
 * Ainsi, après avoir dézippé le projet, `npm run dev` suffit : plus besoin
 * de lancer `npm install` à la main.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nodeModules = join(root, "node_modules");
const stampFile = join(nodeModules, ".deps-stamp");

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
const fingerprint = createHash("sha256")
  .update(read(join(root, "package.json")))
  .update(read(join(root, "package-lock.json")))
  .update(process.version)
  .digest("hex");

const upToDate =
  existsSync(nodeModules) &&
  existsSync(stampFile) &&
  read(stampFile).trim() === fingerprint;

if (upToDate) {
  process.exit(0);
}

const hasLock = existsSync(join(root, "package-lock.json"));
const useCi = hasLock && !existsSync(nodeModules);
const args = useCi ? ["ci"] : ["install"];

console.log(
  `\n[ensure-deps] Dépendances manquantes ou obsolètes → npm ${args[0]}…\n`
);

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const res = spawnSync(npm, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });

if (res.status !== 0) {
  console.error("[ensure-deps] Échec de l'installation des dépendances.");
  process.exit(res.status ?? 1);
}

mkdirSync(nodeModules, { recursive: true });
writeFileSync(stampFile, fingerprint);
console.log("[ensure-deps] Dépendances prêtes ✅\n");
