@echo off
title Memory Haven - Site (port 5173)
cd /d "%~dp0frontend"
echo Site sur http://localhost:5173
echo Ne fermez pas cette fenetre.
echo.
npm run dev
pause
