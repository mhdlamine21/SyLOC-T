#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================"
echo "      SyLOC-T : Systeme de Gestion du Patrimoine Domanial"
echo "                  CROUS de Thies (UIDT)"
echo "================================================================"
echo ""

# 1. Detection Python
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "[ERREUR] Python est introuvable. Veuillez installer Python 3.10+."
    exit 1
fi

# 2. Gestion de l'environnement virtuel (.venv)
echo "[1/3] Verification de l'environnement Backend Python..."
if [ ! -d "vcn_backend/.venv" ]; then
    echo "[Backend] Creation de l'environnement virtuel (.venv)..."
    "$PYTHON_CMD" -m venv vcn_backend/.venv
fi

# Detection de l'executable python dans le venv (Linux/macOS vs Windows/Git Bash)
if [ -f "vcn_backend/.venv/bin/python" ]; then
    VENV_PY="vcn_backend/.venv/bin/python"
    VENV_PIP="vcn_backend/.venv/bin/pip"
elif [ -f "vcn_backend/.venv/Scripts/python.exe" ]; then
    VENV_PY="vcn_backend/.venv/Scripts/python.exe"
    VENV_PIP="vcn_backend/.venv/Scripts/pip.exe"
elif [ -f "vcn_backend/.venv/Scripts/python" ]; then
    VENV_PY="vcn_backend/.venv/Scripts/python"
    VENV_PIP="vcn_backend/.venv/Scripts/pip"
else
    echo "[ERREUR] Impossible de trouver l'executable python dans vcn_backend/.venv"
    exit 1
fi

if [ ! -f "vcn_backend/.venv/.installed" ]; then
    echo "[Backend] Installation automatique des dependances..."
    "$VENV_PIP" install -r vcn_backend/requirements.txt
    touch vcn_backend/.venv/.installed
fi
echo "[Backend] Environnement virtuel pret."

echo ""
echo "[2/3] Verification de la base de donnees et migrations..."
"$VENV_PY" vcn_backend/manage.py migrate

echo ""
echo "[3/3] Lancement des serveurs Backend et Frontend..."

# Lancement Backend
(cd vcn_backend && "../$VENV_PY" manage.py runserver 0.0.0.0:8000) &
BACKEND_PID=$!

# Lancement Frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "================================================================"
echo "  SyLOC-T est demarre avec succes !"
echo "  - Application Web : http://localhost:5173"
echo "  - API Swagger     : http://127.0.0.1:8000/api/docs/"
echo "================================================================"
echo "Appuyez sur Ctrl+C pour arreter tous les services."
echo ""

cleanup() {
    echo ""
    echo "Arret des serveurs SyLOC-T..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT
wait