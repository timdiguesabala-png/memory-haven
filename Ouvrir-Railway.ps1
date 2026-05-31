# Double-clic : ouvre Railway + guide + test API
Write-Host ""
Write-Host "=== Memory Haven - Mise a jour API (3 clics) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Actions : IGNOREZ (tokens compliques)."
Write-Host ""
Write-Host "1. Railway va s'ouvrir dans le navigateur."
Write-Host "2. Projet memory-haven > service API > Deployments > Redeploy"
Write-Host "3. Attendez Success (vert), puis appuyez Entree ici."
Write-Host ""

$guide = Join-Path $PSScriptRoot "GUIDE-RAILWAY-3-CLICS.md"
if (Test-Path $guide) { Start-Process $guide }

Start-Process "https://railway.com/dashboard"
Start-Sleep -Seconds 2
Start-Process "https://memory-haven-api-production.up.railway.app/api/health"

Read-Host "Quand le redeploy est termine (Success vert), appuyez sur Entree"

try {
  $health = Invoke-RestMethod -Uri "https://memory-haven-api-production.up.railway.app/api/health" -TimeoutSec 30
  $json = $health | ConvertTo-Json -Compress
  Write-Host ""
  Write-Host $json
  Write-Host ""
  if ($health.features.platformPremium -eq $true) {
    Write-Host "OK - API a jour ! Ouvrez le site et faites Ctrl+F5." -ForegroundColor Green
    Start-Process "https://memory-haven-frontend.vercel.app"
  } elseif ($health.version) {
    Write-Host "Version: $($health.version) - pas encore la derniere. Refaites Redeploy." -ForegroundColor Yellow
  } else {
    Write-Host "Encore l'ancienne API. Verifiez : repo GitHub lie + Redeploy sur le bon service." -ForegroundColor Yellow
    Write-Host "Lisez GUIDE-RAILWAY-3-CLICS.md sur le Bureau du projet." -ForegroundColor Yellow
  }
} catch {
  Write-Host "Erreur connexion API: $_" -ForegroundColor Red
}

Read-Host "Entree pour fermer"
