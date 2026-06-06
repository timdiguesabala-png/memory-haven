# Récupérer tous les comptes déjà créés (migration Supabase Auth)

## Ce qui est conservé automatiquement

Tant que la base **PostgreSQL Supabase** contient déjà vos tables Prisma (`Utilisateur`, `Famille`, `Souvenir`, etc.), **rien n’est perdu** :

- emails, noms, rôles, famille
- souvenirs, commentaires, albums, arbre, etc.

Seule la **connexion** change : il faut créer le même email dans **Supabase Auth** et remplir `auth_user_id` sur chaque ligne `Utilisateur`.

## Ce qui n’est PAS récupérable tel quel

Les anciens mots de passe (**bcrypt** dans `Utilisateur.password`) **ne peuvent pas** être copiés dans Supabase.  
Après migration, chaque personne se connecte avec :

- un **mot de passe temporaire** que vous définissez (script), puis
- de préférence **« Mot de passe oublié »** sur le site pour choisir le sien.

---

## Méthode recommandée (1 commande pour tous)

### 1. Préparer `backend/.env`

Copiez `backend/.env.supabase.example` → `backend/.env` et remplissez :

| Variable | Où la trouver |
|----------|----------------|
| `DATABASE_URL` | Supabase → Database → Connection string (pooler **6543**) |
| `DIRECT_URL` | Même base, port **5432** (pour Prisma) |
| `SUPABASE_URL` | `https://VOTRE_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → **service_role** (secret) |

### 2. Vérifier la liste (sans rien modifier)

```powershell
cd backend
node scripts/link-supabase-auth.js --dry-run
```

### 3. Copier les comptes locaux (si vous aviez `prisma/dev.db`)

```powershell
node scripts/sync-sqlite-users-to-supabase.js
```

### 4. Lier tous les comptes actifs (sans clé service_role)

```powershell
node scripts/link-supabase-auth-sql.js --all --password MemoryHaven2026!
```

Remplacez le mot de passe par un mot de passe temporaire **à communiquer à la famille** (min. 6 caractères).

### 4. Envoyer un email « choisir mon mot de passe » (recommandé)

```powershell
node scripts/link-supabase-auth.js --all --password MemoryHaven2026! --send-reset
```

Chaque personne reçoit un lien Supabase pour définir **son** mot de passe.

### 5. Tester

Connectez-vous sur https://memory-haven-frontend.vercel.app avec un email de la liste + le mot de passe temporaire (ou le nouveau après reset).

---

## Double-clic Windows

- **`LIER-TOUS-COMPTES-SUPABASE.bat`** — lie tous les comptes + option reset email  
- **`LIER-COMPTE-SUPABASE.bat`** — un seul email

---

## Méthode manuelle (dashboard Supabase)

Pour peu de comptes :

1. **Authentication → Users → Add user** pour chaque email (Auto Confirm).
2. **SQL Editor** :

```sql
-- Lier tous les emails qui existent des deux côtés
UPDATE "Utilisateur" u
SET "auth_user_id" = au.id
FROM auth.users au
WHERE lower(trim(u.email)) = lower(trim(au.email))
  AND u."auth_user_id" IS NULL;

-- Voir ceux qui manquent encore côté Auth
SELECT id, email, prenom, nom
FROM "Utilisateur"
WHERE "auth_user_id" IS NULL AND "is_active" = true;
```

---

## Où sont les données selon votre ancien déploiement ?

| Ancienne base | Action |
|---------------|--------|
| **Supabase PostgreSQL** (déjà utilisée par l’API) | Migration ci-dessus suffit |
| **Render / Neon / SQLite local** seulement | Exporter vers Supabase d’abord (`npx prisma db push` avec `DATABASE_URL` Supabase + import des données) |

---

## Vérification après migration

```sql
SELECT
  count(*) FILTER (WHERE "auth_user_id" IS NOT NULL) AS lies,
  count(*) FILTER (WHERE "auth_user_id" IS NULL AND "is_active" = true) AS restants
FROM "Utilisateur";
```

`restants` doit être **0** pour que tout le monde puisse se connecter.
