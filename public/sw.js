// Service worker for Little Fables (v2).
// Shell: network-first with cache fallback so saved books still open offline.
// Precaches shell, pack JSON assets, art, and generated audio.
// Never caches /api calls.

const CACHE = 'lf-read-v4'
const PRECACHE = [
  '/read',
  '/read/create',
  '/read/arrival',
  '/read/badges',
  '/read/words',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo-tree-ink.png',
  '/logo-tree-white.png',
  // Miko art (starter series)
  '/art/miko-cover.jpg',
  '/art/miko-01-zoomtown.jpg',
  '/art/miko-02-bridge.jpg',
  '/art/miko-03-breath.jpg',
  '/art/miko-04-web.jpg',
  '/art/miko-05-fixed-neck.jpg',
  '/art/miko-05-fixed-moto.jpg',
  '/art/miko-06-night.jpg',
  '/art/jujy-02-village.jpg',
  // Book illustrations
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

// Cacheable-response predicate.
function isCacheable(url) {
  const p = url.pathname
  return (
    p.startsWith('/read') ||
    p.startsWith('/_next/static') ||
    p.startsWith('/icons') ||
    p.startsWith('/art') ||
    p.startsWith('/books') ||
    p.startsWith('/illustration') ||
    p.startsWith('/audio') || // pre-generated ElevenLabs audio + timestamps
    p === '/logo-tree-ink.png' ||
    p === '/logo-tree-white.png' ||
    p === '/manifest.webmanifest'
  )
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && isCacheable(url)) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(event.request, clone))
        }
        return res
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match('/read')))
  )
})
