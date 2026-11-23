const CACHE_VERSION = 'mizany-pwa-v1'
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('mizany-pwa-') && key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // API endpoints: network-first, fallback to last cached response offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok && !url.pathname.startsWith('/api/locate-city')) {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // HTML navigations: network-first so fresh deployments arrive immediately, offline fallback to '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put('/', copy))
          }
          return res
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  // Immutable Vite hashed assets & static icons: cache-first, populate cache on miss
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
            }
            return res
          })
      )
    )
  }
})
