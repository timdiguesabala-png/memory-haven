# Memory Haven - deploiement production (Vercel + Render)
# Usage: powershell -File scripts/deploy-production-full.ps1
# Variables lues depuis backend/.env et frontend/.env.production.local (ou .env.production)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$backendEnv = Join-Path $root "backend\.env"

function Read-DotEnv {
  param([string]$Path)
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path -Encoding UTF8 | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $k = $matches[1].Trim()
      $v = $matches[2].Trim().Trim('"').Trim("'")
      $map[$k] = $v
    }
  }
  return $map
}

Write-Host "=== 1/4 Mise a jour backend/.env (pooler Supabase) ===" -ForegroundColor Cyan
Set-Location (Join-Path $root "backend")
node scripts/ensure-render-env.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$be = Read-DotEnv $backendEnv
$fe = Read-DotEnv (Join-Path $root "frontend\.env.production.local")
if (-not $fe['VITE_SUPABASE_ANON_KEY']) {
  $fe = Read-DotEnv (Join-Path $root "frontend\.env.production")
}

$supabaseUrl = if ($fe['VITE_SUPABASE_URL']) { $fe['VITE_SUPABASE_URL'] } else { $be['SUPABASE_URL'] }
$anonKey = $fe['VITE_SUPABASE_ANON_KEY']
$cloudName = $fe['VITE_CLOUDINARY_CLOUD_NAME']
if (-not $anonKey) {
  Write-Host "VITE_SUPABASE_ANON_KEY manquant — copiez frontend/.env.production.example vers .env.production.local" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== 2/4 Variables Vercel (API Render + Supabase) ===" -ForegroundColor Cyan
Set-Location (Join-Path $root "frontend")

$vercelVars = @{
  VITE_USE_SUPABASE             = "true"
  VITE_APP_URL                  = "https://memory-haven-frontend.vercel.app"
  VITE_SUPABASE_URL             = $supabaseUrl
  VITE_SUPABASE_ANON_KEY        = $anonKey
  VITE_API_URL                  = "https://memory-haven-api.onrender.com/api"
  VITE_SOCKET_URL               = "https://memory-haven-api.onrender.com"
  VITE_CLOUDINARY_CLOUD_NAME    = $cloudName
  VITE_CLOUDINARY_UPLOAD_PRESET = "memory_haven_unsigned"
}

$projects = @("memory-haven-frontend", "memory_haven")
foreach ($project in $projects) {
  Write-Host "Projet: $project"
  npx vercel link --project $project --yes 2>&1 | Out-Null
  foreach ($entry in $vercelVars.GetEnumerator()) {
    if (-not $entry.Value) { continue }
    Write-Host "  -> $($entry.Key)"
    $entry.Value | npx vercel env add $entry.Key production --force 2>&1 | Out-Null
  }
}

Write-Host ""
Write-Host "=== 3/4 Deploiement Vercel production ===" -ForegroundColor Green
npx vercel link --project memory-haven-frontend --yes 2>&1 | Out-Null
npx vercel deploy --prod --yes

Write-Host ""
Write-Host "=== 4/4 Render (variables API) ===" -ForegroundColor Cyan
Set-Location (Join-Path $root "backend")
if ($env:RENDER_API_KEY -or (Select-String -Path $backendEnv -Pattern "^RENDER_API_KEY=" -Quiet)) {
  node scripts/push-render-env.js
} else {
  node scripts/export-render-env.js
  Write-Host ""
  Write-Host "RENDER_API_KEY absent - fichier backend/.render-import.env genere." -ForegroundColor Yellow
  Write-Host "Render: memory-haven-api / Environment / redeploy manuel" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Site: https://memory-haven-frontend.vercel.app/?mh_force=1"
Write-Host "API:  https://memory-haven-api.onrender.com/api/health"
Write-Host "Doc:  DEPLOI-PRODUCTION.md"
