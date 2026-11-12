'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const version = /var VERSION = '([^']+)'/.exec(source)[1];
const currentCache = 'sys-' + version;

function harness(options) {
  options = options || {};
  const calls = {
    deleted: [],
    added: [],
    put: [],
    matches: [],
    waitUntil: 0
  };
  const handlers = {};

  const cache = {
    addAll(entries) {
      calls.added = entries;
      return Promise.resolve();
    },
    put(request, response) {
      calls.put.push({ request, response });
      return Promise.resolve();
    }
  };

  const caches = {
    keys() { return Promise.resolve(options.keys || []); },
    delete(key) {
      calls.deleted.push(key);
      return Promise.resolve(true);
    },
    open() { return Promise.resolve(cache); },
    match(request, matchOptions) {
      calls.matches.push({ request, options: matchOptions });
      return Promise.resolve(options.match ? options.match(request, matchOptions) : undefined);
    }
  };

  const self = {
    registration: { scope: 'https://example.test/sys/' },
    location: { origin: 'https://example.test' },
    addEventListener(type, handler) { handlers[type] = handler; },
    skipWaiting() { return Promise.resolve(); },
    clients: { claim() { return Promise.resolve(); } }
  };

  vm.runInNewContext(source, {
    self,
    caches,
    URL,
    Request,
    Response,
    Promise,
    console,
    fetch: options.fetch || (() => Promise.resolve(new Response('ok', { status: 200 })))
  }, { filename: 'sw.js' });

  return { handlers, calls };
}

function dispatchFetch(handler, request, fetchImpl) {
  const waitPromises = [];
  let responsePromise;
  const event = {
    request,
    respondWith(promise) { responsePromise = promise; },
    waitUntil(promise) { waitPromises.push(promise); }
  };
  handler(event);
  return {
    event,
    async response() {
      const response = await responsePromise;
      await Promise.resolve();
      await Promise.all(waitPromises);
      return response;
    }
  };
}

test('service worker удаляет только старые кэши sys-*', async () => {
  const { handlers, calls } = harness({
    keys: ['sys-20260101-1', currentCache, 'other-app-cache']
  });
  let wait;
  handlers.activate({ waitUntil(promise) { wait = promise; } });
  await wait;
  assert.deepEqual(calls.deleted, ['sys-20260101-1']);
});

test('service worker кэширует успешную навигацию через waitUntil', async () => {
  const response = new Response('<html>ok</html>', { status: 200 });
  const { handlers, calls } = harness({
    fetch() { return Promise.resolve(response); }
  });
  const request = new Request('https://example.test/sys/01-osnovy.html', { method: 'GET' });
  Object.defineProperty(request, 'mode', { value: 'navigate' });

  const result = dispatchFetch(handlers.fetch, request);
  const actual = await result.response();
  assert.equal(actual.status, 200);
  assert.equal(calls.put.length, 1);
  assert.equal(calls.put[0].request.url, request.url);
});

test('офлайн-переход на вложенный URL перенаправляет на корень scope', async () => {
  const { handlers } = harness({
    fetch() { return Promise.reject(new Error('offline')); },
    match() { return undefined; }
  });
  const request = new Request('https://example.test/sys/foo/bar', { method: 'GET' });
  Object.defineProperty(request, 'mode', { value: 'navigate' });

  const result = dispatchFetch(handlers.fetch, request);
  const response = await result.response();
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://example.test/sys/');
});

test('service worker не вмешивается в запросы вне scope', async () => {
  const { handlers } = harness();
  const request = new Request('https://example.test/other/app.js', { method: 'GET' });
  let responded = false;
  handlers.fetch({
    request,
    respondWith() { responded = true; },
    waitUntil() {}
  });
  assert.equal(responded, false);
});
