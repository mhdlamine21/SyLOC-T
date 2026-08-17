@echo off
REM Demarrage du frontend SyLOC-T apres dezippage (Windows).
cd /d "%~dp0"
node scripts\ensure-deps.mjs || exit /b 1
npm run dev
