# Redéployer sur Vercel (2 minutes)

**Problème :** le site en ligne affiche encore une ancienne version (ex. v214) alors que GitHub a la v219.

## Méthode 1 — Dashboard Vercel (recommandé)

1. Ouvrez **https://vercel.com/dashboard**
2. Projet **memory-haven-frontend** (ou nom proche)
3. Onglet **Deployments**
4. Sur le dernier déploiement → menu **⋯** → **Redeploy**
5. Cochez **Use existing Build Cache** = **NON** (décocher / « Redeploy without cache »)
6. Attendez **Ready** (1–3 min)

## Vérifier que c’est la bonne version

1. Ouvrez : **https://memory-haven-frontend.vercel.app/?mh_force=1**
2. Menu ☰ en bas → ligne **Build** doit afficher : **`vercel-ready-v219`**
3. **Membres** → clic sur un membre → page fiche plein écran (pas l’ancien popup jaune)

## Si aucun déploiement récent sur GitHub

**Settings** → **Git** → repo `timdiguesabala-png/memory-haven`, branche **main**.

**Settings** → **General** :
- **Root Directory** : vide (racine du repo) **OU** `frontend` si le build échoue en racine
- Si Root = `frontend`, le build est `npm run build`, output `dist`

## Variables d’environnement (Production)

| Variable | Valeur |
|----------|--------|
| `VITE_API_URL` | `https://memory-haven-api-production.up.railway.app/api` |
| `VITE_SOCKET_URL` | `https://memory-haven-api-production.up.railway.app` |

Puis **Redeploy** après toute modification d’env.

## API (données complètes)

Le site Vercel seul ne suffit pas : **Railway** doit aussi être redeployé.  
Voir `METTRE-A-JOUR-RAILWAY.md` ou `UTILISER-MAINTENANT.md`.
