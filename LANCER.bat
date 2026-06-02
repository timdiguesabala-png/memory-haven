@echo off
title Memory Haven
cd /d "%~dp0"

echo.
echo  Memory Haven - Mode LOCAL
echo  -------------------------
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERREUR: Node.js non installe.
  echo Telechargez: https://nodejs.org ^(version LTS^)
  pause
  exit /b 1
)

if not exist "backend\node_modules\" (
  echo Premiere fois: installation...
  call "%~dp01-INSTALLER.bat"
)

echo Preparation base SQLite...
cd backend
call node scripts\ensure-local-db.js
call npx prisma db push --skip-generate 2>nul
cd ..

echo.
echo Demarrage API + Site ^(2 fenetres^)...
start "Memory Haven API" "%~dp02-API.bat"
timeout /t 6 /nobreak >nul
start "Memory Haven Site" "%~dp03-SITE.bat"
timeout /t 4 /nobreak >nul

echo Ouverture du navigateur...
start "" "http://localhost:5173"

echo.
echo  Site:  http://localhost:5173
echo  API:   http://localhost:3000/api/health
echo  Login: marie@demo.local / demo1234
echo.
echo  Gardez les 2 fenetres noires ouvertes.
echo  Guide: GUIDE-LOCAL.md
echo.
pause
