@echo off
chcp 65001 >nul
title SyLOC-T - CROUS de Thiès (Démarrage Automatique)

echo ================================================================
echo       SyLOC-T : Système de Gestion du Patrimoine Domanial
echo                   CROUS de Thiès (UIDT)
echo ================================================================
echo.

cd /d "%~dp0"

REM ── 1. Backend Python & Venv ──
echo [1/3] Vérification de l'environnement Backend Python...
if not exist "vcn_backend\.venv" (
    echo [Backend] Création de l'environnement virtuel (.venv)...
    python -m venv vcn_backend\.venv
    if %errorlevel% neq 0 (
        echo [ERREUR] Python introuvable. Veuillez installer Python 3.10+ et l'ajouter au PATH.
        pause
        exit /b 1
    )
    echo [Backend] Installation automatique des dépendances Python...
    vcn_backend\.venv\Scripts\pip install -r vcn_backend\requirements.txt
) else (
    echo [Backend] Environnement virtuel détecté (.venv) ✅
)

echo [Backend] Application des migrations et vérification de la base...
vcn_backend\.venv\Scripts\python vcn_backend\manage.py migrate

REM ── 2. Démarrage Backend dans une nouvelle fenêtre ──
echo [2/3] Lancement du serveur Backend Django (http://127.0.0.1:8000)...
start "SyLOC-T Backend API" cmd /k "cd /d "%~dp0vcn_backend" && .venv\Scripts\python manage.py runserver 0.0.0.0:8000"

REM ── 3. Frontend Node & Vite ──
echo [3/3] Lancement du serveur Frontend React / Vite (http://localhost:5173)...
echo [Frontend] Le téléchargement des modules node_modules s'exécute automatiquement si absent.
start "SyLOC-T Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ================================================================
echo  ✅ SyLOC-T est démarré avec succès !
echo  - Interface Web : http://localhost:5173
echo  - API Swagger   : http://127.0.0.1:8000/api/docs/
echo ================================================================
echo.
