# Memory Haven — utiliser maintenant

## En local (recommandé pour tester tout de suite)

1. Double-clic **`LANCER.bat`**
2. Attendez 2 fenêtres noires (API + site)
3. Navigateur : **http://localhost:5173**
4. Connexion : **marie@demo.local** / **demo1234**
5. Menu → **Membres** → clic sur un membre → **fiche plein écran**

## En ligne (Vercel + Railway)

### Site (Vercel)

1. Ouvrez : **https://memory-haven-frontend.vercel.app/?mh_force=1**
2. Menu ☰ → vérifiez **Build ready-v218**
3. Sinon : **Mettre à jour l'app**

### API (Railway) — obligatoire pour données complètes

1. **https://railway.com/dashboard** → projet → service API
2. **Deployments** → **Redeploy** (branche **main**)
3. Test : https://memory-haven-api-production.up.railway.app/api/health  
   → doit contenir `"membresFicheDetail":true`

Sans Railway à jour, la fiche affiche quand même **toutes les rubriques** (champs vides en « — »).

## Fiche membre

- **Membres** → clic sur une carte → page **/membre/123**
- **Votre profil** → **Mon compte** (modifier tous les champs)

## Dépannage

| Problème | Solution |
|----------|----------|
| Ancien écran jaune | `mh_force=1` ou bouton « Mettre à jour l'app » |
| Build pas v218 | Ctrl+F5, navigation privée |
| API limitée | Redeploy Railway (ci-dessus) |
| Local ne démarre pas | `1-INSTALLER.bat` puis `LANCER.bat` |
