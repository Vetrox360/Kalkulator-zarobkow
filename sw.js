// Improved service worker: versioned cache, precache + offline fallback,
// skipWaiting/clients.claim, cache cleanup, basic runtime strategies,
// and message handler to skipWaiting.

const CACHE_NAME = 'pwa-cache-v2';
const PRECACHE_URLS = [
  '/',              // allow root navigation fallback
  '/index.html',
  '/offline.html',
  '/Logo.png',
  '/manifest.json'
];

// Install: pre-cache resources and activate new SW immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches and take control of clients
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: navigation (HTML) -> network-first with fallback to cache (index/offline).
// Static same-origin assets -> cache-first with network update.
// Others (cross-origin) -> network, fallback to offline.html.
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  // Navigation requests (page loads / SPA navigation)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Update index.html in cache for offline navigation
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then(resp => resp || caches.match('/offline.html')))
    );
    return;
  }

  // Same-origin static assets: cache-first
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkRes => {
          if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
            caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
          }
          return networkRes;
        }).catch(() => {
          // fallback for images or fonts
          if (req.destination === 'image') return caches.match('/Logo.png');
          return null;
        });
      })
    );
    return;
  }

  // Cross-origin: normal network request with offline fallback
  event.respondWith(
    fetch(req).catch(() => caches.match('/offline.html'))
  );
});

// Listen to messages (for update flow)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
