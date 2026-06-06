@echo off
title Debloquer memory-haven-frontend sur Vercel
cd /d "%~dp0frontend"
echo.
echo Ce script met en pause le pare-feu automatique Vercel (24 h)
echo et desactive le mode attaque sur memory-haven-frontend.
echo.
echo Confirmez les questions dans la fenetre si demande.
echo.
call npx vercel firewall system-mitigations pause
call npx vercel firewall attack-mode disable
echo.
echo Attendez 1 minute puis double-cliquez OUVRIR-MEMORY-HAVEN.bat
echo.
pause
