# Mettre à jour l’API Railway — guide simple (5 minutes)

Votre site **https://memory-haven-frontend.vercel.app** est déjà à jour.  
Il manque seulement l’**API** (Railway). Sans ça, la 2FA, l’accueil premium, etc. ne marchent pas.

---

## Méthode 1 — Le plus simple (clics dans le navigateur)

### Étape 1 : Ouvrir Railway

1. Ouvrez ce lien : **https://railway.com/dashboard**
2. Connectez-vous (Google ou GitHub, comme d’habitude).

### Étape 2 : Trouver le bon projet

1. Cliquez sur le projet **memory-haven** (ou un nom proche).
2. Vous voyez peut-être **2 services** (API + base de données).  
   Cliquez sur celui dont l’URL ressemble à :  
   `memory-haven-api-production.up.railway.app`  
   (souvent nommé **memory-haven-api** ou **api**).

### Étape 3 : Redéployer

1. En haut, cliquez l’onglet **Deployments** (Déploiements).
2. En haut à droite, bouton **Deploy** ou **Redeploy** (↻).
3. Choisissez **Redeploy** sur le **dernier déploiement**,  
   ou **Deploy from GitHub** / branche **main** si proposé.
4. Attendez 2 à 5 minutes. Le statut doit devenir **Success** (vert).

### Étape 4 : Vérifier que c’est bon

Ouvrez dans le navigateur :

**https://memory-haven-api-production.up.railway.app/api/health**

| Ce que vous voyez | Signification |
|-------------------|---------------|
| `"platformPremium":true` et `"version":"22-no-discussion-v203"` (ou plus récent) | ✅ **C’est bon !** |
| Seulement `"api":"OK","database":"OK"` sans `platformPremium` | ❌ Encore l’ancienne API — refaites l’étape 3 ou voir « Problèmes » ci-dessous |

### Étape 5 : Recharger le site

1. Allez sur **https://memory-haven-frontend.vercel.app**
2. Appuyez sur **Ctrl + F5** (rechargement forcé).
3. Connectez-vous et testez **Accueil**, **Albums**, **Mon compte**.

---

## Méthode 2 — Si Railway n’est pas lié à GitHub

Si vous ne voyez **pas** de bouton Redeploy ou aucun déploiement récent :

1. Dans le service API → **Settings** (Paramètres).
2. Section **Source** :
   - **Connect Repo** → choisissez **timdiguesabala-png/memory-haven**
   - Branche : **main**
   - **Root Directory** : laissez **vide** (racine).  
     Si le build échoue, essayez **backend** à la place.
3. Retournez dans **Deployments** → **Deploy**.

---

## Variables obligatoires (Settings → Variables)

Si le déploiement **échoue**, vérifiez que ces variables existent :

| Variable | Exemple |
|----------|---------|
| `DATABASE_URL` | (PostgreSQL — déjà configuré normalement) |
| `JWT_SECRET` | (secret long, déjà là) |
| `CLOUDINARY_CLOUD_NAME` | votre cloud Cloudinary |
| `CLOUDINARY_API_KEY` | … |
| `CLOUDINARY_API_SECRET` | … |
| `FRONTEND_URL` | `https://memory-haven-frontend.vercel.app` |

---

## Méthode 3 — Depuis votre PC (après connexion)

Dans **PowerShell** :

```powershell
cd c:\Users\LENOVO\OneDrive\Bureau\memory_haven
npx @railway/cli login
npx @railway/cli link
npx @railway/cli up --detach
```

`railway login` ouvre le navigateur — cliquez **Authorize**.

---

## Méthode 4 — Déploiement automatique GitHub Actions

À chaque push sur `main` qui touche `backend/`, le workflow **Deploy API Railway** peut déployer l’API si vous configurez un secret GitHub.

### Étape 1 : Token Railway (important)

**Option A — Token de projet (recommandé)**

1. **https://railway.com/dashboard** → projet **memory-haven**
2. Cliquez le **nom du projet** (pas le service) → **Settings** → **Tokens**
3. **Create token** → environnement **production** → copiez le token (une seule fois)

**Option B — Token de compte** (si A échoue)

1. **https://railway.com/account/tokens** → **Create token**
2. **Ne sélectionnez aucun workspace** (laissez vide)
3. Copiez le token → secret GitHub **`RAILWAY_API_TOKEN`** (pas `RAILWAY_TOKEN`)

Erreur `Invalid RAILWAY_TOKEN` = mauvais type de token, token expiré, ou espace en trop à la copie.

### Étape 2 : ID du service API

1. Railway → service **memory-haven-api** (celui avec l’URL `…up.railway.app`)
2. **Settings** → **General** → copiez **Service ID** (UUID)

### Étape 3 : Secrets GitHub

1. **https://github.com/timdiguesabala-png/memory-haven/settings/secrets/actions**
2. Supprimez l’ancien `RAILWAY_TOKEN` s’il est incorrect, puis ajoutez :
   - **`RAILWAY_TOKEN`** = token de projet (option A), **ou**
   - **`RAILWAY_API_TOKEN`** = token de compte (option B)
   - **`RAILWAY_SERVICE_ID`** = UUID du service API (**obligatoire**)

### Étape 4 : Relancer

1. **Actions** → **Deploy API Railway** → **Run workflow**
2. Attendez le job vert, puis vérifiez `/api/health` (étape 4 de la méthode 1).

Sans token, le workflow affiche un avertissement et s’arrête sans erreur.

---

## Besoin d’aide ?

Envoyez une **capture d’écran** de votre dashboard Railway (liste des projets ou onglet Deployments) et on vous dira exactement où cliquer.
