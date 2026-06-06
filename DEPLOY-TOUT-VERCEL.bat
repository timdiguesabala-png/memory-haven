@echo off
title Deploiement complet Memory Haven (Vercel)
cd /d "%~dp0"
echo.
echo [1/3] Variables Supabase sur projet secours memory_haven...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-vercel-env-all.ps1"
echo.
echo [2/3] Deploiement memory-haven-frontend (prod)...
cd frontend
call npx vercel deploy --prod --yes --project memory-haven-frontend
echo.
echo [3/3] Deploiement memory_haven (secours)...
cd ..
call npx vercel deploy --prod --yes
echo.
echo Termine. Ouverture du site...
start "" "https://memory-haven-frontend.vercel.app/?mh_force=1"
pause
