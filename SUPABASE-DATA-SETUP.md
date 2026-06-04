# Supabase — Phase 2 : données (fil de souvenirs)

## Prérequis

1. Projet Supabase avec le schéma Prisma déjà poussé (`prisma db push` ou migrations).
2. Migration **001** exécutée : `supabase/migrations/001_auth_bridge.sql`
3. Variables Vercel (ou `.env.local`) :
   - `VITE_USE_SUPABASE=true`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_CLOUDINARY_*` (uploads photos/vidéos)

## Installation SQL

Dans **Supabase → SQL Editor**, exécutez le fichier :

`supabase/migrations/002_data_rls.sql`  
| Erreur | Fichier correctif |
|--------|-------------------|
| `mh_allowed_visibilites` / `Visibilite` | `002c_fix_visibilite_enum.sql` |
| `Favori` does not exist | `002d_favori_table.sql` |
| `DiscussionReadState` | `002b_discussion_tables.sql` |

Cela ajoute :

- Fonctions `mh_user_id`, `mh_famille_id`, `mh_souvenir_readable`, etc.
- RLS sur `Souvenir`, `Commentaire`, `Reaction`, `Favori`, `Tag`, `SouvenirTag`
- RPC `get_family_feed_stats()` pour les stats du tableau de bord

## Comportement frontend (v222)

Avec `VITE_USE_SUPABASE=true`, le **fil principal** n’utilise plus l’API Express pour :

| Fonction | Fichier |
|----------|---------|
| Liste / détail / CRUD souvenirs | `feedApi.js` → `supabaseData.js` |
| Commentaires | `CommentSection.jsx` |
| Réactions, favoris | `Dashboard.jsx` |
| Création souvenir (Cloudinary) | `souvenirsApi.js` |
| Stats famille | `profileApi.js` + RPC |

Les autres pages (albums, arbre, discussion, platform…) restent sur l’API Express jusqu’à la phase suivante.

## Vérification

1. Connexion avec un compte Supabase Auth lié à `Utilisateur.auth_user_id`.
2. Ouvrir le **Dashboard** : les souvenirs de la famille s’affichent.
3. Tester commentaire, réaction, favori, création photo.
4. En cas d’erreur RLS : vérifier que `auth_user_id` est renseigné sur la ligne `Utilisateur`.

## Mode hybride

Tant que `VITE_API_URL` est défini, les modules non migrés continuent d’appeler Express. Le fil peut tourner **100 % Supabase** sans API pour souvenirs/commentaires/réactions/favoris.

## Phase 3 (Realtime)

Voir **`SUPABASE-REALTIME-SETUP.md`** — discussion + cloche sans Socket.io.
