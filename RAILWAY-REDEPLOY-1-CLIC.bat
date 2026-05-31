@echo off
title Redeploy Railway API - Memory Haven
cd /d "%~dp0"
echo.
echo === Mise a jour API Railway ===
echo.
echo 1. Envoi du code sur GitHub...
git push origin main
if errorlevel 1 (
  echo Echec push. Verifiez Git / connexion.
  pause
  exit /b 1
)
echo.
echo 2. Ouvrez Railway et cliquez REDEPLOY sur le service API.
echo    Root Directory : VIDE ou "backend" si le build echoue.
echo.
echo 3. Verification (apres 2-5 min) :
echo    https://memory-haven-api-production.up.railway.app/api/health
echo.
echo    OK si vous voyez : "version":"18-profile-photo-multipart"
echo    KO si seulement : "api":"OK","database":"OK"
echo.
start https://railway.com/dashboard
start https://memory-haven-api-production.up.railway.app/api/health
start notepad "%~dp0RAILWAY-API-MISE-A-JOUR.md"
pause
