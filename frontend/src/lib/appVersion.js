/** Incrémenter à chaque déploiement design / cache */
export const APP_BUILD = '2026-06-02-supabase-realtime-v223'

/** Libellé court affiché dans l’interface */
export function appBuildLabel() {
  return APP_BUILD.replace(/^20\d{2}-\d{2}-\d{2}-/, '')
}

/**
 * Vide caches + service workers et force un rechargement complet
 * quand la version embarquée change (évite l’ancien bundle sur mobile/PWA).
 */
export async function purgeStalePwaCache() {
  const key = 'mh-app-build'
  const url = new URL(window.location.href)
  const urlBuild = url.searchParams.get('mh_build')
  const previous = localStorage.getItem(key)
  const force = url.searchParams.has('mh_force')
  const needsUpdate = previous !== APP_BUILD || force
  const urlStale = urlBuild !== APP_BUILD

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  }

  if ('caches' in window) {
    const names = await caches.keys()
    await Promise.all(names.map((name) => caches.delete(name)))
  }

  localStorage.setItem(key, APP_BUILD)

  if (needsUpdate || urlStale) {
    url.searchParams.set('mh_build', APP_BUILD)
    url.searchParams.set('mh_t', String(Date.now()))
    window.location.replace(url.toString())
    return true
  }

  return false
}

/** Bouton menu : vide cache PWA + recharge la dernière version */
export function forceAppRefresh() {
  localStorage.removeItem('mh-app-build')
  if ('caches' in window) {
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      Promise.all(regs.map((r) => r.unregister())).finally(() => {
        const url = new URL(window.location.href)
        url.searchParams.set('mh_force', '1')
        url.searchParams.set('mh_t', String(Date.now()))
        window.location.replace(url.toString())
      })
    })
    return
  }
  const url = new URL(window.location.href)
  url.searchParams.set('mh_force', '1')
  url.searchParams.set('mh_t', String(Date.now()))
  window.location.replace(url.toString())
}
