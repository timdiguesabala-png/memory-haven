# Redéploiement — tes URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://frontend-one-ashen-17.vercel.app |
| **API** | https://memory-haven-api-production.up.railway.app |
| **Health** | https://memory-haven-api-production.up.railway.app/api/health |

---

## Étape 1 — Pousser le code sur GitHub

GitHub Desktop :

1. Ouvre le dépôt **memory-haven**
2. Commit : `Fix upload via POST /souvenirs (sans /upload/photo)`
3. **Push origin**

---

## Étape 2 — Railway (backend)

1. https://railway.com → service **memory-haven-api**
2. **Variables** — vérifie :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL Neon PostgreSQL |
| `JWT_SECRET` | chaîne secrète |
| `CLOUDINARY_CLOUD_NAME` | ta cloud name |
| `CLOUDINARY_API_KEY` | ta clé |
| `CLOUDINARY_API_SECRET` | ton secret |
| `FRONTEND_URL` | `https://frontend-one-ashen-17.vercel.app` |

3. **Deployments** → **Redeploy** (dernier commit)

4. Test : https://memory-haven-api-production.up.railway.app/api/health

   Doit afficher :
   ```json
   {"succes":true,"api":"OK","database":"OK","cloudinary":"OK"}
   ```

   Si `"cloudinary":"KO"` → variables Cloudinary manquantes sur Railway.

---

## Étape 3 — Vercel (frontend)

1. https://vercel.com → projet frontend
2. **Settings** → **Environment Variables** :

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://memory-haven-api-production.up.railway.app/api` |
| `VITE_SOCKET_URL` | `https://memory-haven-api-production.up.railway.app` |

(Coche **Production**)

3. **Deployments** → **Redeploy** (sans cache si possible)

Le fichier `frontend/.env.production` contient déjà ces valeurs pour les builds futurs.

---

## Étape 4 — Tester

1. Ouvre https://frontend-one-ashen-17.vercel.app
2. Login : `marie@demo.local` / `demo1234`
3. Ajoute une photo

---

## Compte démo

- Email : `marie@demo.local`
- Mot de passe : `demo1234`
