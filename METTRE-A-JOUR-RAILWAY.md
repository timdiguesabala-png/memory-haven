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
| `"version":"21-platform-premium-v201"` | ✅ **C’est bon !** |
| Seulement `"api":"OK","database":"OK"` | ❌ Encore l’ancienne API — refaites l’étape 3 ou voir « Problèmes » ci-dessous |

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

## Besoin d’aide ?

Envoyez une **capture d’écran** de votre dashboard Railway (liste des projets ou onglet Deployments) et on vous dira exactement où cliquer.
