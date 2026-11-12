/* sw.js — офлайн-кэш статического курса «Системы счисления».
   Версию кэша меняйте вместе с ?v= у assets в HTML. */
'use strict';

var VERSION = '20261112-2';
var CACHE = 'sys-' + VERSION;
var SCOPE_ROOT = new URL('./', self.registration.scope).href;
var SCOPE_PATH = new URL(SCOPE_ROOT).pathname;
var INDEX_URL = new URL('index.html', self.registration.scope).href;

var CORE = [
  './',
  'index.html',
  '01-osnovy.html',
  '02-istoriya.html',
  '03-vidy.html',
  '04-v-desyatichnuyu.html',
  '05-iz-desyatichnoy.html',
  '06-rodstvennye.html',
  '07-slozhenie-vychitanie.html',
  '08-umnozhenie-delenie.html',
  '09-praktika.html',
  'trenazher.html',
  'manifest.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'assets/style.css?v=20261112-2',
  'assets/fonts.css?v=20261112-2',
  'assets/numlib.js?v=20261112-2',
  'assets/exercises.js?v=20261112-2',
  'assets/app.js?v=20261112-2',
  'assets/icon.svg?v=20261112-2',
  'assets/icon-192.png?v=20261112-2',
  'assets/icon-512.png?v=20261112-2',
  'assets/og-image.png?v=20261112-2',
  'assets/fonts/golos-text-400-cyrillic.woff2?v=20261112-2',
  'assets/fonts/golos-text-400-latin.woff2?v=20261112-2',
  'assets/fonts/jetbrains-mono-400-cyrillic.woff2?v=20261112-2',
  'assets/fonts/jetbrains-mono-400-latin.woff2?v=20261112-2',
  'assets/fonts/yeseva-one-400-cyrillic.woff2?v=20261112-2',
  'assets/fonts/yeseva-one-400-latin.woff2?v=20261112-2'
];

function inScope(url) {
  var pathname = url.pathname;
  return pathname.indexOf(SCOPE_PATH) === 0 ||
    pathname === SCOPE_PATH.replace(/\/$/, '');
}

function offlineResponse() {
  return new Response('Офлайн: страница не найдена в кэше.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

function cachePut(request, response) {
  if (!response || !response.ok) return Promise.resolve();
  var copy = response.clone();
  return caches.open(CACHE)
    .then(function (cache) { return cache.put(request, copy); })
    .catch(function () { /* кэш не критичен для ответа */ });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(CORE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys
        .filter(function (key) { return key.indexOf('sys-') === 0 && key !== CACHE; })
        .map(function (key) { return caches.delete(key); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin || !inScope(url)) return;

  /* Страницы: сначала сеть, затем кэш. Так обновления видны сразу. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.ok) {
          /* Не плодим копии страницы для ?n=...&b=... и учитываем редирект
             /sys → /sys/, чтобы офлайн-кэш сохранил правильный путь. */
          var finalUrl = new URL(response.url || url.href);
          var cachePath = finalUrl.origin === url.origin ? finalUrl.pathname : url.pathname;
          event.waitUntil(cachePut(new Request(url.origin + cachePath), response));
        }
        return response;
      }).catch(function () {
        return caches.match(request, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;

          /* Корень и index.html можно отдать из кэша. Для вложенного URL
             возвращаем редирект на корень, иначе относительные ссылки
             главной страницы будут разрешаться от /sys/foo/bar. */
          if (url.pathname === SCOPE_PATH ||
              url.pathname === SCOPE_PATH + 'index.html') {
            return caches.match(SCOPE_ROOT).then(function (root) {
              return root || caches.match(INDEX_URL).then(function (index) {
                return index || offlineResponse();
              });
            });
          }
          return Response.redirect(SCOPE_ROOT, 302);
        });
      })
    );
    return;
  }

  /* Ресурсы: сначала кэш, затем сеть с сохранением копии. */
  event.respondWith(
    caches.match(request).then(function (hit) {
      if (hit) return hit;
      return fetch(request).then(function (response) {
        if (response && response.ok) event.waitUntil(cachePut(request, response));
        return response;
      });
    })
  );
});
