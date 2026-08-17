#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================"
echo "      SyLOC-T : Système de Gestion du Patrimoine Domanial"
echo "                  CROUS de Thiès (UIDT)"
echo "================================================================"
echo ""

# 1. Backend Python & Venv
echo "[1/3] Vérification de l'environnement Backend Python..."
if [ ! -d "vcn_backend/.venv" ]; then
    echo "[Backend] Création de l'environnement virtuel (.venv)..."
    python3 -m venv vcn_backend/.venv
    echo "[Backend] Installation automatique des dépendances Python..."
    vcn_backend/.venv/bin/pip install -r vcn_backend/requirements.txt
else
    echo "[Backend] Environnement virtuel détecté (.venv) ✅"
fi

echo "[Backend] Application des migrations..."
vcn_backend/.venv/bin/python vcn_backend/manage.py migrate

# 2. Lancement Backend en arrière-plan
echo "[2/3] Démarrage du serveur Backend Django (http://127.0.0.1:8000)..."
(cd vcn_backend && .venv/bin/python manage.py runserver 0.0.0.0:8000) &
BACKEND_PID=$!

# 3. Lancement Frontend
echo "[3/3] Démarrage du serveur Frontend React / Vite (http://localhost:5173)..."
echo "[Frontend] Installation automatique de node_modules si manquant..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
