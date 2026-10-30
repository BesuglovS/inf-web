/*
 * Аварийный service worker для inf.nayanovaacademy.ru.
 *
 * Прошлая версия сайта регистрировала /sw.js со стратегией cache-first и
 * продолжала отдавать из кэша старые страницы. Новый сайт service worker
 * не использует, поэтому этот файл нужен только для того, чтобы браузеры
 * с оставшимся старым воркером получили обновление: он удаляет все кэши,
 * снимает регистрацию и перезагружает открытые вкладки.
 *
 * Обработчика fetch здесь нет — после активации воркер удаляет сам себя,
 * и сайт работает без service worker.
 */
self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys()
            .then(function (keys) {
                return Promise.all(keys.map(function (key) {
                    return caches.delete(key);
                }));
            })
            .then(function () {
                return self.registration.unregister();
            })
            .then(function () {
                return self.clients.matchAll({ type: 'window' });
            })
            .then(function (clients) {
                clients.forEach(function (client) {
                    client.navigate(client.url);
                });
            })
    );
});
