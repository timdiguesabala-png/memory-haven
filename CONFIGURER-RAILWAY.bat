@echo off
title Configurer Railway - Memory Haven
cd /d "%~dp0\backend"

echo.
echo === 1. Connexion Railway (navigateur) ===
call npx @railway/cli login
if errorlevel 1 goto fin

echo.
echo === 2. Lier le projet (choisir memory-haven-api) ===
call npx @railway/cli link
if errorlevel 1 goto fin

echo.
echo === 3. Envoyer Cloudinary + autres variables depuis .env ===
node scripts/push-railway-env.js
if errorlevel 1 goto fin

echo.
echo === 4. Deploiement API ===
call npx @railway/cli up

echo.
echo === 5. Test ===
start https://memory-haven-api-production.up.railway.app/api/health
echo Attendu: cloudinary OK, version 2-upload-unified
echo.

:fin
pause
