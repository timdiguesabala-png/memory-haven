/** Incrémenter à chaque déploiement design / cache */
export const APP_BUILD = '2026-05-30-discussion-vocal-clic-v58'

export async function purgeStalePwaCache() {
  const key = 'mh-app-build'
  const previous = localStorage.getItem(key)
  const needsUpdate = previous !== APP_BUILD

  if (needsUpdate) {
    localStorage.setItem(key, APP_BUILD)
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  }

  if ('caches' in window) {
    const names = await caches.keys()
    await Promise.all(names.map((name) => caches.delete(name)))
  }

  return needsUpdate && Boolean(previous)
}
