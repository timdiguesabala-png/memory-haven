@echo off
title Redeploy Railway - Memory Haven
echo.
echo 1. Connexion Railway (une fois) dans le terminal qui s'ouvre :
echo    railway login
echo.
echo 2. Puis redeploy :
echo    cd backend
echo    railway up
echo.
echo Ou dans le navigateur : Deployments - Redeploy
echo.
start https://railway.com/dashboard
start https://memory-haven-api-production.up.railway.app/api/health
pause
