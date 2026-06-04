# Memory Haven — Supabase + Render (sans Railway)

**Architecture cible**

| Rôle | Service |
|------|---------|
| Site web | **Vercel** |
| Base de données | **Supabase PostgreSQL** |
| Fichiers (photos, docs) | **Supabase Storage** (+ Cloudinary optionnel) |
| API Node.js + Socket.io | **Render** (gratuit) — branchée à Supabase |

> Supabase héberge la **donnée** et les **fichiers**. L’API Express existante tourne sur **Render** (Supabase ne fait pas tourner Node.js + Socket.io).

Durée : **~25 minutes**, une seule fois.

---

## Étape 1 — Projet Supabase

1. https://supabase.com/dashboard → **New project**
2. Nom : `memory-haven`, région proche de vous, mot de passe BDD **noté**
3. Attendez que le projet soit **Active**

### Récupérer les clés

**Settings → API**

| Variable | Où la copier |
|----------|----------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (secret — backend uniquement) |
| `SUPABASE_ANON_KEY` | anon (public — optionnel frontend) |

**Settings → Database → Connection string**

- Mode **URI** → **Transaction pooler** (port **6543**) → copiez dans `DATABASE_URL`  
  Ajoutez à la fin : `&pgbouncer=true` si absent  
- Mode **URI** → **Direct** (port **5432**) → copiez dans `DIRECT_URL` (migrations Prisma)

Exemple :

```env
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

---

## Étape 2 — Schéma Prisma sur Supabase

Sur votre PC (avec les URLs ci-dessus dans `backend/.env`) :

```powershell
cd memory_haven\backend
copy .env.supabase.example .env
# Éditez .env avec vos vraies URLs Supabase

node scripts/ensure-local-db.js
npx prisma generate
npx prisma db push
npm run db:seed
```

Ou double-clic **`SETUP-SUPABASE.bat`**.

---

## Étape 3 — Bucket Storage

1. Supabase → **Storage** → **New bucket**
2. Nom : `memory-haven`
3. **Public bucket** : activé (photos familiales accessibles par URL)
4. Dans `backend/.env` : `SUPABASE_STORAGE_BUCKET=memory-haven`

Les uploads API utiliseront Supabase Storage (priorité après Cloudinary si configuré).

---

## Étape 4 — API sur Render (gratuit)

1. https://dashboard.render.com → **New +** → **Blueprint**
2. Repo **timdiguesabala-png/memory-haven** → **Apply** (`render.yaml`)

### Variables Render (Environment)

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL pooler Supabase (6543) |
| `DIRECT_URL` | URL directe Supabase (5432) |
| `JWT_SECRET` | Longue phrase secrète |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role |
| `SUPABASE_STORAGE_BUCKET` | `memory-haven` |
| `FRONTEND_URL` | `https://memory-haven-frontend.vercel.app` |
| `PUBLIC_API_URL` | `https://VOTRE-SERVICE.onrender.com` |
| `CLOUDINARY_*` | Optionnel (sinon Supabase Storage seul) |

3. Attendez **Live**
4. Test : `https://VOTRE-SERVICE.onrender.com/api/health`  
   → `"database":"OK"`, `"storage":"supabase"` ou `"cloudinary"`

---

## Étape 5 — Vercel (frontend)

1. https://vercel.com → projet **memory-haven-frontend**
2. **Settings → Environment Variables** :

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://VOTRE-SERVICE.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://VOTRE-SERVICE.onrender.com` |

3. **Redeploy** → site → **Ctrl+F5** ou `?mh_force=1`

---

## Étape 6 — Couper Railway

1. Ne plus utiliser `memory-haven-api-production.up.railway.app`
2. Supprimez ou pausez le service Railway (économie)
3. Vérifiez que Vercel ne pointe **plus** vers Railway

---

## Local (dev)

Gardez SQLite pour le dev rapide :

```env
DATABASE_URL=file:./dev.db
```

`LANCER.bat` → http://localhost:5173

Pour tester contre Supabase en local : mettez les URLs Supabase dans `backend/.env` puis `2-API.bat`.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `prepared statement already exists` | Utilisez l’URL pooler 6543 + `pgbouncer=true` |
| Migrations Prisma échouent | Utilisez `DIRECT_URL` (5432) pour `prisma db push` |
| Uploads 503 | Créez le bucket `memory-haven` public |
| API sleep Render (free) | Premier appel ~30 s — normal |
| Données vides | Relancez `npm run db:seed` sur Supabase |

---

## Fichiers utiles

- `backend/.env.supabase.example` — modèle variables
- `render.yaml` — déploiement API
- `SETUP-SUPABASE.bat` — push schéma Prisma
- `DEPLOI-SUPABASE.bat` — ouvre Supabase + Render
