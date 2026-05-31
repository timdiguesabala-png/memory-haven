# Mettre à jour l’API — 3 clics (sans token GitHub)

> **Railway payant ou expiré ?** → Lisez **`SANS-RAILWAY-RENDER.md`** (Render + Neon, gratuit).  
> Ce guide ci-dessous ne sert que si Railway fonctionne encore.

**Oubliez GitHub Actions.** Suivez seulement ceci.

---

## Étape 0 — Test (30 secondes)

Ouvrez : https://memory-haven-api-production.up.railway.app/api/health

| Ce que vous voyez | État |
|-------------------|------|
| Seulement `"api":"OK"` | ❌ Ancienne API — continuez |
| `"platformPremium":true` | ✅ Déjà bon — Ctrl+F5 sur le site |

---

## Étape 1 — Ouvrir Railway

1. Allez sur **https://railway.com/dashboard**
2. Connectez-vous (Google ou GitHub)
3. Cliquez sur le projet **memory-haven**

---

## Étape 2 — Le bon service

Vous voyez peut-être 2 blocs (API + base de données).

Cliquez sur celui qui ressemble à **memory-haven-api** ou **api**  
(URL : `memory-haven-api-production.up.railway.app`)

---

## Étape 3 — Lier GitHub (1 seule fois)

1. Onglet **Settings** (Paramètres)
2. Section **Source** ou **Connect Repo**
3. Repo : **timdiguesabala-png/memory-haven**
4. Branche : **main**
5. **Root Directory** : laissez **VIDE** (rien)
6. Enregistrez

---

## Étape 4 — Déployer

1. Onglet **Deployments**
2. Bouton **Deploy** ou les **3 points ⋮** → **Redeploy**
3. Attendez **Success** (vert) — 2 à 5 minutes

Si **Failed** (rouge) :
- Settings → Root Directory : mettez **backend** → redeploy

---

## Étape 5 — Vérifier

Rechargez : https://memory-haven-api-production.up.railway.app/api/health

✅ Vous devez voir `"platformPremium":true`

Puis : https://memory-haven-frontend.vercel.app → **Ctrl+F5**

---

## Toujours bloqué ?

Envoyez **une capture** de votre écran Railway (liste des services ou onglet Deployments).  
On vous dira exactement où cliquer.

**Script sur votre PC :** double-clic sur `Ouvrir-Railway.ps1` (ouvre Railway + teste l’API).
