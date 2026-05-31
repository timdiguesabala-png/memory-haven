# Railway expire ? Utilisez Render (gratuit) — voir SANS-RAILWAY-RENDER.md
Write-Host ""
Write-Host "=== Memory Haven - API sur Render (GRATUIT) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Railway : vous n'en avez plus besoin."
Write-Host ""
Write-Host "Etapes : Neon (BDD) -> Render (API) -> Vercel (variables)"
Write-Host "Guide : SANS-RAILWAY-RENDER.md"
Write-Host ""

$guide = Join-Path $PSScriptRoot "SANS-RAILWAY-RENDER.md"
if (Test-Path $guide) { Start-Process $guide }

Start-Process "https://console.neon.tech"
Start-Sleep -Seconds 2
Start-Process "https://dashboard.render.com"
Start-Sleep -Seconds 1
Start-Process "https://vercel.com/timdiguesabala-pngs-projects/memory-haven-frontend/settings/environment-variables"

Read-Host "Appuyez sur Entree quand vous avez fini (ou pour fermer)"
