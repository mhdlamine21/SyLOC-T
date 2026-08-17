import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { appVersion } from "./plugins/vite-plugin-app-version.js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), appVersion()],
  server: {
    port: 5173,
    open: true,
    // Aucune mise en cache en développement : on voit toujours le code actuel.
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  },
  build: {
    // Tous les assets sont hashés : un nouveau build = de nouveaux noms de
    // fichiers, donc impossible de servir un ancien bundle depuis le cache.
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
