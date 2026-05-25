# Initialisation locale Memory Haven
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "=== Init Memory Haven (local) ===" -ForegroundColor Cyan

foreach ($port in 3000, 5173) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

Set-Location "$root\backend"

if (-not (Test-Path "node_modules")) { npm install }

Copy-Item "$root\backend\prisma\schema.sqlite.prisma" "$root\backend\prisma\schema.prisma" -Force
$env:DATABASE_URL = "file:./dev.db"
npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed

Write-Host ""
Write-Host "OK — Base prete" -ForegroundColor Green
Write-Host "Compte : marie@demo.local / demo1234"
Write-Host ""
Write-Host "Lancez ensuite dans 2 terminaux :"
Write-Host "  cd backend  && npm run dev"
Write-Host "  cd frontend && npm run dev"
Write-Host "Puis : http://localhost:5173"
