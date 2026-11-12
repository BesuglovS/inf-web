'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const base = 'https://inf.nayanovaacademy.ru/sys/';
const allHtml = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
const pages = allHtml.filter((name) => name !== '404.html');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function versionFromFonts() {
  const match = read('assets/fonts.css').match(/\.woff2\?v=([^)'"]+)/);
  assert.ok(match, 'в fonts.css нет версии шрифтов');
  return match[1];
}

function pngSize(file) {
  const buffer = fs.readFileSync(path.join(root, file));
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG', `${file}: не PNG`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('у каждой страницы есть базовая SEO- и accessibility-разметка', () => {
  for (const file of pages) {
    const text = read(file);
    assert.match(text, /<html lang="ru">/, `${file}: нет lang="ru"`);
    assert.match(text, /<meta name="viewport"/, `${file}: нет viewport`);
    assert.match(text, /<title>[^<]+<\/title>/, `${file}: нет title`);
    assert.match(text, /<meta name="description" content="[^"]+">/, `${file}: нет description`);
    assert.equal((text.match(/<h1\b/g) || []).length, 1, `${file}: должен быть ровно один h1`);
    assert.match(text, /<link rel="canonical" href="[^"]+">/, `${file}: нет canonical`);
    assert.match(text, /<meta name="twitter:card" content="summary_large_image">/, `${file}: twitter card`);
    assert.match(text, /<meta property="og:image:type" content="image\/png">/, `${file}: og:image:type`);
    assert.match(text, /<link rel="manifest" href="manifest\.webmanifest">/, `${file}: нет manifest`);
    assert.match(text, /<meta name="apple-mobile-web-app-capable" content="yes">/, `${file}: нет iOS PWA meta`);
  }
});

test('canonical и og:url совпадают с адресами страниц', () => {
  for (const file of pages) {
    const text = read(file);
    const expected = base + (file === 'index.html' ? '' : file);
    const canonical = text.match(/<link rel="canonical" href="([^"]+)">/);
    const ogUrl = text.match(/<meta property="og:url" content="([^"]+)">/);
    assert.equal(canonical[1], expected, `${file}: canonical`);
    assert.equal(ogUrl[1], expected, `${file}: og:url`);
  }
});

test('sitemap содержит все страницы курса и не содержит 404', () => {
  const xml = read('sitemap.xml');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = [base, ...pages.filter((name) => name !== 'index.html').map((name) => base + name)];
  assert.deepEqual(locs.slice().sort(), expected.slice().sort());
  assert.doesNotMatch(xml, /404\.html/);
});

test('robots.txt указывает на sitemap и не разрешает весь домен', () => {
  const robots = read('robots.txt');
  assert.match(robots, new RegExp('Sitemap: ' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 'sitemap\\.xml'));
  assert.match(robots, /Allow: \/sys\//);
  assert.doesNotMatch(robots, /Allow: \/(?:\s|$)/);
});

test('404-страница закрыта от индексации и не имеет canonical', () => {
  const text = read('404.html');
  assert.match(text, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(text, /rel="canonical"/);
  assert.equal((text.match(/<h1\b/g) || []).length, 1);
  assert.match(text, /href="\/sys\/assets\/style\.css\?v=/, '404 должна использовать корневые пути при вложенном URL');
  assert.doesNotMatch(text, /<base\b/, 'base ломает ссылки на фрагменты вроде #content');
});

test('preload шрифтов совпадает по версии с fonts.css', () => {
  const version = versionFromFonts();
  for (const file of allHtml) {
    const text = read(file);
    const preloads = [...text.matchAll(/<link rel="preload" href="((?:\/sys\/)?assets\/fonts\/[^"?]+\.woff2)(\?v=([^"]+))?"/g)];
    assert.equal(preloads.length, 2, `${file}: ожидается два preload шрифта`);
    for (const match of preloads) {
      assert.equal(match[3], version, `${file}: версия preload ${match[1]}`);
      const local = match[1].replace(/^\/sys\//, '');
      assert.ok(fs.existsSync(path.join(root, local)), `${file}: нет ${match[1]}`);
    }
  }
});

test('fonts.css объявляет начертания для всех семейств и существующих файлов', () => {
  const css = read('assets/fonts.css');
  const blocks = [...css.matchAll(/@font-face\s*\{([\s\S]*?)\}/g)].map((m) => m[1]);
  assert.ok(blocks.length > 0);
  for (const block of blocks) {
    const weight = block.match(/font-weight:\s*(\d+)/);
    const url = block.match(/url\(([^)]+)\)/);
    assert.ok(weight, 'у @font-face нет font-weight');
    assert.ok(url, 'у @font-face нет url(...)');
    assert.ok(Number.isInteger(Number(weight[1])), 'font-weight должен быть целым');
    assert.ok(fs.existsSync(path.join(root, 'assets', url[1].replace(/['"]/g, '').split('?')[0])),
      `нет файла шрифта ${url[1]}`);
  }
  for (const family of ['Golos Text', 'JetBrains Mono', 'Yeseva One']) {
    const count = blocks.filter((block) => block.includes(`font-family: '${family}'`)).length;
    assert.ok(count >= 2, `${family}: ожидаются минимум cyrillic и latin`);
  }
});

test('manifest корректен и ссылается на существующие иконки', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.lang, 'ru');
  assert.ok(manifest.icons.length >= 2);
  assert.ok(manifest.icons.some((icon) => (icon.purpose || '').includes('maskable')), 'нет maskable-иконки');
  for (const icon of manifest.icons) {
    const src = icon.src.split('?')[0];
    assert.ok(fs.existsSync(path.join(root, src)), `нет иконки ${icon.src}`);
  }
  for (const shortcut of manifest.shortcuts || []) {
    const url = shortcut.url.replace(/^\.\//, '').split('#')[0];
    assert.ok(fs.existsSync(path.join(root, url || 'index.html')), `нет цели shortcut ${shortcut.url}`);
  }
});

test('размеры PNG соответствуют заявленным', () => {
  assert.deepEqual(pngSize('assets/icon-192.png'), { width: 192, height: 192 });
  assert.deepEqual(pngSize('assets/icon-512.png'), { width: 512, height: 512 });
  assert.deepEqual(pngSize('assets/og-image.png'), { width: 1200, height: 630 });
});

test('service worker кэширует все страницы и версионированные ресурсы', () => {
  const sw = read('sw.js');
  assert.doesNotThrow(() => new Function(sw), 'синтаксис sw.js');
  const version = versionFromFonts();
  const block = sw.match(/var CORE = \[([\s\S]*?)\];/);
  assert.ok(block, 'в sw.js нет списка CORE');
  const entries = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  for (const file of allHtml.filter((name) => name !== '404.html')) {
    assert.ok(entries.includes(file), `sw.js не кэширует ${file}`);
  }
  assert.ok(!entries.includes('404.html'), '404.html не должен попадать в офлайн-кэш: nginx может закрывать его через internal');
  for (const asset of [
    'assets/style.css',
    'assets/fonts.css',
    'assets/numlib.js',
    'assets/exercises.js',
    'assets/app.js',
    'assets/icon.svg',
    'assets/icon-192.png',
    'assets/icon-512.png',
    'assets/og-image.png',
    'assets/fonts/golos-text-400-cyrillic.woff2',
    'assets/fonts/golos-text-400-latin.woff2',
    'assets/fonts/jetbrains-mono-400-cyrillic.woff2',
    'assets/fonts/jetbrains-mono-400-latin.woff2',
    'assets/fonts/yeseva-one-400-cyrillic.woff2',
    'assets/fonts/yeseva-one-400-latin.woff2'
  ]) {
    const expected = asset + '?v=' + version;
    assert.ok(entries.includes(expected), `sw.js не кэширует ${expected}`);
    assert.ok(fs.existsSync(path.join(root, asset)), `нет файла ${asset}`);
  }
  assert.match(sw, /self\.addEventListener\('fetch'/);
  assert.match(sw, /key\.indexOf\('sys-'\) === 0/, 'service worker должен удалять только свои кэши');
  assert.match(sw, /event\.waitUntil\(cachePut\(/, 'запись в кэш должна продлевать жизнь события fetch');
  assert.match(read('assets/app.js'), /serviceWorker\.register\('sw\.js'\)/);
});

test('версии assets согласованы во всех HTML, fonts.css и sw.js', () => {
  const version = versionFromFonts();
  const seen = new Set();
  for (const file of allHtml) {
    const text = read(file);
    for (const match of text.matchAll(/\?v=([A-Za-z0-9._-]+)/g)) seen.add(match[1]);
  }
  for (const file of ['assets/fonts.css', 'sw.js', 'manifest.webmanifest']) {
    const text = read(file);
    for (const match of text.matchAll(/\?v=([A-Za-z0-9._-]+)/g)) seen.add(match[1]);
  }
  assert.deepEqual([...seen], [version], 'во всех ссылках должна быть одна версия assets');
  assert.match(read('sw.js'), new RegExp("var VERSION = '" + version + "'"));
  assert.match(read('manifest.webmanifest'), new RegExp('\\?v=' + version));
});

test('внешних подресурсов нет', () => {
  for (const file of allHtml) {
    const text = read(file);
    assert.doesNotMatch(text, /<script[^>]+src="https?:/i, `${file}: внешний скрипт`);
    assert.doesNotMatch(text, /<link[^>]+rel="stylesheet"[^>]+href="https?:/i, `${file}: внешний стиль`);
    assert.doesNotMatch(text, /<img[^>]+src="https?:/i, `${file}: внешняя картинка`);
  }
});

