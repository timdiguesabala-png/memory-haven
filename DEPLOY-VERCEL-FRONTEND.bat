@echo off
title Deploiement Vercel - memory-haven-frontend
cd /d "%~dp0frontend"
echo.
echo Deploiement sur https://memory-haven-frontend.vercel.app
echo.
echo IMPORTANT : Vercel doit avoir VITE_USE_SUPABASE=true + URL + ANON_KEY
echo Voir DEPLOI-VERCEL-SUPABASE.md
echo.
call npx vercel deploy --prod --yes --project memory-haven-frontend
echo.
echo Verification: theme-color doit etre #8B7CF0 dans index.html
start https://memory-haven-frontend.vercel.app
pause
