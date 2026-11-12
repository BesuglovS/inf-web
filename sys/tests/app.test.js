'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const nl = require('../assets/numlib.js');

const root = path.resolve(__dirname, '..');
const numlibSource = fs.readFileSync(path.join(root, 'assets', 'numlib.js'), 'utf8');
const exercisesSource = fs.readFileSync(path.join(root, 'assets', 'exercises.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'assets', 'app.js'), 'utf8');

function loadPage(file, search) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const url = 'https://example.test/sys/' + file + (search || '');
  const dom = new JSDOM(html, {
    url,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  dom.window.eval(numlibSource);
  dom.window.eval(exercisesSource);
  dom.window.eval(appSource);
  return dom;
}

function typeInto(dom, element, value) {
  element.value = value;
  element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

function plain(text) {
  return text.replace(/\s/g, '');
}

function setTrainerCell(card, cell, key, value) {
  let suffix = '';
  if (key !== undefined) {
    const positional = cell === 'carry' || cell === 'borrow' || cell === 'result';
    suffix = positional
      ? '[data-pos="' + key + '"]'
      : '[data-index="' + key + '"]';
  }
  const input = card.querySelector('[data-cell="' + cell + '"]' + suffix);
  assert.ok(input, `нет клетки ${cell} ${key}`);
  input.value = String(value);
  return input;
}

test('главная: ошибка ввода снимается при смене основания', () => {
  const dom = loadPage('index.html');
  const doc = dom.window.document;
  const input = doc.querySelector('#numInput');
  const field = doc.querySelector('#numField');

  assert.equal(input.value, '2026');
  typeInto(dom, input, '2F');
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.ok(field.classList.contains('has-error'));
  assert.match(doc.querySelector('#machineError').textContent, /не является цифрой/);

  doc.querySelector('.base-chip[data-base="16"]').click();

  assert.equal(input.value, '7EA');
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.equal(field.classList.contains('has-error'), false);
  assert.equal(doc.querySelector('#machineError').textContent, '');
});

test('главная: корректный ввод обновляет разбор и снимает ошибку', () => {
  const dom = loadPage('index.html', '?n=2F&b=16');
  const doc = dom.window.document;
  const input = doc.querySelector('#numInput');

  assert.equal(input.value, '2F');
  assert.equal(plain(doc.querySelector('#machineValue').textContent), '47');

  typeInto(dom, input, 'G');
  assert.equal(input.getAttribute('aria-invalid'), 'true');

  typeInto(dom, input, '10');
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.equal(plain(doc.querySelector('#machineValue').textContent), '16');

  typeInto(dom, input, '0');
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.equal(plain(doc.querySelector('#machineValue').textContent), '0');
});

test('главная: лимит ввода вмещает Number.MAX_SAFE_INTEGER', () => {
  const dom = loadPage('index.html');
  const doc = dom.window.document;
  const input = doc.querySelector('#numInput');
  const maxSafe = String(Number.MAX_SAFE_INTEGER);

  assert.equal(input.maxLength, maxSafe.length);
  typeInto(dom, input, maxSafe);
  assert.equal(plain(doc.querySelector('#machineValue').textContent), maxSafe);
  assert.equal(input.hasAttribute('aria-invalid'), false);

  typeInto(dom, input, '9007199254740992');
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.match(doc.querySelector('#machineError').textContent, /Слишком большое/);

  doc.querySelector('.base-chip[data-base="2"]').click();
  assert.equal(input.maxLength, 53);
  doc.querySelector('.base-chip[data-base="16"]').click();
  assert.equal(input.maxLength, 14);
});

test('главная: неверные параметры URL игнорируются', () => {
  for (const search of ['?b=99&n=10', '?b=2&n=2', '?n=GG&b=16', '?b=2', '?b=16x&n=2F', '?b=2.5&n=10']) {
    const dom = loadPage('index.html', search);
    const doc = dom.window.document;
    assert.equal(doc.querySelector('#numInput').value, '2026', search);
  }
});

test('главная: URL-состояние нормализуется', () => {
  const dom = loadPage('index.html', '?n=2f&b=016');
  const doc = dom.window.document;
  assert.equal(doc.querySelector('#numInput').value, '2F');
  const params = new URLSearchParams(dom.window.location.search);
  assert.equal(params.get('n'), '2F');
  assert.equal(params.get('b'), '16');

  const dom2 = loadPage('index.html', '?b=16');
  assert.equal(dom2.window.document.querySelector('#numInput').value, '2026');
  const params2 = new URLSearchParams(dom2.window.location.search);
  assert.equal(params2.get('n'), '2026');
  assert.equal(params2.get('b'), '10');
});

test('главная: fallback копирования копирует валидное число, а не невалидный ввод', () => {
  const dom = loadPage('index.html');
  const doc = dom.window.document;
  Object.defineProperty(dom.window.navigator, 'clipboard', { value: undefined, configurable: true });

  let copied = null;
  doc.execCommand = (command) => {
    if (command === 'copy') {
      copied = doc.activeElement && doc.activeElement.value;
      return true;
    }
    return false;
  };

  const input = doc.querySelector('#numInput');
  input.value = 'G';
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(input.getAttribute('aria-invalid'), 'true');

  doc.querySelector('#machineCopy').click();
  assert.equal(copied, '2026');
  assert.equal(input.value, '2026');
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.match(doc.querySelector('#machineError').textContent, /Скопировано: 2026/);
});

test('главная: случайное число всегда валидно', () => {
  const dom = loadPage('index.html');
  const doc = dom.window.document;
  const input = doc.querySelector('#numInput');

  doc.querySelector('#machineRandom').click();
  assert.ok(input.value.length > 0);
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.doesNotThrow(() => nl.validateNumber(input.value, 10));
});

test('дробный тренажёр показывает точные шаги, а не округление float', () => {
  const dom = loadPage('05-iz-desyatichnoy.html');
  const doc = dom.window.document;
  const input = doc.querySelector('#fracInput');
  const select = doc.querySelector('#fracBase');
  const button = doc.querySelector('#fracGo');

  input.value = '0,1';
  select.value = '2';
  button.click();

  const text = doc.querySelector('#fracResult').textContent;
  assert.match(text, /0,1 · 2 = 0,2/);
  assert.match(text, /0,0\(0011\)/);
  assert.doesNotMatch(text, /0,0999|0,1999|0,200000|0,000999/);
  assert.equal(input.hasAttribute('aria-invalid'), false);
});

test('дробный тренажёр сообщает об ошибке и очищает её', () => {
  const dom = loadPage('05-iz-desyatichnoy.html');
  const doc = dom.window.document;
  const input = doc.querySelector('#fracInput');

  input.value = '1,5';
  doc.querySelector('#fracGo').click();
  assert.equal(input.getAttribute('aria-invalid'), 'true');
  assert.match(doc.querySelector('#fracResult').textContent, /от 0 до 1/);

  input.value = '0,625';
  doc.querySelector('#fracGo').click();
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.match(doc.querySelector('#fracResult').textContent, /0,101/);
});

test('тренажёр столбика доходит до верного ответа и меняет пример', () => {
  const dom = loadPage('07-slozhenie-vychitanie.html');
  const doc = dom.window.document;

  doc.querySelector('#calcAll').click();
  assert.match(doc.querySelector('#calcNote').textContent, /A9/);
  assert.match(doc.querySelector('#calcProgress').textContent, /2 из 2/);

  doc.querySelector('#tabSub').click();
  doc.querySelector('#calcAll').click();
  assert.match(doc.querySelector('#calcNote').textContent, /2F/);

  doc.querySelector('#calcBases [data-base="2"]').click();
  assert.match(doc.querySelector('#calcExpr').textContent, /11000/);

  doc.querySelector('#tabAdd').click();
  doc.querySelector('#calcNew').click();
  assert.ok(doc.querySelector('#calcExpr').textContent.trim().length > 0);
  assert.equal(doc.querySelector('#calcNext').disabled, false);
});

test('тренажёр: пошаговый ввод, проверка, подсказки и новое задание', () => {
  const dom = loadPage('trenazher.html');
  const doc = dom.window.document;
  const cards = [...doc.querySelectorAll('.trainer-card')];
  assert.equal(cards.length, 4);
  assert.ok(doc.documentElement.classList.contains('is-enhanced'));

  const add = cards.find((card) => card.dataset.type === 'add');
  const addBase = Number(add.dataset.base);
  const addComputed = nl.computeAddition(add.dataset.a, add.dataset.b, addBase);
  const addBaseCols = Math.max(add.dataset.a.length, add.dataset.b.length);
  for (let p = 1; p < addBaseCols; p++) {
    setTrainerCell(add, 'carry', p, addComputed.steps[p - 1].carryOut);
  }
  for (let p = 0; p < addComputed.cols; p++) {
    setTrainerCell(add, 'result', p, nl.digitChar(addComputed.res[p]));
  }
  add.querySelector('[id^="trainer-check-"]').click();
  assert.match(add.querySelector('.trainer-status').textContent, /Верно/);
  assert.ok([...add.querySelectorAll('.trainer-cell')].every((input) => input.disabled));
  assert.match(add.querySelector('.trainer-stats').textContent, /Верно: 1/);

  const toDecimal = cards.find((card) => card.dataset.type === 'to-decimal');
  const sourceBase = Number(toDecimal.dataset.base);
  const sourceDigits = toDecimal.dataset.value;
  const value = nl.parseInBase(sourceDigits, sourceBase);
  for (let i = 0; i < sourceDigits.length; i++) {
    const position = sourceDigits.length - 1 - i;
    setTrainerCell(toDecimal, 'term', i, nl.digitVal(sourceDigits.charAt(i)) * Math.pow(sourceBase, position));
  }
  const sum = setTrainerCell(toDecimal, 'sum', undefined, value + 1);
  toDecimal.querySelector('[id^="trainer-check-"]').click();
  assert.match(toDecimal.querySelector('.trainer-status').textContent, /Пока неверно/);
  assert.equal(sum.getAttribute('aria-invalid'), 'true');

  sum.value = 'G';
  toDecimal.querySelector('[id^="trainer-check-"]').click();
  assert.ok(sum.classList.contains('is-wrong'));

  const hint = toDecimal.querySelector('[id^="trainer-hint-"]');
  const hints = toDecimal.querySelector('.trainer-hints');
  hint.click();
  assert.equal(hints.querySelectorAll('li').length, 1);
  hint.click();
  hint.click();
  assert.equal(hints.querySelectorAll('li').length, 3);
  assert.equal(hint.disabled, true);

  toDecimal.querySelector('[id^="trainer-new-"]').click();
  assert.equal(hints.querySelectorAll('li').length, 0);
  assert.equal(toDecimal.querySelector('.trainer-status').textContent, '');
  assert.ok(toDecimal.querySelectorAll('.trainer-cell').length > 0);

  const newSourceBase = Number(toDecimal.dataset.base);
  const newSourceDigits = toDecimal.dataset.value;
  const newValue = nl.parseInBase(newSourceDigits, newSourceBase);
  for (let i = 0; i < newSourceDigits.length; i++) {
    const position = newSourceDigits.length - 1 - i;
    setTrainerCell(toDecimal, 'rank', i, position);
    setTrainerCell(toDecimal, 'exponent', i, position);
    setTrainerCell(toDecimal, 'term', i, nl.digitVal(newSourceDigits.charAt(i)) * Math.pow(newSourceBase, position));
  }
  setTrainerCell(toDecimal, 'sum', undefined, newValue);
  toDecimal.querySelector('[id^="trainer-check-"]').click();
  assert.match(toDecimal.querySelector('.trainer-status').textContent, /Верно/);

  const fromDecimal = cards.find((card) => card.dataset.type === 'from-decimal');
  const fromBase = Number(fromDecimal.dataset.base);
  const fromValue = Number(fromDecimal.dataset.value);
  const divisions = [];
  let current = fromValue;
  while (current > 0) {
    const quotient = Math.floor(current / fromBase);
    const remainder = current % fromBase;
    divisions.push({ quotient, digit: nl.digitChar(remainder) });
    current = quotient;
  }
  divisions.forEach((step, i) => {
    setTrainerCell(fromDecimal, 'quotient', i, step.quotient);
    setTrainerCell(fromDecimal, 'remainder', i, step.digit);
  });
  const answer = nl.formatInBase(fromValue, fromBase);
  [...answer].forEach((digit, i) => setTrainerCell(fromDecimal, 'answer-digit', i, digit));
  fromDecimal.querySelector('[id^="trainer-check-"]').click();
  assert.match(fromDecimal.querySelector('.trainer-status').textContent, /Верно/);
  assert.match(fromDecimal.querySelector('.trainer-status').textContent, new RegExp(answer));
});

test('тренажёр: выбор основания и показ ответа после двух ошибок', () => {
  const dom = loadPage('trenazher.html');
  const doc = dom.window.document;
  const select = doc.querySelector('#trainerBase');
  select.value = '8';
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.ok([...doc.querySelectorAll('.trainer-card')].every((card) => card.dataset.base === '8'));

  const card = doc.querySelector('[data-type="sub"]');
  const resultInput = card.querySelector('[data-cell="result"]');
  const show = card.querySelector('[id^="trainer-show-"]');
  resultInput.value = 'Z';
  card.querySelector('[id^="trainer-check-"]').click();
  assert.equal(show.hidden, true);
  card.querySelector('[id^="trainer-check-"]').click();
  assert.equal(show.hidden, false);

  show.click();
  assert.match(card.querySelector('.trainer-status').textContent, /Правильный ответ/);
  assert.ok([...card.querySelectorAll('.trainer-cell')].every((input) => input.disabled));

  doc.querySelector('#trainerReset').click();
  assert.equal(doc.querySelector('#trainerScore').textContent, 'Верно: 0 · Попыток: 0');
});

test('печать раскрывает ответы и затем возвращает прежнее состояние', () => {
  const dom = loadPage('09-praktika.html');
  const details = [...dom.window.document.querySelectorAll('details')];
  assert.ok(details.length > 0);
  assert.equal(details[0].open, false);

  dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
  assert.ok(details.every((item) => item.open));

  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.equal(details[0].open, false);
});

test('викторина умножения принимает верный ответ и отвергает неверный', () => {
  const dom = loadPage('08-umnozhenie-delenie.html');
  const doc = dom.window.document;
  const expr = doc.querySelector('#mulExpr').innerHTML;
  const match = expr.match(/^([0-9A-F]+)<sub>(\d+)<\/sub> · ([0-9A-F]+)<sub>\d+<\/sub>$/);
  assert.ok(match, 'не удалось разобрать пример: ' + expr);

  const base = Number(match[2]);
  const product = nl.parseInBase(match[1], base) * nl.parseInBase(match[3], base);
  const answer = nl.formatInBase(product, base);
  const input = doc.querySelector('#mulAnswer');

  input.value = 'ZZ';
  doc.querySelector('#mulCheck').click();
  assert.match(doc.querySelector('#mulStatus').textContent, /недопустима|цифр/);
  assert.equal(input.getAttribute('aria-invalid'), 'true');

  input.value = answer;
  doc.querySelector('#mulCheck').click();
  assert.match(doc.querySelector('#mulStatus').textContent, /Верно/);
  assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.ok(doc.querySelector('#mulStatus').classList.contains('is-ok'));
});

test('app.js безопасно загружается на всех страницах курса и включает progressive enhancement', () => {
  const pages = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
  for (const file of pages) {
    assert.doesNotThrow(() => loadPage(file), file);
  }
  const dom = loadPage('index.html');
  assert.ok(dom.window.document.documentElement.classList.contains('is-enhanced'));
});

test('тренажёр без Exercises показывает fallback и не включает карточки', () => {
  const html = fs.readFileSync(path.join(root, 'trenazher.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://example.test/sys/trenazher.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole()
  });
  dom.window.eval(numlibSource);
  dom.window.eval(appSource);
  assert.match(dom.window.document.querySelector('.js-fallback').textContent, /модуль заданий/);
  assert.equal(dom.window.document.documentElement.classList.contains('is-enhanced'), false);
});

test('без NumLib интерфейс сообщает об ошибке, а не падает', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'https://example.test/sys/index.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole()
  });
  dom.window.eval(appSource);
  assert.match(dom.window.document.querySelector('#machineError').textContent, /Не удалось загрузить/);
  assert.match(dom.window.document.querySelector('.js-fallback').textContent, /Не удалось загрузить/);
  assert.equal(dom.window.document.documentElement.classList.contains('is-enhanced'), false);
});
