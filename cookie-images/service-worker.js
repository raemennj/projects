// service-worker.js

const CACHE_NAME = 'cookie-sales-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html', // Adjust if your main HTML file has a different name
  '/cookie-images/manifest.json',
  '/cookie-images/cookie-16x16.png',
  '/cookie-images/cookie-32x32.png',
  '/cookie-images/cookie-48x48.png',
  '/cookie-images/cookie-57x57.png',
  '/cookie-images/cookie-72x72.png',
  '/cookie-images/cookie-76x76.png',
  '/cookie-images/cookie-114x114.png',
  '/cookie-images/cookie-120x120.png',
  '/cookie-images/cookie-144x144.png',
  '/cookie-images/cookie-152x152.png',
  '/cookie-images/cookie-167x167.png',
  '/cookie-images/cookie-180x180.png',
  '/cookie-images/cookie-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Add any additional assets like scripts, stylesheets, etc.
];

// Install Event - Caches the necessary assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching App Shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => console.error('[Service Worker] Failed to cache', err))
  );
});

// Activate Event - Cleans up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
  );
});

// Fetch Event - Serves cached content when offline
self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetch:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Return cached asset
          return response;
        }
        // Fetch from network
        return fetch(event.request)
          .then(networkResponse => {
            // Optionally cache the new response
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch(err => {
            // Handle fetch errors (e.g., offline)
            console.error('[Service Worker] Fetch failed:', err);
            // Optionally return a fallback page/image
          });
      })
  );
});
