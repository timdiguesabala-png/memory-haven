@echo off
title Memory Haven - Ouvrir Railway (3 clics)
cd /d "%~dp0"
echo.
echo === PAS de token GitHub ===
echo Ouvrez Railway, cliquez Redeploy, attendez Success.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Ouvrir-Railway.ps1"
