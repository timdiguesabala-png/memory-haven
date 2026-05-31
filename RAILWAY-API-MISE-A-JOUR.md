# Mettre à jour l’API Railway (obligatoire pour la photo de profil)

## Symptôme

Message **« API Railway pas à jour »** ou photo visible seulement sur un appareil.

## Test rapide

Ouvrez : https://memory-haven-api-production.up.railway.app/api/health

| Réponse | Signification |
|---------|----------------|
| Seulement `"api":"OK","database":"OK"` | **Ancienne API** — suivez ce guide |
| `"version":"18-profile-photo-multipart"` et `"profileAvatar":true` | **À jour** — rechargez le site (Ctrl+F5) |

---

## Étapes Railway (5 minutes)

### 1. Connexion

1. https://railway.com/dashboard  
2. Projet **memory-haven** (ou nom similaire)  
3. Service **API** (URL `memory-haven-api-production`)

### 2. Lier GitHub (si pas déjà fait)

1. **Settings** → **Source**  
2. Repo : `timdiguesabala-png/memory-haven`  
3. Branche : **main**  
4. **Root Directory** :
   - Essayez d’abord **vide** (racine du repo)  
   - Si le build échoue, mettez **`backend`** et redeploy

### 3. Variables d’environnement

**Variables** → vérifiez :

| Variable | Obligatoire |
|----------|-------------|
| `DATABASE_URL` | Oui (PostgreSQL Neon) |
| `JWT_SECRET` | Oui |
| `CLOUDINARY_CLOUD_NAME` | Oui (uploads) |
| `CLOUDINARY_API_KEY` | Oui |
| `CLOUDINARY_API_SECRET` | Oui |
| `FRONTEND_URL` | `https://memory-haven-frontend.vercel.app` |

### 4. Redéployer

1. Onglet **Deployments**  
2. **Deploy** ou **Redeploy** sur le dernier commit  
3. Attendez statut **Success** (2–5 min)  
4. Ouvrez les **Build Logs** en cas d’échec

### 5. Vérifier

https://memory-haven-api-production.up.railway.app/api/health

Doit contenir :

```json
"version": "18-profile-photo-multipart",
"features": { "profileAvatar": true }
```

Puis sur https://memory-haven-frontend.vercel.app → **Mon compte** → ajoutez une photo.

---

## Depuis votre PC (option CLI)

```powershell
cd backend
npx @railway/cli login
npx @railway/cli link
npx @railway/cli up
```

---

## Aide

Si le health ne change pas après redeploy :

- Mauvais service Railway (plusieurs services dans le projet)  
- Build en erreur (lire les logs)  
- Root Directory incorrect : alterner **vide** ↔ **backend**
