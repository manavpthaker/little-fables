// Service worker for Azad's Story World
// Shell: network-first with cache fallback (so saved stories still open offline).
// Never caches /api calls.

const CACHE = 'azad-read-v2'
const PRECACHE = [
  '/read',
  '/read/create',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo-tree-ink.png',
  '/logo-tree-white.png',
  // Starter story art (the shelf must open offline)
  '/art/miko-cover.jpg',
  '/art/miko-01-zoomtown.jpg',
  '/art/miko-02-bridge.jpg',
  '/art/miko-03-breath.jpg',
  '/art/miko-04-web.jpg',
  '/art/miko-05-fixed-neck.jpg',
  '/art/miko-05-fixed-moto.jpg',
  '/art/miko-06-night.jpg',
  '/art/jujy-02-village.jpg',
  '/books/azis-little-bhen/scene-01.jpg',
  '/books/azis-little-bhen/scene-02.jpg',
  '/books/azis-little-bhen/scene-03.jpg',
  '/illustration/azi-kitchen.jpg',
  '/illustration/azi-scene-03.jpg',
  '/illustration/jujy-cover.jpg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll fails atomically; some precache entries may 404 in older builds.
      // Cache what we can and don't block install on missing shelf art.
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (
          res.ok &&
          (url.pathname.startsWith('/read') ||
            url.pathname.startsWith('/_next/static') ||
            url.pathname.startsWith('/icons') ||
            url.pathname.startsWith('/art') ||
            url.pathname.startsWith('/books') ||
            url.pathname.startsWith('/illustration') ||
            url.pathname === '/logo-tree-ink.png' ||
            url.pathname === '/logo-tree-white.png' ||
            url.pathname === '/manifest.webmanifest')
        ) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(event.request, clone))
        }
        return res
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match('/read')))
  )
})
