# Supabase Auth — Memory Haven (phase 1)

## Activer le mode Supabase

### 1. Supabase Dashboard

1. **Authentication → Providers → Email** : activé
2. **Authentication → Email** : pour les tests, désactivez « Confirm email » (réactivez en prod si besoin)
3. **Authentication → URL Configuration** :
   - Site URL : `https://memory-haven-frontend.vercel.app`
   - Redirect URLs :  
     `https://memory-haven-frontend.vercel.app/**`  
     `http://localhost:5173/**`

### 2. SQL

Exécutez **`supabase/migrations/001_auth_bridge.sql`** dans **SQL Editor**.

### 3. Schéma Prisma sur Supabase

```powershell
cd backend
copy .env.supabase.example .env
# Remplir DATABASE_URL + DIRECT_URL
node scripts/ensure-local-db.js
npx prisma db push
```

### 4. Variables Vercel

| Variable | Valeur |
|----------|--------|
| `VITE_USE_SUPABASE` | `true` |
| `VITE_SUPABASE_URL` | URL projet |
| `VITE_SUPABASE_ANON_KEY` | clé **anon** publique |
| `VITE_API_URL` | URL API (Render temporaire, phase 2 sans Express) |
| `VITE_SOCKET_URL` | idem |

### 5. Test local

`frontend/.env.development.local` :

```env
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Backend local avec `DATABASE_URL` Supabase pour RPC.

---

## Fonctions livrées

| Fonction | Implémentation |
|----------|----------------|
| Inscription famille | `signUp` + `register_new_family` |
| Rejoindre code | `signUp` + `register_join_family` |
| Connexion | `signInWithPassword` |
| Déconnexion | `signOut` |
| Mot de passe oublié | `/mot-de-passe-oublie` |
| Nouveau mot de passe | `/reinitialiser-mot-de-passe` |
| Session | `AuthContext` + `onAuthStateChange` |
| Vérification email | Supabase (si activé dans dashboard) |

---

## Mode hybride (transition)

- `VITE_USE_SUPABASE=false` → ancien JWT + Express (inchangé)
- `VITE_USE_SUPABASE=true` → Auth Supabase ; **données** encore via API Express (phase 2)

Voir **`AUDIT-SUPABASE-MIGRATION.md`** pour le plan complet.
