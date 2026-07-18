const CACHE_NAME = 'inf-web-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/7-klass.html',
    '/8-klass.html',
    '/9-klass.html',
    '/css/styles.css',
    '/js/scripts.js',
    '/js/quiz.js',
    '/favicon.svg',
    '/tema-1-1.html',
    '/tema-1-2.html',
    '/tema-1-3.html',
    '/tema-2-1.html',
    '/tema-2-2.html',
    '/tema-3-1.html',
    '/tema-3-2.html',
    '/tema-3-3.html',
    '/tema-4-1.html',
    '/tema-4-2.html',
    '/tema-5-1.html',
    '/tema-5-2.html',
    '/tema-5-3.html',
    '/tema-5-4.html',
    '/tema-6-1.html',
    '/tema-6-2.html',
    '/tema-7-1.html',
    '/tema-7-2.html',
    '/tema-8-1.html',
    '/tema-8-2.html',
    '/tema-9-1.html',
    '/tema-9-2.html',
    '/404.html'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) {
                    return key !== CACHE_NAME;
                }).map(function(key) {
                    return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            return cached || fetch(event.request).then(function(response) {
                if (response.status === 200 && response.type === 'basic') {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            });
        }).catch(function() {
            if (event.request.destination === 'document') {
                return caches.match('/404.html');
            }
        })
    );
});
