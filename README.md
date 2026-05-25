# Memory Haven (MémoireFamille)

Plateforme web familiale privée pour collecter, organiser et partager des souvenirs (photos, textes, audio, vidéo).

## Fonctionnalités

- Authentification (inscription famille, code d'invitation, JWT)
- Fil de souvenirs avec réactions et commentaires
- Albums thématiques
- Arbre généalogique
- Gestion des membres et rôles
- Discussion familiale (temps réel via Socket.io)
- Notifications
- Export HTML/PDF côté client
- Favoris

## Démarrage rapide

```powershell
cd memory_haven
npm run setup
npm run dev
```

Ou double-cliquez `start-dev.ps1`.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Santé API | http://localhost:3000/api/health |

### Compte démo

| Champ | Valeur |
|-------|--------|
| Email | `marie@demo.local` |
| Mot de passe | `demo1234` |
| Code invitation | `DEMO2026` |

## Structure

```
memory_haven/
├── backend/     Express + Prisma + Socket.io
├── frontend/    React + Vite
├── start-dev.ps1
└── package.json
```

## Configuration

Copiez les fichiers d'exemple :

```powershell
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

La base de développement utilise **SQLite** (`backend/prisma/dev.db`).

Pour Supabase/PostgreSQL : réactivez votre projet cloud, remettez `provider = "postgresql"` dans `prisma/schema.prisma`, restaurez l'URL dans `.env`, puis `npx prisma migrate deploy`.

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run setup` | Installe et initialise la base + données démo |
| `npm run dev` | Lance backend et frontend |
| `npm run build` | Build production du frontend |

## Stack

React 19, Vite, Express, Prisma, SQLite (dev), Cloudinary, Socket.io
