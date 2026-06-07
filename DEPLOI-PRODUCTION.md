# Déploiement production — Memory Haven

Architecture cible (2026) :

| Couche | Service | URL |
|--------|---------|-----|
| Frontend | Vercel | https://memory-haven-frontend.vercel.app |
| Auth + données core | Supabase | `https://qazdsbeyhryodbtytzik.supabase.co` |
| API (albums, arbre, sockets, uploads) | Render | https://memory-haven-api.onrender.com |

Railway est **abandonné** (workflow GitHub désactivé au push).

---

## Prérequis locaux

- Node.js 20+
- Compte Vercel CLI (`npx vercel login`)
- Fichier `backend/.env` rempli (voir `backend/.env.supabase.example`)
- Optionnel : `RENDER_API_KEY` pour pousser les variables Render automatiquement

---

## 1. Base Supabase (une fois)

Dans le **SQL Editor** Supabase, exécuter les migrations dans l’ordre :

`001` → `002c` → `002d` → `002` → `002b` → `003` → `004` → `005` → `006` → `007`

Ou depuis le poste de dev :

```powershell
cd backend
node scripts/apply-schema-grants.js
# Puis appliquer 007_tighten_anon_grants.sql dans le SQL Editor
```

**DATABASE_URL Render** : utiliser le **pooler** (port **6543**, `?pgbouncer=true`), pas le port 5432 direct.

---

## 2. Variables d’environnement

### Vercel (frontend)

Project → **Settings → Environment Variables** (Production) :

| Variable | Valeur |
|----------|--------|
| `VITE_USE_SUPABASE` | `true` |
| `VITE_SUPABASE_URL` | `https://qazdsbeyhryodbtytzik.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | clé anon / publishable Supabase |
| `VITE_API_URL` | `https://memory-haven-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://memory-haven-api.onrender.com` |
| `VITE_CLOUDINARY_CLOUD_NAME` | votre cloud |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `memory_haven_unsigned` |

Modèle local : `frontend/.env.production.example` (ne jamais committer les vraies clés).

### Render (API)

Voir `backend/.render-import.env` généré par `node scripts/export-render-env.js`, ou :

```powershell
cd backend
node scripts/push-render-env.js   # si RENDER_API_KEY est défini
node scripts/trigger-render-deploy.js   # redeploy seul (sans changer les vars)
```

Variables obligatoires : `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLOUDINARY_*`, `FRONTEND_URL`, `PUBLIC_API_URL`.

---

## 3. Déployer tout

**Script tout-en-un** (Vercel prod + export Render) :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-production-full.ps1
```

**Raccourci Windows** : double-clic `DEPLOI-TOUT-MAINTENANT.bat`

**Frontend seul** : `DEPLOY-VERCEL-FRONTEND.bat`

**Render** : push sur `main` si le service est lié au repo, ou redeploy manuel depuis le dashboard Render après mise à jour des variables.

---

## 4. Vérifications

```powershell
# API
curl https://memory-haven-api.onrender.com/api/health

# Frontend (navigation privée)
# https://memory-haven-frontend.vercel.app/register
```

Attendu health : `database: ok`, `supabase: ok`, `cloudinary: ok`.

---

## 5. CI GitHub

À chaque push / PR sur `main` :

- **backend** : `npm test` (7 tests unitaires)
- **frontend** : `npm run lint`

Workflow : `.github/workflows/ci.yml`

---

## 6. Scripts utiles (`backend/scripts/`)

| Script | Usage |
|--------|--------|
| `wipe-all-app-data.js --confirm WIPE` | Efface toutes les données + comptes auth |
| `reset-all-passwords.js` | Réinitialise les mots de passe Supabase |
| `fix-auth-users-nulls.js` | Corrige colonnes NULL dans `auth.users` |
| `apply-schema-grants.js` | Applique migration 006 |
| `show-recovery-status.js` | État familles / comptes |

---

## 7. Dépannage

| Problème | Action |
|----------|--------|
| `permission denied for schema public` | Appliquer `006_public_schema_grants.sql` |
| Login 500 après migration | `fix-auth-users-nulls.js` + `fix-auth-identities.js` |
| Rate limit inscription Supabase | Attendre 15 min ou désactiver confirmation email (Auth → Providers) |
| 403 Vercel pare-feu | `DEBLOQUER-VERCEL.bat` |
| API Render sleep (plan free) | Première requête ~30 s — normal |

---

## 8. Sécurité repo

- `frontend/.env.production` et `backend/.env*` sont dans `.gitignore`
- Ne pas committer de clés ; utiliser Vercel / Render / Supabase dashboards
- Si des clés ont fuité : rotation dans Supabase + Vercel + Render
