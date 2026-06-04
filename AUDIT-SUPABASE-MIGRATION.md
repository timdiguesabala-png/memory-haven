# Audit — Migration 100 % Supabase (Memory Haven)

**Date :** juin 2026  
**Objectif :** Supprimer Railway / backend Express personnalisé → **Supabase** (Auth, DB, Storage, Realtime) + **Vercel** (frontend).

---

## 1. État actuel de l’architecture

| Composant | Technologie actuelle | Hébergement |
|-----------|---------------------|-------------|
| Frontend | React 19 + Vite | Vercel |
| API REST | Express (~90 routes) | Railway / Render (cible) |
| Temps réel | Socket.io | Même serveur Express |
| Auth | JWT maison + bcrypt + TOTP | Express `/api/auth/*` |
| Base de données | Prisma → SQLite (dev) / PostgreSQL | Railway / Supabase (en cours) |
| Médias | Cloudinary + Supabase Storage (backend) | Cloudinary / Supabase |
| Session client | `localStorage.token` + `utilisateur` | Navigateur |

---

## 2. Inventaire backend Express (à remplacer)

### 2.1 Routes par module

| Module | Fichier | Routes ~ | Rôle |
|--------|---------|----------|------|
| Auth | `auth.js` | 9 | Inscription, connexion, rejoindre, 2FA, me |
| Membres | `membres.js` | 11 | Profil, liste, invitation, avatar |
| Souvenirs | `souvenirs.js` | 6 | CRUD, upload, documents |
| Commentaires | `commentaires.js` | 5 | Fil de commentaires |
| Réactions | `reactions.js` | 2 | Likes / émojis |
| Albums | `albums.js` | 5 | Albums photos |
| Arbre | `arbre.js` | 9 | Généalogie, unions |
| Discussion | `discussion.js` | 7 | Chat famille |
| Notifications | `notifications.js` | 3 | Cloche + préférences |
| Favoris | `favoris.js` | 3 | Favoris souvenirs |
| Platform | `platform.js` | 36 | Accueil premium, stats, IA, 2FA, profil |
| Upload | `upload.js` | 3 | Upload générique |
| **Total** | | **~98** | |

### 2.2 Services & middleware

| Élément | Fichier | Migration Supabase |
|---------|---------|-------------------|
| `verifierToken` (JWT) | `middleware/auth.js` | **Supabase Auth** session + RLS |
| Prisma ORM | `lib/prisma.js` | Client JS `@supabase/supabase-js` |
| Socket.io | `socket.js` | **Supabase Realtime** channels |
| Upload médias | `mediaStorage.js` | **Supabase Storage** (déjà partiel) |
| Cloudinary | `cloudinary.js` | Supabase Storage (prioritaire) |
| TOTP 2FA | `lib/totp.js` | Supabase MFA (phase ultérieure) |

### 2.3 Variables d’environnement (backend)

| Variable | Usage | Remplacement |
|----------|--------|--------------|
| `DATABASE_URL` | Prisma | `SUPABASE` connection string (inchangé côté Postgres) |
| `JWT_SECRET` | Tokens API | **Supprimé** (JWT Supabase) |
| `SUPABASE_URL` | Storage | URL projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage serveur | Clé **service_role** (Edge Functions uniquement) |
| `CLOUDINARY_*` | Uploads | Storage buckets |
| `FRONTEND_URL` | CORS / liens | Vercel URL |
| `PORT` / `RAILWAY_*` / `RENDER_*` | Hébergement API | **Supprimé** (plus d’API Node) |

### 2.4 Variables frontend

| Variable | Usage | Cible |
|----------|--------|-------|
| `VITE_API_URL` | Axios → Express | **Supprimé** progressivement |
| `VITE_SOCKET_URL` | Socket.io | **Supprimé** → Realtime |
| `VITE_SUPABASE_URL` | — | **Nouveau** |
| `VITE_SUPABASE_ANON_KEY` | — | **Nouveau** |
| `VITE_USE_SUPABASE` | — | Flag migration (`true` = mode Supabase) |

---

## 3. Inventaire frontend (appels API)

| Zone | Fichiers principaux | Appels |
|------|---------------------|--------|
| Auth | `Login.jsx`, `Register.jsx` | `/auth/connexion`, `/inscription`, `/rejoindre` |
| Session | `App.jsx`, `api.js` | `token` localStorage |
| Fil souvenirs | `Dashboard.jsx`, `souvenirsApi.js` | `/souvenirs` |
| Profil | `Compte.jsx`, `profileApi.js` | `/membres/me` |
| Membres | `Membres.jsx`, `fetchMembreComplet.js` | `/membres` |
| Discussion | `Discussion.jsx`, `SocketContext` | `/discussion` + socket |
| Plateforme | `platformApi.js`, `Accueil.jsx` | `/platform/*` |
| Arbre | `Arbre.jsx`, `arbreApi.js` | `/arbre` |
| Albums | `Albums.jsx` | `/albums` |
| Autres | Timeline, Carte, Capsules, etc. | `/platform` ou routes dédiées |

**~25 fichiers** importent `api` ou des services HTTP.

---

## 4. Modèle de données (Prisma → Supabase PostgreSQL)

Tables principales (noms Prisma) : `Famille`, `Utilisateur`, `Souvenir`, `Album`, `Commentaire`, `Reaction`, `Tag`, `MembreArbre`, `MessageDiscussion`, `Notification`, etc.

**Changement auth :**

- Colonne `auth_user_id UUID` sur `Utilisateur` → lien `auth.users.id`
- Colonne `password` : **dépréciée** puis supprimée après migration
- RLS : accès par `famille_id` dérivé de `auth.uid()`

---

## 5. Plan de migration par phases

### Phase 1 — Auth ✅ (en cours)

| Action | Statut |
|--------|--------|
| Client Supabase frontend | ✅ `lib/supabaseClient.js` |
| Service auth (login, signup, logout, reset) | ✅ `services/supabaseAuth.js` |
| Contexte session React | ✅ `context/AuthContext.jsx` |
| RPC SQL inscription / rejoindre famille | ✅ `supabase/migrations/001_auth_bridge.sql` |
| Pages Login / Register | ✅ Mode Supabase si `VITE_USE_SUPABASE=true` |
| Récupération mot de passe | ✅ Page `/mot-de-passe-oublie` |

### Phase 2 — Données & Storage ✅ (fil principal)

| Action | Statut |
|--------|--------|
| RLS Souvenir, Commentaire, Reaction, Favori, Tag | ✅ `002_data_rls.sql` |
| Fil souvenirs / commentaires / réactions / favoris | ✅ `feedApi.js` + `supabaseData.js` |
| Création souvenir (Cloudinary → insert Supabase) | ✅ `souvenirsApi.js` |
| Stats dashboard | ✅ RPC `get_family_feed_stats` |
| Albums, arbre, platform, discussion | ⏳ encore Express |
| Upload direct Storage (signed URL) | ⏳ phase ultérieure |
| Migrer données Railway → Supabase | ⏳ export / import |

### Phase 3 — Temps réel ✅ (discussion + cloche)

| Action | Statut |
|--------|--------|
| RLS + Realtime `MessageDiscussion`, `DiscussionReadState`, `Notification` | ✅ `003_realtime_discussion.sql` |
| Discussion CRUD + live | ✅ `discussionApi.js`, `supabaseRealtime.js` |
| Notifications liste / lu + live | ✅ `notificationsApi.js` |
| Typing indicator (broadcast) | ✅ sans Socket.io |
| Socket.io | ⏳ désactivé en mode Supabase (reste pour mode legacy) |
| Notifications souvenir/commentaire via SQL | ⏳ phase ultérieure |

### Phase 4 — Nettoyage

| Action | Cible |
|--------|-------|
| Désactiver / archiver dossier `backend/` Express | Repo |
| Supprimer Railway, Render, workflows | CI/CD |
| Supprimer axios interceptors JWT | Frontend |
| Edge Functions (optionnel) : exports PDF, IA | Supabase Functions |

---

## 6. Mapping fonctionnel → Supabase

| Fonctionnalité actuelle | Solution Supabase |
|-------------------------|-------------------|
| Inscription famille | `auth.signUp` + RPC `register_new_family` |
| Rejoindre avec code | `auth.signUp` + RPC `register_join_family` |
| Connexion | `auth.signInWithPassword` |
| Déconnexion | `auth.signOut` |
| Mot de passe oublié | `auth.resetPasswordForEmail` |
| Vérification email | Dashboard Auth → Email confirmations |
| Session | `auth.getSession` + `onAuthStateChange` |
| Liste membres | `from('Utilisateur').select()` + RLS |
| CRUD souvenirs | `from('Souvenir')` + RLS + Storage |
| Discussion live | `channel().on('postgres_changes')` |
| 2FA TOTP | Supabase MFA ou phase ultérieure |

---

## 7. Éléments à supprimer (fin de migration)

- `backend/src/routes/auth.js` (logique JWT/bcrypt)
- `backend/src/middleware/auth.js`
- `backend/src/lib/totp.js` (si MFA Supabase)
- `backend/src/socket.js`
- `frontend/src/services/socket.js`
- `JWT_SECRET`, `localStorage.token` (legacy)
- Scripts : `push-railway-env.js`, `METTRE-A-JOUR-RAILWAY.md`, etc.
- Dépendances : `jsonwebtoken`, `bcrypt`, `socket.io` (backend)

---

## 8. Risques & prérequis

| Risque | Mitigation |
|--------|------------|
| Email confirmation bloque RPC | Désactiver confirm en dev ; documenter prod |
| RLS mal configuré = fuite données | Tests par famille ; policies review |
| Migration utilisateurs existants | Script lier email → `auth.users` |
| Perte Socket.io pendant transition | Phase 3 prioritaire pour discussion |
| Volume routes platform (36) | Découper en vues SQL + Edge Functions |

---

## 9. Fichiers livrés

**Phase 1 — Auth**

- `supabase/migrations/001_auth_bridge.sql`
- `frontend/src/lib/supabaseClient.js`
- `frontend/src/services/supabaseAuth.js`
- `SUPABASE-AUTH-SETUP.md`

**Phase 2 — Données (fil)**

- `supabase/migrations/002_data_rls.sql`
- `frontend/src/services/supabaseData.js`
- `frontend/src/services/feedApi.js`
- `frontend/src/lib/supabaseHelpers.js`
- `SUPABASE-DATA-SETUP.md`

---

**Prochaine étape recommandée :** exécuter `003_realtime_discussion.sql`, déployer v223, tester la discussion à deux comptes. Phase 4 : retirer Express / Railway.
