# Memory Haven — tout en local (sans Railway ni Vercel)

Utilisez l’application **100 % sur votre PC** : base SQLite, API port 3000, site port 5173.

---

## Démarrage rapide (2 double-clics)

1. **`LANCER.bat`** — ouvre l’API + le site dans 2 fenêtres
2. Navigateur : **http://localhost:5173**
3. Connexion : **`marie@demo.local`** / **`demo1234`**

Gardez les 2 fenêtres noires ouvertes pendant l’utilisation.

---

## Première installation

Si c’est la première fois sur cette machine :

1. Installez **Node.js LTS** : https://nodejs.org
2. Double-clic **`1-INSTALLER.bat`** (une seule fois, ~2 min)
3. Puis **`LANCER.bat`**

---

## Comptes de démo

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| marie@demo.local | demo1234 | Super admin |
| pierre@demo.local | demo1234 | Membre |

Code invitation famille : **DEMO2026**

---

## Ce qui fonctionne en local

- Souvenirs, albums, commentaires, réactions
- Arbre généalogique
- Profil membre (parcours, métier, langues, téléphone…)
- Héritage, hommage, capsules, chronologie, livre familial
- Upload photos (Cloudinary si configuré, sinon fichiers locaux `/uploads`)
- Membres, invitations, notifications
- **Discussion familiale** (messages, photos, vocaux, réactions — style WhatsApp)

**Pas besoin de Railway, Render ou Vercel** pour développer et tester.

---

## Fichiers importants

| Fichier | Rôle |
|---------|------|
| `backend/.env` | Base SQLite `file:./dev.db`, port 3000 |
| `frontend/.env.development` | API → `http://localhost:3000/api` |
| `backend/prisma/dev.db` | Vos données locales |
| `VERIFIER-LOCAL.bat` | Teste que l’API répond |

---

## Dépannage

### « L’API locale ne répond pas »

1. Fermez tout, relancez **`LANCER.bat`**
2. Attendez le message **Serveur démarré** dans la fenêtre API
3. Double-clic **`VERIFIER-LOCAL.bat`**

### Erreur Prisma / base de données

Dans un terminal, dossier `backend` :

```
node scripts/ensure-local-db.js
npx prisma db push
npm run db:seed
```

### Bandeau « Mode local » (héritage en localStorage)

Signifie que le site ne joint pas l’API. Vérifiez que **`2-API.bat`** tourne et que vous êtes sur **http://localhost:5173** (pas le site Vercel).

### Frontend seul (`npm run dev` sans API)

Lancez toujours **`LANCER.bat`** ou **`2-API.bat`** avant le site.

---

## Arrêter

Fermez les fenêtres **Memory Haven API** et **Memory Haven Site** (ou Ctrl+C dans chaque terminal).
