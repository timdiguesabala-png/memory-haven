# Par où commencer ? (Memory Haven)

Tu es perdu ? Lis **un seul** des deux chemins ci-dessous.

---

## Chemin A — Tester sur ton PC (le plus simple)

**Tu veux juste voir l’app fonctionner chez toi, sans Internet ?**

1. Va dans le dossier : `Bureau\memory_haven`
2. **Double-clic** sur `LANCER.bat`
3. Attends 2 fenêtres noires (backend + frontend)
4. Ouvre le navigateur : **http://localhost:5173**
5. Connecte-toi :
   - Email : `marie@demo.local`
   - Mot de passe : `demo1234`

**C’est tout pour le local.** Pas besoin de Neon, Render ou Vercel.

---

## Chemin B — Mettre le site sur Internet

**Tu veux une vraie URL (https://...) accessible partout ?**

Il faut **4 sites web** dans cet ordre :

```
Étape 1 → GitHub     (stocker ton code)
Étape 2 → Neon       (base de données)
Étape 3 → Render     (l’API / le moteur)
Étape 4 → Vercel     (la page web que les gens voient)
```

### Où en es-tu ?

Coche mentalement :

- [ ] **Étape 1** — J’ai un compte GitHub et mon projet est en ligne sur github.com  
- [ ] **Étape 2** — J’ai créé un projet sur neon.tech et j’ai copié `DATABASE_URL`  
- [ ] **Étape 3** — J’ai créé un service sur render.com et `/api/health` affiche OK  
- [ ] **Étape 4** — J’ai déployé sur vercel.com et le site s’ouvre  

**La première case non cochée = ta prochaine étape.**

---

## Étape 1 en détail (si tu n’as rien fait encore)

### Option facile : GitHub Desktop

1. Télécharge **GitHub Desktop** : https://desktop.github.com  
2. Installe, connecte-toi avec ton compte GitHub  
3. **File → Add local repository**  
4. Choisis : `C:\Users\LENOVO\OneDrive\Bureau\memory_haven`  
5. Si demandé : **create a repository**  
6. En bas à gauche : message `Premier envoi Memory Haven` → **Commit to main**  
7. **Publish repository** → nom `memory-haven` → Publish  

Quand c’est fait → passe à l’**Étape 2** dans `DEPLOY.md` (section Neon).

### Option terminal (si tu préfères)

Ouvre CMD dans le dossier du projet et suis la section « Étape 1 » de `DEPLOY.md`.

---

## Fichiers du projet — à quoi ça sert

| Fichier | Rôle |
|---------|------|
| `LANCER.bat` | Lance l’app **en local** sur ton PC |
| `COMMENCER-ICI.md` | Ce fichier (démarrage) |
| `DEPLOY.md` | Guide **complet** pour Internet (détaillé) |
| `backend/` | Le serveur / API |
| `frontend/` | Le site visible dans le navigateur |
| `backend/.env` | Secrets locaux (ne pas mettre sur GitHub) |

---

## Besoin d’aide ?

Dis exactement :

1. **Chemin A** (local) ou **Chemin B** (en ligne) ?  
2. Quelle **étape** (1, 2, 3 ou 4) ?  
3. Quel **message d’erreur** tu vois (copier-coller ou capture) ?
