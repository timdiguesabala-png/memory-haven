@echo off
title Memory Haven - Installation
cd /d "%~dp0backend"

echo.
echo === INSTALLATION (1 seule fois) ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERREUR: Node.js n est pas installe.
  echo Telechargez: https://nodejs.org  (version LTS)
  pause
  exit /b 1
)

echo Node OK:
node -v
echo.

if not exist "node_modules\" (
  echo Installation des dependances backend...
  call npm install
)

if not exist "..\frontend\node_modules\" (
  echo Installation des dependances frontend...
  cd ..\frontend
  call npm install
  cd ..\backend
)

copy /Y prisma\schema.sqlite.prisma prisma\schema.prisma
call npx prisma generate
call npx prisma db push --accept-data-loss
call npm run db:seed

echo.
echo === INSTALLATION TERMINEE ===
echo Compte: marie@demo.local / demo1234
echo.
echo Maintenant lancez: 2-API.bat puis 3-SITE.bat
pause
