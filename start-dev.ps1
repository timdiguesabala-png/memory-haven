# Memory Haven — tout en local (init + serveurs)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

& "$root\init-local.ps1"

Write-Host ""
Write-Host "=== Demarrage serveurs ===" -ForegroundColor Green

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"
Start-Sleep -Seconds 3

if (-not (Test-Path "$root\frontend\node_modules")) {
  Set-Location "$root\frontend"
  npm install
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "Frontend : http://localhost:5173"
Write-Host "API      : http://localhost:3000"
Write-Host "Login    : marie@demo.local / demo1234"
