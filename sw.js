const CACHE_NAME = 'thumb-grabber-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js'
];

// Install Service Worker
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(ASSETS);
            })
    );
});

// Fetch Assets
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then((response) => {
                return response || fetch(e.request);
            })
    );
});