@echo off
title Push GitHub - Memory Haven
cd /d "%~dp0"

echo.
echo === Push vers GitHub (declenche Railway + Vercel) ===
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo Git non installe. Utilisez GitHub Desktop:
  echo   Commit + Push origin
  pause
  exit /b 1
)

git status
echo.
set /p MSG=Message du commit [Fix production]: 
if "%MSG%"=="" set MSG=Solution definitive upload (souvenirs + mediaStorage)

git add .
git commit -m "%MSG%"
git push

echo.
echo === Apres le push ===
echo 1. Railway: Deployments - attendre le vert
echo 2. Vercel: Redeploy le frontend
echo 3. Health: https://memory-haven-api-production.up.railway.app/api/health
echo    cloudinary OK + version 2-upload-unified
echo.
echo Guide complet: SOLUTION-DEFINITIVE.md
echo.
pause
