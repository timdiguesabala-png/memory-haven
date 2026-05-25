@echo off
title Memory Haven
cd /d "%~dp0"

echo.
echo  Memory Haven - Lancement
echo  ------------------------
echo.

if not exist "backend\node_modules\" (
  echo Premiere fois: lancement de l installation...
  call "%~dp01-INSTALLER.bat"
)

echo Demarrage API + Site dans 2 fenetres...
start "Memory Haven API" "%~dp02-API.bat"
timeout /t 5 /nobreak >nul
start "Memory Haven Site" "%~dp03-SITE.bat"

echo.
echo  Ouvrez: http://localhost:5173
echo  Login:  marie@demo.local / demo1234
echo.
echo  Gardez les 2 fenetres noires ouvertes.
pause
