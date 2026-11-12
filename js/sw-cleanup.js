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
            registration.unregister();
        });
    });

    if (window.caches && caches.keys) {
        caches.keys().then(function (keys) {
            keys.forEach(function (key) {
                caches.delete(key);
            });
        });
    }
})();
