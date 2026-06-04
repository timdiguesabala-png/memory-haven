@echo off
title Memory Haven - Supabase + Render (sans Railway)
cd /d "%~dp0"
echo.
echo === Abandon Railway - Stack Supabase ===
echo.
echo  1. Supabase  : base PostgreSQL + Storage
echo  2. Render    : API Node.js ^(gratuit^)
echo  3. Vercel    : site web
echo.
echo Guide complet : SUPABASE-SETUP.md
echo.
start https://supabase.com/dashboard
timeout /t 2 /nobreak >nul
start https://dashboard.render.com
timeout /t 2 /nobreak >nul
start notepad "%~dp0SUPABASE-SETUP.md"
pause
