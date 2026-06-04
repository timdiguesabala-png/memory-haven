# Déploiement Vercel + Supabase (Memory Haven)

## 1. Variables Vercel (Production)

**Project → Settings → Environment Variables**

| Variable | Obligatoire | Exemple |
|----------|-------------|---------|
| `VITE_USE_SUPABASE` | **oui** | `true` |
| `VITE_SUPABASE_URL` | **oui** | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | **oui** | clé **anon** (publique) |
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

## 4. Vérifier

- https://memory-haven-frontend.vercel.app/?mh_force=1
- Menu ☰ → build `supabase-realtime-v223` (ou plus récent)
- Connexion → Dashboard → Membres → Discussion

## 5. Mode hybride

Sans `VITE_API_URL` fonctionnel : **Dashboard + Discussion** OK en Supabase seul ; **Albums, Arbre, Platform** restent vides ou en erreur jusqu’à migration phase suivante.
