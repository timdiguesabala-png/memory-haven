# Connexion — pourquoi « mot de passe incorrect » ?

Le site en production utilise **Supabase Auth**. Les identifiants de l’**ancienne API** (Render, `marie@demo.local`, etc.) **ne sont pas** dans Supabase tant qu’on ne les a pas liés.

## Solution rapide (nouvelle famille)

1. Allez sur https://memory-haven-frontend.vercel.app/register  
2. **Créer une famille** avec votre email et un **nouveau** mot de passe  
3. Connectez-vous avec ce compte  

## Garder l’ancien email et les souvenirs (admin)

### Option A — Script (recommandé)

1. Supabase → **Settings → API** → copiez **service_role** (secret, ne pas mettre sur Vercel frontend).  
2. Créez `backend/.env` avec `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.  
3. Dans un terminal :

```powershell
cd backend
node scripts/link-supabase-auth.js --email VOTRE@email.com --password VotreMotDePasse
```

Pour **tous** les comptes : voir le guide complet **`MIGRER-TOUS-LES-COMPTES.md`** ou double-clic **`LIER-TOUS-COMPTES-SUPABASE.bat`**.

```powershell
node scripts/link-supabase-auth.js --dry-run
node scripts/link-supabase-auth.js --all --password MemoryHaven2026! --send-reset
```

4. Chaque personne se connecte avec son **email** + mot de passe temporaire, ou le lien reçu par mail.

### Option B — Dashboard Supabase

1. **Authentication → Users → Add user** : même email qu’avant, mot de passe choisi, cochez **Auto Confirm**.  
2. **SQL Editor** :

```sql
UPDATE "Utilisateur" u
SET "auth_user_id" = au.id
FROM auth.users au
WHERE lower(trim(u.email)) = lower(trim(au.email))
  AND u."auth_user_id" IS NULL;
```

## Email non confirmé

Supabase → **Authentication → Providers → Email** → désactivez **Confirm email** pour les tests, ou cliquez le lien reçu par mail.

## Mot de passe oublié

Fonctionne **seulement** si l’email existe déjà dans **Authentication → Users**. Sinon créez le compte (inscription ou option A/B ci-dessus).
