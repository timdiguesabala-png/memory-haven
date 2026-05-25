# Guide complet — Déploiement en ligne Memory Haven

Ce guide décrit **toutes les étapes** pour mettre Memory Haven (MémoireFamille) sur Internet.

**Architecture :**

| Composant | Technologie | Hébergeur gratuit |
|-----------|-------------|-------------------|
| Site web (React) | Vite + React | **Vercel** |
| API (Node.js) | Express + Socket.io | **Render** |
| Base de données | PostgreSQL | **Neon** |
| Fichiers (photos/vidéos) | Cloudinary | **Cloudinary** (déjà configuré dans le projet) |

**Ordre obligatoire :** GitHub → Neon → Render → Vercel → corriger `FRONTEND_URL` sur Render.

**Durée estimée :** 30 à 45 minutes.

---

## Prérequis

- Un compte **GitHub** : https://github.com/signup  
- Un compte **Neon** : https://neon.tech  
- Un compte **Render** : https://render.com  
- Un compte **Vercel** : https://vercel.com  
- **Git** installé sur Windows (ou GitHub Desktop)  
- Le projet sur ton PC : `c:\Users\LENOVO\OneDrive\Bureau\memory_haven`

---

## Étape 0 — Vérifier le code avant déploiement

Le fichier `backend/prisma/schema.prisma` doit utiliser **PostgreSQL** (pas SQLite) :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Si tu as travaillé en local avec SQLite, restaure le schéma PostgreSQL depuis Git ou ne copie **pas** `schema.sqlite.prisma` sur `schema.prisma` avant de pousser sur GitHub.

---

## Étape 1 — Mettre le projet sur GitHub

### 1.1 Créer un dépôt vide sur GitHub

1. Va sur https://github.com/new  
2. Nom du dépôt : `memory-haven` (ou autre nom)  
3. **Public** ou Private (les deux fonctionnent avec Render/Vercel)  
4. **Ne coche pas** « Add README » (tu as déjà le projet en local)  
5. Clique **Create repository**

### 1.2 Pousser le code depuis ton PC

Ouvre **PowerShell** ou **CMD** :

```powershell
cd "c:\Users\LENOVO\OneDrive\Bureau\memory_haven"

git init
git add .
git commit -m "Memory Haven - version deployable"

git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/memory-haven.git
git push -u origin main
```

Remplace `VOTRE_USERNAME` par ton identifiant GitHub.

**Important — ne jamais pousser les secrets :**

- Le fichier `backend/.env` doit être ignoré (déjà dans `.gitignore`)  
- Ne commite pas de mots de passe en clair

Si Git demande une connexion : utilise un **Personal Access Token** GitHub (Settings → Developer settings → Tokens) comme mot de passe.

---

## Étape 2 — Base de données PostgreSQL (Neon)

### 2.1 Créer le projet Neon

1. Connecte-toi sur https://console.neon.tech  
2. **New Project**  
3. Nom : `memory-haven`  
4. Région : la plus proche de toi (ex. `Europe (Frankfurt)`)  
5. Crée le projet

### 2.2 Copier l’URL de connexion

1. Dans le dashboard Neon → **Connection Details**  
2. Choisis **Connection string**  
3. Mode : **Direct connection** ou **Pooled** (les deux marchent avec Prisma)  
4. Copie l’URL, elle ressemble à :

```
postgresql://neondb_owner:XXXXXXXX@ep-xxxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

5. Vérifie que l’URL contient bien `?sslmode=require` à la fin. Sinon, ajoute-le.

**Garde cette URL** — c’est ta variable `DATABASE_URL` pour Render.

### 2.3 Test (optionnel)

Tu n’as rien d’autre à configurer sur Neon pour l’instant. Les tables seront créées automatiquement par Render au premier déploiement (`prisma db push`).

---

## Étape 3 — API Backend (Render)

### 3.1 Créer le service web

1. Va sur https://dashboard.render.com  
2. **New +** → **Blueprint** (si proposé) **ou** **Web Service**  
3. Connecte ton compte **GitHub** si ce n’est pas fait  
4. Sélectionne le dépôt `memory-haven`  
5. Render peut détecter le fichier `render.yaml` à la racine — accepte la configuration

**Si tu configures à la main (sans Blueprint) :**

| Champ | Valeur |
|-------|--------|
| Name | `memory-haven-api` |
| Region | Frankfurt ou Oregon |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npx prisma db push --accept-data-loss` |
| Start Command | `npm run db:seed && npm start` |
| Plan | Free |

### 3.2 Variables d’environnement (obligatoires)

Dans Render → ton service → **Environment** → ajoute :

| Variable | Valeur | Où la trouver |
|----------|--------|----------------|
| `DATABASE_URL` | URL Neon complète (étape 2) | Neon → Connection string |
| `JWT_SECRET` | Une longue chaîne aléatoire (ex. 32+ caractères) | Invente ou génère : `openssl rand -hex 32` |
| `NODE_ENV` | `production` | — |
| `CLOUDINARY_CLOUD_NAME` | `deochtv65` | Ton `backend/.env` local |
| `CLOUDINARY_API_KEY` | Ta clé API | Dashboard Cloudinary |
| `CLOUDINARY_API_SECRET` | Ton secret | Dashboard Cloudinary |
| `FRONTEND_URL` | **Temporaire** : `http://localhost:5173` | Tu la corriges après Vercel (étape 4) |

**Cloudinary** (si tu n’as pas les clés) :

1. https://cloudinary.com → compte gratuit  
2. Dashboard → **API Keys** → copie Cloud name, API Key, API Secret

### 3.3 Déployer

1. Clique **Create Web Service** ou **Deploy**  
2. Attends la fin du build (5–10 min la première fois)  
3. Note l’URL publique, par exemple :

```
https://memory-haven-api.onrender.com
```

### 3.4 Vérifier que l’API fonctionne

Ouvre dans le navigateur :

```
https://memory-haven-api.onrender.com/
```

Réponse attendue :

```json
{ "message": "API Memory Haven en ligne !", "status": "OK" }
```

Puis :

```
https://memory-haven-api.onrender.com/api/health
```

Réponse attendue :

```json
{ "succes": true, "api": "OK", "database": "OK" }
```

Si `database: "KO"` → vérifie `DATABASE_URL` sur Render et redéploie.

**Note plan gratuit Render :** le service s’endort après ~15 min d’inactivité. Le premier chargement peut prendre 30–60 secondes.

---

## Étape 4 — Site web Frontend (Vercel)

### 4.1 Importer le projet

1. Va sur https://vercel.com/new  
2. **Import Git Repository** → choisis `memory-haven`  
3. **Configure Project** :

| Champ | Valeur |
|-------|--------|
| Framework Preset | Vite (détecté automatiquement) |
| Root Directory | `frontend` ← **très important** |
| Build Command | `npm run build` (par défaut) |
| Output Directory | `dist` (par défaut) |

### 4.2 Variable d’environnement

Avant de déployer, section **Environment Variables** :

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://memory-haven-api.onrender.com/api` |

Remplace par **ton** URL Render exacte, avec `/api` à la fin.

### 4.3 Déployer

1. Clique **Deploy**  
2. Attends 1–3 minutes  
3. Note l’URL Vercel, par exemple :

```
https://memory-haven-xxx.vercel.app
```

### 4.4 Vérifier le site

1. Ouvre l’URL Vercel  
2. Page de connexion Memory Haven  
3. Utilise le compte démo (créé par le seed sur Render) :

| Champ | Valeur |
|-------|--------|
| Email | `marie@demo.local` |
| Mot de passe | `demo1234` |

Si erreur réseau à la connexion → passe à l’étape 5 (CORS).

---

## Étape 5 — Lier Frontend et Backend (CORS)

Le backend n’accepte les requêtes que depuis des origines autorisées.

1. Retourne sur **Render** → `memory-haven-api` → **Environment**  
2. Modifie `FRONTEND_URL` :

```
https://memory-haven-xxx.vercel.app
```

(URL Vercel **exacte**, sans slash à la fin)

3. **Save Changes** → Render redéploie automatiquement  
4. Attends la fin du redéploiement  
5. Réessaie la connexion sur le site Vercel

---

## Étape 6 — Checklist finale

Coche chaque point :

- [ ] Code sur GitHub (`main` à jour)  
- [ ] Neon : projet créé, `DATABASE_URL` copiée  
- [ ] Render : build réussi (vert)  
- [ ] `https://TON-API.onrender.com/api/health` → `database: "OK"`  
- [ ] Vercel : build réussi, site accessible  
- [ ] `VITE_API_URL` = `https://TON-API.onrender.com/api`  
- [ ] `FRONTEND_URL` sur Render = URL Vercel exacte  
- [ ] Connexion `marie@demo.local` / `demo1234` OK  
- [ ] Dashboard affiche les souvenirs démo  

---

## Comptes et codes utiles

### Compte démo (créé au premier déploiement Render)

| | |
|---|---|
| Email | `marie@demo.local` |
| Mot de passe | `demo1234` |
| Code invitation (nouveaux membres) | `DEMO2026` |

### Créer ta propre famille en production

1. Va sur `https://TON-SITE.vercel.app/register`  
2. Remplis le formulaire « Créer mon espace famille »  
3. Tu deviens **SUPER_ADMIN** de ta famille  

### Inviter un membre

1. Connecté en admin → page **Membres** → **Inviter**  
2. Copie le lien d’invitation (contient le code famille)  
3. Envoie le lien à la personne → elle s’inscrit via **Rejoindre**

---

## Dépannage

### « Email ou mot de passe incorrect » alors que c’est le compte démo

- Render n’a pas exécuté le seed : vérifie les **Logs** → cherche `Famille Démo` ou erreur Prisma  
- Redéploie manuellement : **Manual Deploy** → **Deploy latest commit**

### Erreur CORS / requête bloquée dans la console (F12)

- `FRONTEND_URL` sur Render doit être **exactement** l’URL Vercel  
- Pas de `http` si le site est en `https`  
- Redéploie Render après modification

### `database: "KO"` sur `/api/health`

- `DATABASE_URL` incorrecte ou projet Neon suspendu  
- Vérifie Neon → projet actif  
- URL avec `sslmode=require`

### Le site Vercel charge mais reste blanc

- Vérifie les logs Vercel → **Deployments** → **Building**  
- `Root Directory` doit être `frontend`  
- `VITE_API_URL` doit être définie **avant** le build (sinon rebuild)

### Upload photo échoue

- Vérifie les 3 variables `CLOUDINARY_*` sur Render  
- Teste avec un fichier &lt; 50 Mo

### Render : build échoue sur Prisma

- Vérifie que `schema.prisma` a `provider = "postgresql"`  
- Logs : erreur de connexion → `DATABASE_URL` Neon

### API très lente au premier clic

- Normal sur le plan gratuit Render (réveil du serveur)  
- Attends 30–60 s et réessaie

---

## Mise à jour après modification du code

```powershell
cd "c:\Users\LENOVO\OneDrive\Bureau\memory_haven"
git add .
git commit -m "Mise à jour"
git push
```

- **Render** et **Vercel** redéploient automatiquement (si liés à GitHub)  
- Sinon : bouton **Manual Deploy** sur chaque plateforme

---

## Récapitulatif des URLs à noter

Remplis ce tableau une fois le déploiement terminé :

| Service | Ton URL |
|---------|---------|
| Site (Vercel) | `https://________________.vercel.app` |
| API (Render) | `https://________________.onrender.com` |
| API health | `https://________________.onrender.com/api/health` |
| Neon | (dashboard seulement, pas d’URL publique) |

---

## Développement local (rappel)

Pour travailler sur ton PC sans toucher à la prod :

1. Double-clic sur `LANCER.bat`  
2. Ou suis `init-local.ps1` (SQLite, pas Neon)

Ne mélange pas `.env` local et variables Render.

---

## Support

En cas de blocage, note :

1. L’étape où tu es (1 à 5)  
2. Le message d’erreur exact (capture ou copier-coller)  
3. L’URL de ton API `/api/health`
