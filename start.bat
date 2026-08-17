@echo off
chcp 65001 >nul
title SyLOC-T - CROUS de Thiès (Démarrage Automatique)

cd /d "%~dp0"

echo ================================================================
echo       SyLOC-T : Système de Gestion du Patrimoine Domanial
echo                   CROUS de Thiès (UIDT)
echo ================================================================
echo.

REM ── 1. Backend Python & Venv ──
echo [1/3] Vérification de l'environnement Backend Python...
if not exist "vcn_backend\.venv" (
    echo [Backend] Création de l'environnement virtuel (.venv)...
    python -m venv vcn_backend\.venv 2>nul
    if %errorlevel% neq 0 (
        py -3 -m venv vcn_backend\.venv 2>nul
    )
    if not exist "vcn_backend\.venv" (
        echo [ERREUR] Python introuvable. Veuillez installer Python 3.10+ et cocher 'Add python.exe to PATH'.
        pause
        exit /b 1
    )
    echo [Backend] Installation automatique des dépendances Python...
    vcn_backend\.venv\Scripts\pip install -r vcn_backend\requirements.txt
) else (
    echo [Backend] Environnement virtuel détecté (.venv) ✅
)

echo.
echo [2/3] Application des migrations et vérification de la base de données...
call vcn_backend\.venv\Scripts\python.exe vcn_backend\manage.py migrate

REM ── 2. Démarrage Backend et Frontend dans des fenêtres dédiées ──
echo.
echo [3/3] Lancement des serveurs Backend (8000) et Frontend (5173)...
start "SyLOC-T Backend API (Port 8000)" cmd /k "cd /d %~dp0vcn_backend && .venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
start "SyLOC-T Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================================
echo  ✅ SyLOC-T est démarré avec succès !
echo  - Interface Web : http://localhost:5173
echo  - API Swagger   : http://127.0.0.1:8000/api/docs/
echo ================================================================
echo.
echo Appuyez sur une touche pour fermer cet assistant de démarrage...
pause >nul

