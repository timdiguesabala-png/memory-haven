@echo off
title Redeploy Railway API - Memory Haven
cd /d "%~dp0"
echo.
echo === Redeploiement API Memory Haven ===
echo.
echo 1. Commit vide envoye sur GitHub (declenche le build si Railway est lie au repo).
echo 2. Ouvrez Railway et cliquez REDEPLOY sur le dernier deploiement.
echo.
git commit --allow-empty -m "chore: redeploiement API Railway." 2>nul
git push origin main
echo.
echo === Verification (apres 2-5 min) ===
echo   version attendue : 11-upload-documents-multipart
echo   cloudinary : OK ou KO
echo.
echo === Si la version ne change pas ===
echo   Railway - service API - Settings - Root Directory : vide (racine du repo)
echo   Le fichier railway.toml a la racine lance : cd backend ^&^& npm install ...
echo.
echo === Option CLI (si vous etes connecte) ===
echo   cd backend
echo   npx @railway/cli login
echo   npx @railway/cli link
echo   npx @railway/cli up
echo.
start https://railway.com/dashboard
start https://memory-haven-api-production.up.railway.app/api/health
pause
