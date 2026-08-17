#!/usr/bin/env bash
# Démarrage du frontend SyLOC-T après dézippage.
# Installe les dépendances uniquement si nécessaire, puis lance Vite.
set -e
cd "$(dirname "$0")"
node scripts/ensure-deps.mjs
npm run dev
