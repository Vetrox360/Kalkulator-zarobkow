const CACHE_NAME = 'pwa-cache-v2'; // bumped cache name to force update

// Compute base URL for resources relative to the service worker file.
// On GitHub Pages project sites the SW is typically served from /{repo}/sw.js
const BASE = self.location.pathname.replace(/\/sw\.js$/, '/');

const FILES_TO_CACHE = [
  BASE,
  BASE + 'index.html',
  BASE + 'Logo.png',
  BASE + 'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
