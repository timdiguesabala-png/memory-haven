# Ouvre Railway et la page de test — double-clic ou clic droit > Exécuter avec PowerShell
Write-Host ""
Write-Host "=== Memory Haven - Mise a jour API Railway ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Le navigateur va ouvrir Railway (connectez-vous si demande)."
Write-Host "2. Cliquez votre projet > service API > onglet Deployments > Redeploy."
Write-Host "3. Attendez Success (vert), puis appuyez sur une touche ici pour tester l'API."
Write-Host ""

Start-Process "https://railway.com/dashboard"
Start-Sleep -Seconds 2
Start-Process "https://memory-haven-api-production.up.railway.app/api/health"

Read-Host "Quand le redeploy est termine, appuyez sur Entree pour verifier l'API"

try {
  $health = Invoke-RestMethod -Uri "https://memory-haven-api-production.up.railway.app/api/health" -TimeoutSec 30
  $json = $health | ConvertTo-Json -Compress
  Write-Host ""
  Write-Host $json
  Write-Host ""
  if ($health.version -eq "21-platform-premium-v201") {
    Write-Host "OK - API a jour ! Ouvrez le site et faites Ctrl+F5." -ForegroundColor Green
    Start-Process "https://memory-haven-frontend.vercel.app"
  } else {
    Write-Host "Pas encore a jour - refaites Redeploy sur Railway puis relancez ce script." -ForegroundColor Yellow
  }
} catch {
  Write-Host "Erreur de connexion a l'API: $_" -ForegroundColor Red
}

Read-Host "Appuyez sur Entree pour fermer"
