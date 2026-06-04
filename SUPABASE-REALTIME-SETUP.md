# Supabase — Phase 3 : Discussion & notifications (Realtime)

## Prérequis

- Migrations **001** et **002** déjà exécutées
- `VITE_USE_SUPABASE=true` sur Vercel
- Realtime activé sur le projet Supabase (activé par défaut)

## SQL à exécuter

Dans **Supabase → SQL Editor** (ordre) :

1. `002b_discussion_tables.sql` — **si** erreur `DiscussionReadState does not exist`
2. `003_realtime_discussion.sql`

Contenu :

- Publication Realtime : `MessageDiscussion`, `DiscussionReadState`, `Notification`
- RLS discussion / lectures / notifications
- Trigger : notification `DISCUSSION` à chaque nouveau message

## Comportement (v223)

| Fonctionnalité | Mode Supabase |
|----------------|---------------|
| Chat famille | `MessageDiscussion` + Realtime |
| Accusés de lecture | `DiscussionReadState` + Realtime |
| Cloche notifications | `Notification` + Realtime (insert) |
| « En train d’écrire » | Broadcast Realtime (plus Socket.io) |
| Photos / vocaux discussion | Cloudinary → insert Supabase |

**Socket.io** n’est plus utilisé pour la discussion ni les notifications lorsque `VITE_USE_SUPABASE=true`. L’API Express reste optionnelle pour albums, arbre, platform, etc.

## Notifications souvenirs / commentaires

En mode Supabase pur, seuls les messages **discussion** créent des notifications via le trigger SQL. Les alertes **souvenir / commentaire / réaction** nécessitent encore l’API Express ou des triggers SQL supplémentaires (phase ultérieure).

## Vérification

1. Deux comptes de la même famille, deux navigateurs
2. Discussion : message instantané chez l’autre, pastille « En direct »
3. Cloche : notification après message discussion
4. Réactions emoji sur un message

## Dépannage

- **Pas de temps réel** : vérifier que les tables sont dans la publication Realtime (Dashboard → Database → Replication)
- **RLS** : `auth_user_id` doit être lié sur `Utilisateur`
- **Cloche vide** : exécuter `003` (trigger + RLS)
