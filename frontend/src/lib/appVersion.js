/** Incrémenter à chaque déploiement design / cache */
export const APP_BUILD = '2026-05-30-arbre-positions-serveur-v75'

/** Libellé court affiché dans l’interface */
export function appBuildLabel() {
  return APP_BUILD.replace(/^20\d{2}-\d{2}-\d{2}-/, '')
}

export async function purgeStalePwaCache() {
  const key = 'mh-app-build'
  const previous = localStorage.getItem(key)
  const needsUpdate = previous !== APP_BUILD

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  }

  if ('caches' in window) {
    const names = await caches.keys()
    await Promise.all(names.map((name) => caches.delete(name)))
  }

  if (needsUpdate) {
    localStorage.setItem(key, APP_BUILD)
    if (previous) {
      const url = new URL(window.location.href)
      url.searchParams.set('mh_build', APP_BUILD)
      window.location.replace(url.toString())
      return true
    }
  }

  return false
}
