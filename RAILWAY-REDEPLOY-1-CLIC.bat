@echo off
title Redeploy Railway API - Memory Haven
echo.
echo Le frontend appelle /api/arbre/unions
echo Si vous voyez 404, l'API Railway doit etre redeployee.
echo.
echo === Option A : GitHub (si Railway est connecte au repo) ===
echo   git add backend
echo   git commit -m "API arbre: unions mariages et type_arbre"
echo   git push origin main
echo.
echo === Option B : Railway CLI ===
echo   npx @railway/cli login
echo   cd backend
echo   npx @railway/cli up
echo.
echo === Verification ===
echo   Ouvrir /api/health et chercher version: 9-arbre-unions-routes
echo.
start https://railway.com/dashboard
start https://memory-haven-api-production.up.railway.app/api/health
pause
