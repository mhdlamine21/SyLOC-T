import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Anti-cache "hyper puissant" :
 *  - génère un identifiant de build unique (public/version.json)
 *  - l'expose au code client via __APP_BUILD_ID__
 *  - force le navigateur à ne JAMAIS mettre en cache index.html / version.json
 *    (dev, preview et prod) : seuls les assets hashés sont cachés.
 */
export function appVersion() {
  const buildId = `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const writeVersionFile = (root) => {
    const dir = join(root, "public");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "version.json"),
      JSON.stringify({ buildId, builtAt: new Date().toISOString() }, null, 2)
    );
  };

  const noStore = (res) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  };

  const isVolatile = (url = "") =>
    url === "/" ||
    url.startsWith("/index.html") ||
    url.startsWith("/version.json") ||
    !/\.[a-z0-9]+(\?|$)/i.test(url.split("?")[0]);

  const middleware = (req, res, next) => {
    if (isVolatile(req.url)) noStore(res);
    next();
  };

  let root = process.cwd();

  return {
    name: "syloc-app-version",
    config(config) {
      root = config.root || process.cwd();
      return {
        define: {
          __APP_BUILD_ID__: JSON.stringify(buildId),
        },
      };
    },
    buildStart() {
      writeVersionFile(root);
    },
    configureServer(server) {
      writeVersionFile(root);
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default appVersion;
