@echo off
title Lier un compte a Supabase Auth
cd /d "%~dp0backend"
echo.
echo Ce script recree votre login Supabase pour un email deja dans la base.
echo.
echo 1) Creez backend\.env avec DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
echo    (voir backend\.env.supabase.example et CONNEXION-SUPABASE.md)
echo.
set /p MH_EMAIL="Email du compte : "
set /p MH_PASS="Nouveau mot de passe (min 6 caracteres) : "
echo.
node scripts/link-supabase-auth.js --email "%MH_EMAIL%" --password "%MH_PASS%"
echo.
pause
