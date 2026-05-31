# Railway terminé ? → Passez sur Render (gratuit)

**Railway n’est plus obligatoire.** Memory Haven peut tourner avec :

| Rôle | Service | Prix |
|------|---------|------|
| Site web | **Vercel** | Gratuit ✅ (déjà en place) |
| API | **Render** | Gratuit ✅ |
| Base de données | **Neon** | Gratuit ✅ |
| Photos | **Cloudinary** | Gratuit ✅ |

Durée : **~20 minutes**, une seule fois.

---

## Avant de commencer — récupérer vos données (si possible)

Si Railway est **encore accessible en lecture** (même sans payer) :

1. Ouvrez Railway → projet → service API → **Variables**
2. **Copiez** dans un fichier texte :
   - `DATABASE_URL` (si c’est une URL Neon, gardez-la !)
   - `JWT_SECRET`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

> Si `DATABASE_URL` commence par `postgresql://` et contient **neon.tech**, votre base est sur **Neon** — vous ne perdez pas les données, seulement l’hébergement API.

---

## Étape 1 — Neon (base de données)

**Si vous avez déjà `DATABASE_URL` Neon** → passez à l’étape 2.

Sinon :

1. https://console.neon.tech → créez un compte (gratuit)
2. **New project** → nom : `memory-haven`
3. **Connection string** → copiez l’URL (commence par `postgresql://…`)

---

## Étape 2 — Render (API gratuite)

1. https://dashboard.render.com → compte gratuit (GitHub)
2. **New +** → **Blueprint** (ou **Web Service**)
3. Connectez le repo **timdiguesabala-png/memory-haven**
4. Render détecte **`render.yaml`** → **Apply**

### Variables à renseigner (Environment)

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL Neon (étape 1 ou copiée de Railway) |
| `JWT_SECRET` | Une longue phrase secrète (ou celle de Railway) |
| `CLOUDINARY_CLOUD_NAME` | Votre cloud Cloudinary |
| `CLOUDINARY_API_KEY` | … |
| `CLOUDINARY_API_SECRET` | … |
| `FRONTEND_URL` | `https://memory-haven-frontend.vercel.app` |

5. Attendez le build **Success** (5–10 min)
6. Notez l’URL Render, ex. : `https://memory-haven-api.onrender.com`

### Test

Ouvrez : `https://VOTRE-API.onrender.com/api/health`

✅ OK si vous voyez `"database":"OK"` et `"platformPremium":true`

---

## Étape 3 — Vercel (pointer vers Render)

1. https://vercel.com → projet **memory-haven-frontend**
2. **Settings** → **Environment Variables**
3. Modifiez :
   - `VITE_API_URL` = `https://VOTRE-API.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://VOTRE-API.onrender.com`
4. **Deployments** → dernier déploiement → **Redeploy**

Puis sur le site : **Ctrl+F5**

---

## Compte démo (si base neuve)

Après le premier déploiement Render, le seed crée :

- Email : `marie@demo.local`
- Mot de passe : `demo1234`

---

## Plan gratuit Render — à savoir

- L’API **s’endort** après ~15 min sans visite
- Le **premier chargement** peut prendre 30–60 secondes (normal)
- Les photos passent par **Cloudinary**, pas par Render

---

## Aide

Double-clic : **`Ouvrir-Render.ps1`** (ouvre Neon + Render + guide).

Guide complet : **`DEPLOY.md`**

Envoyez une capture de l’écran Render (build ou variables) si vous êtes bloqué.
