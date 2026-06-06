# Copie la config Production de memory-haven-frontend vers memory_haven (secours)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

$vars = @{
  VITE_USE_SUPABASE            = "true"
  VITE_SUPABASE_URL            = "https://qazdsbeyhryodbtytzik.supabase.co"
  VITE_SUPABASE_ANON_KEY       = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhemRzYmV5aHJ5b2RidHl0emlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODMzODUsImV4cCI6MjA5MDk1OTM4NX0.wiqbhCFiYisIavT6DBRZmVdMT5IgWTgNwHoQsjxCDiw"
  VITE_API_URL                 = "https://memory-haven-api.onrender.com/api"
  VITE_SOCKET_URL              = "https://memory-haven-api.onrender.com"
  VITE_CLOUDINARY_CLOUD_NAME   = "deochtv65"
  VITE_CLOUDINARY_UPLOAD_PRESET = "memory_haven_unsigned"
}

Set-Location (Join-Path $root "frontend")
npx vercel link --project memory_haven --yes | Out-Null

foreach ($entry in $vars.GetEnumerator()) {
  Write-Host "memory_haven -> $($entry.Key)"
  $entry.Value | npx vercel env add $entry.Key production --force 2>&1 | Out-Null
}

Write-Host "Variables OK sur memory_haven."
