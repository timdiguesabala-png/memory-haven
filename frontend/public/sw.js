/* PWA — réseau d'abord : ne jamais servir d'anciens CSS/JS en cache */
const VERSION = 'memory-haven-network-v3'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(async () => {
      if (event.request.mode === 'navigate') {
        const cached = await caches.match('/index.html')
        if (cached) return cached
      }
      return new Response('Hors ligne — reconnectez-vous à Internet.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    })
  )
})
