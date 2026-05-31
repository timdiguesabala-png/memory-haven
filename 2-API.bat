@echo off
title Memory Haven - API (port 3000)
cd /d "%~dp0backend"
echo.
echo === Memory Haven API ===
echo Preparation base locale (SQLite si file:./ dans .env)...
call node scripts/ensure-local-db.js
if errorlevel 1 goto erreur
call npx prisma generate
if errorlevel 1 goto erreur
call npx prisma db push
if errorlevel 1 goto erreur
echo.
echo Demarrage sur http://localhost:3000
echo Gardez cette fenetre ouverte pendant que vous utilisez le site en local.
echo.
npm run dev:quick
goto fin

:erreur
echo.
echo Echec. Verifiez backend\.env (DATABASE_URL=file:./prisma/dev.db pour SQLite local).
pause
exit /b 1

:fin
pause
