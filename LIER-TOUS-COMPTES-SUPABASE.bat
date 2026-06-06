@echo off
title Migration complete comptes Supabase
cd /d "%~dp0backend"
echo.
echo [1] Copie des comptes locaux (prisma\dev.db) vers Supabase...
node scripts\sync-sqlite-users-to-supabase.js
echo.
echo [2] Liaison Supabase Auth (mot de passe temporaire)...
node scripts\link-supabase-auth-sql.js --all --password MemoryHaven2026!
echo.
echo Termine. Connexion : votre email + MemoryHaven2026!
echo Puis changez le mot de passe via le site.
pause
