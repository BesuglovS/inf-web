/**
 * Убираем service worker и кэши старой версии сайта.
 * Отдельный файл, чтобы CSP могла запрещать inline-скрипты.
 */
(function () {
    "use strict";

    if (!("serviceWorker" in navigator)) {
        return;
    }

    navigator.serviceWorker.getRegistrations().then(function (registrations) {
        registrations.forEach(function (registration) {
            // Не трогаем PWA-модуль /sys: у него отдельный scope и кэши.
            if (registration.scope && registration.scope.indexOf('/sys/') !== -1) {
                return;
            }
            registration.unregister();
        });
    });

    if (window.caches && caches.keys) {
        caches.keys().then(function (keys) {
            keys.forEach(function (key) {
                if (key.indexOf('sys-') === 0) {
                    return;
                }
                caches.delete(key);
            });
        });
    }
})();
