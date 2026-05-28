# Solution définitive — upload photos / vidéos / audio

## Ce qui a été corrigé dans le code

| Avant | Après |
|-------|--------|
| Frontend appelait `/api/upload/photo` (souvent en 500 + HTML) | **Un seul flux** : `POST /api/souvenirs` avec fichiers |
| Plusieurs implémentations Cloudinary | **Service unique** `mediaStorage.js` |
| Erreur `Unexpected token '<'` | API renvoie **toujours du JSON** |
| Ancien build Vercel cassé | Routes `/upload/*` **legacy** utilisent le même moteur |

## Une seule fois : compte Cloudinary (gratuit)

1. https://cloudinary.com → inscription gratuite  
2. Dashboard → **API Keys**  
3. Copier : **Cloud name**, **API Key**, **API Secret**

## Railway (backend) — obligatoire

Service `memory-haven-api` → **Variables** :

```
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_cle
CLOUDINARY_API_SECRET=votre_secret
DATABASE_URL=...
JWT_SECRET=...
FRONTEND_URL=https://frontend-one-ashen-17.vercel.app
NODE_ENV=production
```

**Settings** → Root Directory : `backend` (si le repo est monorepo)

**Deployments** → Redeploy

### Vérification

Ouvrir : https://memory-haven-api-production.up.railway.app/api/health

Réponse attendue :

```json
{
  "succes": true,
  "api": "OK",
  "database": "OK",
  "cloudinary": "OK",
  "media": { "ready": true, "provider": "cloudinary" },
  "version": "2-upload-unified"
}
```

Si `"cloudinary":"KO"` → les 3 variables Cloudinary manquent ou sont incorrectes.

## Vercel (frontend) — obligatoire

**Environment Variables** (Production) :

```
VITE_API_URL=https://memory-haven-api-production.up.railway.app/api
VITE_SOCKET_URL=https://memory-haven-api-production.up.railway.app
```

**Deployments** → Redeploy (sans cache)

## Pousser le code

Double-clic : `PUSH-ET-REDEPLOY.bat`  
ou GitHub Desktop → Commit → Push

Sans push + redeploy, le site en ligne garde l’ancien JavaScript (`/upload/photo`).

## Test final

1. https://frontend-one-ashen-17.vercel.app  
2. Connexion : `marie@demo.local` / `demo1234`  
3. **Ajouter** → photo → Publier  
4. F12 → Network : doit afficher `POST .../api/souvenirs` (pas `/upload/photo`)

## En local (sans Cloudinary)

Les fichiers vont dans `backend/uploads/` (servis par l’API).  
Pour la production en ligne, **Cloudinary est obligatoire**.
