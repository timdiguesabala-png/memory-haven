/** Précharge les pages (chunks) en arrière-plan — navigation sans écran « Chargement » */

const loaders = {
  '/accueil': () => import('../pages/Accueil'),
  '/dashboard': () => import('../pages/Dashboard'),
  '/heritage': () => import('../pages/Heritage'),
  '/hommage': () => import('../pages/Hommage'),
  '/timeline': () => import('../pages/Timeline'),
  '/carte': () => import('../pages/Carte'),
  '/capsules': () => import('../pages/Capsules'),
  '/livre': () => import('../pages/Livre'),
  '/albums': () => import('../pages/Albums'),
  '/arbre': () => import('../pages/Arbre'),
  '/membres': () => import('../pages/Membres'),
  '/compte': () => import('../pages/Compte'),
  '/ajouter': () => import('../pages/Ajouter'),
  '/recherche': () => import('../pages/Recherche'),
  '/statistiques': () => import('../pages/Statistiques')
}

const done = new Set()

export function prefetchPage(path) {
  const load = loaders[path]
  if (!load || done.has(path)) return
  done.add(path)
  load().catch(() => done.delete(path))
}

export function prefetchAllAppPages() {
  Object.keys(loaders).forEach(prefetchPage)
}
