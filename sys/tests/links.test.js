'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function idsOf(text) {
  return new Set([...text.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
}

test('все локальные ссылки и якоря существуют', () => {
  const problems = [];
  for (const file of htmlFiles) {
    const text = read(file);
    const ids = idsOf(text);
    for (const match of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const raw = match[1];
      if (/^(?:https?:|data:|mailto:|tel:)/.test(raw)) continue;

      // 404.html использует <base href="/sys/">, чтобы работать на вложенных URL.
      const local = raw.startsWith('/sys/') ? raw.slice('/sys/'.length) : raw;
      const [pathAndQuery, fragment] = local.split('#');
      const pathPart = pathAndQuery.split('?')[0];
      if (!pathPart) {
        if (fragment && !ids.has(fragment)) problems.push(`${file}: нет якоря #${fragment}`);
        continue;
      }

      const target = path.resolve(root, pathPart);
      if (!fs.existsSync(target)) {
        problems.push(`${file}: нет файла ${pathPart}`);
        continue;
      }

      if (fragment && target.endsWith('.html')) {
        const targetIds = idsOf(fs.readFileSync(target, 'utf8'));
        if (!targetIds.has(fragment)) problems.push(`${file}: нет якоря #${fragment} в ${pathPart}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('в HTML нет дублирующихся id', () => {
  const problems = [];
  for (const file of htmlFiles) {
    const text = read(file);
    const seen = new Set();
    for (const match of text.matchAll(/\bid="([^"]+)"/g)) {
      if (seen.has(match[1])) problems.push(`${file}: повтор id="${match[1]}"`);
      seen.add(match[1]);
    }
  }
  assert.deepEqual(problems, []);
});

test('aria-labelledby / aria-describedby / aria-controls ссылаются на существующие id', () => {
  const problems = [];
  for (const file of htmlFiles) {
    const text = read(file);
    const ids = idsOf(text);
    for (const match of text.matchAll(/\baria-(?:labelledby|describedby|controls|owns)="([^"]+)"/g)) {
      for (const ref of match[1].split(/\s+/)) {
        if (ref && !ids.has(ref)) problems.push(`${file}: ARIA-ссылка на отсутствующий id="${ref}"`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('все страницы подключают локальные стили и скрипты с версией', () => {
  const problems = [];
  for (const file of htmlFiles) {
    if (file === '404.html') continue;
    const text = read(file);
    if (!/assets\/style\.css\?v=/.test(text)) problems.push(`${file}: style.css без версии`);
    if (!/assets\/numlib\.js\?v=/.test(text)) problems.push(`${file}: numlib.js без версии`);
    if (!/assets\/app\.js\?v=/.test(text)) problems.push(`${file}: app.js без версии`);
    if (!/rel="canonical"/.test(text)) problems.push(`${file}: нет canonical`);
  }
  assert.deepEqual(problems, []);
});

test('шрифты подключены локально и все файлы существуют', () => {
  const cssPath = path.join(root, 'assets', 'fonts.css');
  assert.ok(fs.existsSync(cssPath), 'нет assets/fonts.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, ''));
  assert.ok(urls.length > 0, 'в fonts.css нет url(...)');
  for (const url of urls) {
    const clean = url.split('?')[0];
    assert.ok(fs.existsSync(path.join(root, 'assets', clean)), `нет файла шрифта ${url}`);
  }
  for (const file of htmlFiles) {
    const text = read(file);
    assert.doesNotMatch(text, /fonts\.googleapis\.com|fonts\.gstatic\.com/, `${file}: остался внешний Google Fonts`);
    assert.match(text, /assets\/fonts\.css\?v=/, `${file}: нет локального fonts.css`);
  }
});
