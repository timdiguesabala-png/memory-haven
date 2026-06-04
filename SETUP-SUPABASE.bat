@echo off
title Memory Haven - Configurer Supabase (base de donnees)
cd /d "%~dp0backend"

echo.
echo === Memory Haven : schema Prisma sur Supabase ===
echo.
echo 1. Copiez backend\.env.supabase.example vers backend\.env
echo 2. Remplissez DATABASE_URL, DIRECT_URL, SUPABASE_* depuis supabase.com
echo 3. Ce script lance prisma db push + seed
echo.

if not exist ".env" (
  echo Fichier .env manquant.
  echo Copiez .env.supabase.example vers .env et editez-le.
  pause
  exit /b 1
)

call node scripts\ensure-local-db.js
call npx prisma generate
call npx prisma db push
call npm run db:seed

echo.
echo OK. Etape suivante : DEPLOI-SUPABASE.bat ^(Render + Vercel^)
echo Guide : SUPABASE-SETUP.md
pause
