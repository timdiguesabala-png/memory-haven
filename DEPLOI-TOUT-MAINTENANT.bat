@echo off
title Memory Haven - Deploiement complet
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\deploy-production-full.ps1"
pause
