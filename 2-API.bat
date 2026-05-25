@echo off
title Memory Haven - API (port 3000)
cd /d "%~dp0backend"
echo API sur http://localhost:3000
echo Ne fermez pas cette fenetre.
echo.
npm run dev
pause
