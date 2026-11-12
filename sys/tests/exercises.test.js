'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const nl = require('../assets/numlib.js');
const exercises = require('../assets/exercises.js');

function seeded(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const TYPES = ['to-decimal', 'from-decimal', 'add', 'sub'];

test('Exercises.TYPES содержит четыре типа заданий', () => {
  assert.deepEqual(Object.keys(exercises.TYPES).sort(), TYPES.slice().sort());
});

test('все типы генерируют корректные задания во всех основаниях 2–16', () => {
  for (const type of TYPES) {
    for (let base = 2; base <= 16; base++) {
      for (let i = 0; i < 40; i++) {
        const task = exercises.generate(type, { base, random: seeded(base * 1000 + i) });
        assert.equal(task.base, base);
        assert.equal(task.type, type);
        assert.equal(task.hints.length, 3);
        assert.ok(task.hints.every((hint) => typeof hint === 'string' && hint.length > 0));

        if (type === 'to-decimal') {
          assert.notEqual(task.digits.charAt(0), '0');
          assert.equal(nl.parseInBase(task.digits, base), task.value);
          assert.equal(task.answer, String(task.value));
          assert.equal(task.answerBase, 10);
          assert.equal(task.terms.length, task.digits.length);
          assert.equal(task.terms.reduce((sum, term) => sum + term.product, 0), task.value);
          assert.equal(exercises.check(task, task.answer).ok, true);
          assert.equal(exercises.check(task, '0' + task.answer).ok, true);
        }

        if (type === 'from-decimal') {
          assert.ok(task.value > 0);
          assert.equal(nl.formatInBase(task.value, base), task.answer);
          assert.equal(task.answerBase, base);
          assert.ok(task.answer.length >= 3 && task.answer.length <= 5);
          assert.equal(task.divisions.length, task.answer.length);
          assert.deepEqual(
            task.divisions.map((step) => step.digit).reverse(),
            [...task.answer]
          );
          assert.deepEqual(task.answerDigits, [...task.answer]);
          assert.equal(exercises.check(task, task.answer).ok, true);
          assert.equal(exercises.check(task, task.answer.toLowerCase()).ok, true);
          assert.equal(exercises.check(task, '0' + task.answer).ok, true);
        }

        if (type === 'add') {
          assert.notEqual(task.a.charAt(0), '0');
          assert.notEqual(task.b.charAt(0), '0');
          assert.equal(
            nl.parseInBase(task.a, base) + nl.parseInBase(task.b, base),
            nl.parseInBase(task.answer, base)
          );
          assert.equal(task.value, nl.parseInBase(task.answer, base));
          assert.equal(task.res.length, task.cols);
          assert.equal(task.baseCols, Math.max(task.a.length, task.b.length));
          assert.equal(exercises.check(task, task.answer).ok, true);
        }

        if (type === 'sub') {
          assert.notEqual(task.a.charAt(0), '0');
          assert.notEqual(task.b.charAt(0), '0');
          assert.ok(nl.compareInBase(task.a, task.b, base) > 0);
          assert.equal(
            nl.parseInBase(task.a, base) - nl.parseInBase(task.b, base),
            nl.parseInBase(task.answer, base)
          );
          assert.equal(task.value, nl.parseInBase(task.answer, base));
          assert.equal(task.res.length, task.cols);
          assert.equal(task.baseCols, task.a.length);
          assert.equal(exercises.check(task, task.answer).ok, true);
        }
      }
    }
  }
});

test('проверка отвергает пустой, недопустимый и неверный ответ', () => {
  const task = exercises.generate('from-decimal', { base: 16, random: seeded(7) });
  assert.equal(exercises.check(task, '').ok, false);
  assert.match(exercises.check(task, 'G').error, /цифр|недопустима/);
  assert.equal(exercises.check(task, 'ZZZZ').ok, false);

  const toDecimal = exercises.generate('to-decimal', { base: 2, random: seeded(8) });
  assert.equal(exercises.check(toDecimal, String(toDecimal.value + 1)).ok, false);

  const add = exercises.generate('add', { base: 8, random: seeded(9) });
  assert.equal(exercises.check(add, nl.formatInBase(add.value + 1, 8)).ok, false);
});

test('normalize убирает пробелы и приводит к верхнему регистру', () => {
  assert.equal(exercises.normalize('  a f  '), 'AF');
  assert.equal(exercises.normalize(null), '');
});

test('генерация детерминирована при одинаковом seed', () => {
  const first = exercises.generate('add', { base: 12, random: seeded(42) });
  const second = exercises.generate('add', { base: 12, random: seeded(42) });
  assert.deepEqual(
    { a: first.a, b: first.b, answer: first.answer },
    { a: second.a, b: second.b, answer: second.answer }
  );
});

test('неизвестный тип и неверное основание отклоняются', () => {
  assert.throws(() => exercises.generate('mul', { random: seeded(1) }), /Неизвестный тип/);
  assert.throws(() => exercises.generate('add', { base: 17, random: seeded(1) }), /Основание/);
  assert.throws(() => exercises.check({}, '10'), /Некорректное задание/);
});
