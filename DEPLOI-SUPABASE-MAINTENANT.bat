@echo off
title Memory Haven - Supabase PRODUCTION (sans Railway)
cd /d "%~dp0"
echo.
echo === Deploiement Supabase + Vercel ===
echo   - Base de donnees : Supabase PostgreSQL
echo   - Auth + fil + discussion : Supabase direct
echo   - Site web : Vercel
echo   - Railway : abandonne
echo.

echo [1/3] Schema Prisma sur Supabase...
cd backend
call npx prisma db push
if errorlevel 1 (
  echo Echec prisma — verifiez DATABASE_URL dans backend\.env
  pause
  exit /b 1
)
cd ..

echo.
echo [2/3] Variables Vercel + deploiement frontend...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-supabase-vercel.ps1"
if errorlevel 1 (
  echo Echec Vercel
  pause
  exit /b 1
)

echo.
echo [3/3] Ouverture du site...
start "" "https://memory-haven-frontend.vercel.app/?mh_force=1"
start "" "https://supabase.com/dashboard/project/qazdsbeyhryodbtytzik"
echo.
echo OPTIONNEL — albums / arbre / platform :
echo   dashboard.render.com ^> Blueprint ^> memory-haven ^> render.yaml
echo   Guide : SUPABASE-SETUP.md etape 4
echo.
pause
