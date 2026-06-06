# Memory Haven - production Supabase (sans Railway)
# Usage: powershell -File scripts/deploy-supabase-vercel.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

$vars = @{
  VITE_USE_SUPABASE             = "true"
  VITE_SUPABASE_URL             = "https://qazdsbeyhryodbtytzik.supabase.co"
  VITE_SUPABASE_ANON_KEY        = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhemRzYmV5aHJ5b2RidHl0emlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODMzODUsImV4cCI6MjA5MDk1OTM4NX0.wiqbhCFiYisIavT6DBRZmVdMT5IgWTgNwHoQsjxCDiw"
  VITE_CLOUDINARY_CLOUD_NAME    = "deochtv65"
  VITE_CLOUDINARY_UPLOAD_PRESET = "memory_haven_unsigned"
}

$projects = @("memory-haven-frontend", "memory_haven")
$removeKeys = @("VITE_API_URL", "VITE_SOCKET_URL")

Set-Location (Join-Path $root "frontend")

foreach ($project in $projects) {
  Write-Host ""
  Write-Host "=== Projet Vercel: $project ===" -ForegroundColor Cyan
  npx vercel link --project $project --yes 2>&1 | Out-Null

  foreach ($key in $removeKeys) {
    Write-Host "Suppression $key"
    echo "y" | npx vercel env rm $key production 2>&1 | Out-Null
  }

  foreach ($entry in $vars.GetEnumerator()) {
    Write-Host "  -> $($entry.Key)"
    $entry.Value | npx vercel env add $entry.Key production --force 2>&1 | Out-Null
  }
}

Write-Host ""
Write-Host "=== Deploiement production memory-haven-frontend ===" -ForegroundColor Green
npx vercel link --project memory-haven-frontend --yes 2>&1 | Out-Null
npx vercel deploy --prod --yes

Write-Host ""
Write-Host "OK - Site: https://memory-haven-frontend.vercel.app/?mh_force=1"
Write-Host "Auth, fil, discussion, membres = Supabase direct."
