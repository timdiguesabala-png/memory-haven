@echo off
title Memory Haven - Verification locale
cd /d "%~dp0"
echo.
echo === Verification Memory Haven (local) ===
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [X] Node.js non installe - https://nodejs.org
  goto fin
)
echo [OK] Node.js
node -v

echo.
echo Test API http://localhost:3000/api/health ...
powershell -NoProfile -Command "try { $h = Invoke-RestMethod -Uri 'http://localhost:3000/api/health' -TimeoutSec 5; Write-Host '[OK] API' $h.version; if ($h.features.platformPremium -eq $true) { Write-Host '[OK] Toutes les fonctions premium disponibles' -ForegroundColor Green } else { Write-Host '[!] API ancienne - relancez 2-API.bat' -ForegroundColor Yellow }; Write-Host '     Base:' $h.database ' Cloudinary:' $h.cloudinary } catch { Write-Host '[X] API hors ligne - lancez LANCER.bat ou 2-API.bat' -ForegroundColor Red }"

echo.
echo Test site http://localhost:5173 ...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 3 -UseBasicParsing; Write-Host '[OK] Site Vite (port 5173)' -ForegroundColor Green } catch { Write-Host '[X] Site non demarre - lancez 3-SITE.bat ou LANCER.bat' -ForegroundColor Red }"

echo.
echo Compte demo: marie@demo.local / demo1234
echo Guide complet: GUIDE-LOCAL.md
echo.

:fin
pause
