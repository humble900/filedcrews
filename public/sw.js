const CACHE_NAME = 'fieldcrews-pwa-cache-v4';
const ASSETS_TO_CACHE = [
  '/favicon.ico',
  '/favicon.png',
  '/placeholder.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin (local) assets
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return; // Bypass and let the browser fetch naturally
  }

  // Network-First strategy to prevent stale caches of javascript bundles/chunks
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache static entrypoints dynamically if successful
        const urlPath = new URL(event.request.url).pathname;
        if (ASSETS_TO_CACHE.includes(urlPath) || urlPath === '/' || urlPath === '/index.html') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch((err) => {
        // Fallback to cache if network is offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return index.html for SPA page navigations offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          throw err;
        });
      })
  );
});
