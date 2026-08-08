const CACHE_NAME = 'qwen-pwa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/main.js',
  '/worker.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});