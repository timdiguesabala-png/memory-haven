#j# Déploiement Vercel + Supabase (Memory Haven)

## 1. Variables Vercel (Production)

**Project → Settings → Environment Variables**

| Variable | Obligatoire | Exemple |
|----------|-------------|---------|
| `VITE_USE_SUPABASE` | **oui** | `true` |
| `VITE_SUPABASE_URL` | **oui** | `https://xxxx.supabase.co` (**sans** `/rest/v1` à la fin) |
| `VITE_SUPABASE_ANON_KEY` | **oui** | clé **Publishable** (`sb_publishable_…`) ou legacy **anon** (`eyJ…`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | oui (médias) | voir `.env.production` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | oui | `memory_haven_unsigned` |
| `VITE_API_URL` | hybride | URL Render **ou** laisser pour albums/arbre/platform |
| `VITE_SOCKET_URL` | legacy | inutile si `VITE_USE_SUPABASE=true` |

Après modification → **Deployments → Redeploy** (décocher cache si ancienne version).

## 2. Base Supabase (une fois)

```powershell
cd backend
copy .env.supabase.example .env
# Remplir DATABASE_URL (pooler 6543) et DIRECT_URL (5432)
npx prisma db push
```

Puis SQL Editor (si pas déjà fait) : `001` → `002c` → `002d` → `002` → `002b` → `003` → `004` → `005`.

## 3. Déployer le frontend

- **Auto** : `git push origin main` (Vercel lié à GitHub)
- **Manuel** : double-clic `DEPLOY-VERCEL-FRONTEND.bat`

## 4. URLs et dépannage

| URL | Projet Vercel | Rôle |
|-----|---------------|------|
| https://memory-haven-frontend.vercel.app | `memory-haven-frontend` | **Principal** |
| https://memoryhaven-two.vercel.app | `memory_haven` | Secours (même build + Supabase) |

- Ouvrir : `OUVRIR-MEMORY-HAVEN.bat`
- Tout redéployer : `DEPLOY-TOUT-VERCEL.bat`
- **403** avec `X-Vercel-Mitigated: deny` : `DEBLOQUER-VERCEL.bat` (pause pare-feu 24 h)

Auth SSO désactivée sur les deux projets. Version actuelle : **`vercel-fix-v225`** (menu ☰).

### Ne pas utiliser ces liens (401 / page de login Vercel)

- `https://memory-haven-frontend-xxxxx-timdiguesabala-pngs-projects.vercel.app`
- Bouton **Visit** sur un déploiement dans le tableau de bord Vercel

Ce sont des URLs **protégées** ; inutile de désactiver l’auth équipe pour y accéder — utilisez l’alias court ci-dessus.

### Option A — recommandée (sans phrase de confirmation)

1. Projet **`memory-haven-frontend`** → **Settings** → **Deployment Protection**
2. Section **Deployment Protection Exceptions** (ou *Exceptions*)
3. Ajouter : `memory-haven-frontend.vercel.app`
4. Enregistrer → ouvrir en navigation privée : https://memory-haven-frontend.vercel.app

Ce domaine devient public ; le reste de l’équipe peut rester protégé.

### Option B — désactiver « Authentification Vercel »

Si le bouton reste gris avec *« Ça ne correspond pas »* :

- La phrase affichée utilise souvent une **apostrophe courbe** `’` (U+2019), pas `'` du clavier.
- Copier-coller **uniquement** le texte entre guillemets depuis le modal (ne pas retaper).
- Variantes à tester si besoin : `Désactiver l'authentification Vercel` / `Désactiver l’authentification Vercel`

Sur le **projet** (pas seulement l’équipe) : **Standard Protection** → *Only Preview Deployments* ou *None* pour la prod.

### URL à utiliser

- ✅ `https://memory-haven-frontend.vercel.app`
- ❌ URL longue `…-timdiguesabala-png-projects.vercel.app` (souvent encore protégée)

## 5. Vérifier

- https://memory-haven-frontend.vercel.app/?mh_force=1
- Menu ☰ → build `vercel-fix-v225` (ou plus récent)
- Connexion → Dashboard → Membres → Discussion

## 6. Mode hybride

Sans `VITE_API_URL` fonctionnel : **Dashboard + Discussion** OK en Supabase seul ; **Albums, Arbre, Platform** restent vides ou en erreur jusqu’à migration phase suivante.
