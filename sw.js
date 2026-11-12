/*
 * Аварийный service worker для inf.nayanovaacademy.ru.
 *
 * Прошлая версия сайта регистрировала /sw.js со стратегией cache-first и
 * продолжала отдавать из кэша старые страницы. Новый сайт service worker
 * не использует, поэтому этот файл нужен только для того, чтобы браузеры
 * с оставшимся старым воркером получили обновление: он удаляет старые
 * кэши, снимает регистрацию и перезагружает открытые вкладки. Кэши и
 * service worker модуля /sys не затрагиваются.
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
                    if (key.indexOf('sys-') === 0) {
                        return Promise.resolve();
                    }
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
                    var url = new URL(client.url);
                    if (url.pathname.indexOf('/sys/') === 0) {
                        return;
                    }
                    client.navigate(client.url);
                });
            })
    );
});
