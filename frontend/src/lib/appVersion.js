/** Incrémenter à chaque correctif critique affichage / PWA */
export const APP_BUILD = '2026-05-28-mirror-v7'

export async function purgeStalePwaCache() {
  const key = 'mh-app-build'
  const previous = localStorage.getItem(key)

  if (previous === APP_BUILD) return false

  localStorage.setItem(key, APP_BUILD)

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((r) => r.unregister()))
  }

  if ('caches' in window) {
    const names = await caches.keys()
    await Promise.all(names.map((name) => caches.delete(name)))
  }

  return Boolean(previous)
}
