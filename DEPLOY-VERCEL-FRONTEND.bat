@echo off
title Deploiement Vercel - memory-haven-frontend
cd /d "%~dp0frontend"
echo.
echo Deploiement sur https://memory-haven-frontend.vercel.app
echo.
call npx vercel deploy --prod --yes --project memory-haven-frontend
echo.
echo Verification: theme-color doit etre #8B7CF0 dans index.html
start https://memory-haven-frontend.vercel.app
pause
