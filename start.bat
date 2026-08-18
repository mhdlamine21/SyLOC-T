@echo off
title SyLOC-T - CROUS de Thies

cd /d "%~dp0"

echo Demarrage de SyLOC-T (CROUS de Thies)
echo.

echo [1/3] Verification de l'environnement Backend Python...
if exist "vcn_backend\.venv\Scripts\python.exe" (
    echo [Backend] Environnement virtuel pret.
) else (
    echo [Backend] Creation de l'environnement virtuel...
    python -m venv vcn_backend\.venv
    echo [Backend] Installation des dependances...
    call vcn_backend\.venv\Scripts\pip.exe install -r vcn_backend\requirements.txt
)

echo.
echo [2/3] Verification de la base de donnees et migrations...
call vcn_backend\.venv\Scripts\python.exe vcn_backend\manage.py migrate

echo.
echo [3/3] Lancement des serveurs Backend et Frontend...
start "SyLOC-T Backend API - Port 8000" cmd /k "cd /d %~dp0vcn_backend && .venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
start "SyLOC-T Frontend - Port 5173" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo SyLOC-T est demarre :
echo - Interface Web : http://localhost:5173
echo - API Swagger   : http://127.0.0.1:8000/api/docs/
echo.
pause