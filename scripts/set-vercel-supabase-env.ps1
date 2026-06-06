# Ajoute les variables Supabase sur Vercel (Production)
# Usage : .\scripts\set-vercel-supabase-env.ps1 -Url "https://xxx.supabase.co" -AnonKey "eyJ..."

param(
  [Parameter(Mandatory = $true)]
  [string]$Url,
  [Parameter(Mandatory = $true)]
  [string]$AnonKey
)

$root = Split-Path $PSScriptRoot -Parent
Set-Location (Join-Path $root "frontend")

function Add-VercelEnv($name, $value) {
  Write-Host "→ $name"
  $value | npx vercel env add $name production --force 2>&1
}

Add-VercelEnv "VITE_USE_SUPABASE" "true"
Add-VercelEnv "VITE_SUPABASE_URL" $Url.Trim()
Add-VercelEnv "VITE_SUPABASE_ANON_KEY" $AnonKey.Trim()

Write-Host ""
Write-Host "OK. Lancez un Redeploy sur Vercel (ou: npx vercel deploy --prod --yes)"
