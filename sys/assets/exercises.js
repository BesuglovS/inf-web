/* exercises.js — генерация и проверка заданий тренажёра.
   Работает и в браузере (window.Exercises), и в Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./numlib.js'));
  } else {
    root.Exercises = factory(root.NumLib);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (NL) {
  'use strict';

  var TYPES = {
    'to-decimal': 'Перевод в десятичную',
    'from-decimal': 'Перевод из десятичной',
    add: 'Сложение столбиком',
    sub: 'Вычитание столбиком'
  };

  var MAX_TO_DECIMAL = 1000000;
  var MAX_FROM_DECIMAL = 65535;

  function rnd(random) {
    var value = random();
    if (value >= 1) return 0.999999999;
    if (value < 0) return 0;
    return value;
  }

  function randomInt(random, min, max) {
    return min + Math.floor(rnd(random) * (max - min + 1));
  }

  function randomBase(random) {
    return randomInt(random, 2, 16);
  }

  function randomDigits(random, base, length) {
    var out = '';
    for (var i = 0; i < length; i++) {
      var value = i === 0
        ? randomInt(random, 1, base - 1)
        : randomInt(random, 0, base - 1);
      out += NL.digitChar(value);
    }
    return out;
  }

  function baseOption(options, random) {
    if (options && options.base !== undefined && options.base !== null && options.base !== '') {
      return NL.assertBase(Number(options.base));
    }
    return randomBase(random);
  }

  function toDecimalLength(random, base) {
    if (base === 2) return randomInt(random, 5, 9);
    if (base <= 4) return randomInt(random, 4, 7);
    if (base <= 8) return randomInt(random, 3, 6);
    return randomInt(random, 2, 5);
  }

  function makeToDecimal(random, base) {
    var digits = '';
    var value = 0;
    for (var attempt = 0; attempt < 60; attempt++) {
      digits = randomDigits(random, base, toDecimalLength(random, base));
      value = NL.parseInBase(digits, base);
      if (value >= 2 && value <= MAX_TO_DECIMAL) break;
    }
    if (!digits || value < 2 || value > MAX_TO_DECIMAL) {
      value = randomInt(random, 16, MAX_FROM_DECIMAL);
      digits = NL.formatInBase(value, base);
    }

    var terms = [];
    for (var i = 0; i < digits.length; i++) {
      var position = digits.length - 1 - i;
      var digit = NL.digitVal(digits.charAt(i));
      var weight = Math.pow(base, position);
      terms.push({
        digit: digit,
        position: position,
        weight: weight,
        product: digit * weight
      });
    }

    var n = digits.length - 1;
    var hints = [
      'Разряды нумеруются справа налево с нуля. Умножьте каждую цифру на основание в степени её разряда.',
      'Старший разряд: <span class="mono">' + terms[0].digit + ' × ' + base + '<sup>' + terms[0].position + '</sup> = ' + NL.fmt(terms[0].product) + '</span>.',
      'Следующий разряд: <span class="mono">' + terms[1].digit + ' × ' + base + '<sup>' + terms[1].position + '</sup> = ' + NL.fmt(terms[1].product) + '</span>.'
    ];

    return {
      type: 'to-decimal',
      base: base,
      answerBase: 10,
      digits: digits,
      terms: terms,
      value: value,
      answer: String(value),
      hints: hints
    };
  }

  function makeFromDecimal(random, base) {
    var digits = randomDigits(random, base, randomInt(random, 3, 5));
    var value = NL.parseInBase(digits, base);
    var answer = NL.formatInBase(value, base);
    var divisions = [];
    var current = value;
    while (current > 0) {
      var quotient = Math.floor(current / base);
      var remainder = current % base;
      divisions.push({
        dividend: current,
        quotient: quotient,
        remainder: remainder,
        digit: NL.digitChar(remainder)
      });
      current = quotient;
    }
    var answerDigits = divisions.map(function (step) { return step.digit; }).reverse();

    var hints = [
      'Делите число на основание с остатком, пока частное не станет нулём. Остатки читайте снизу вверх.',
      'Первый шаг: <span class="mono">' + divisions[0].dividend + ' = ' + divisions[0].quotient + ' · ' + base + ' + ' + divisions[0].remainder + '</span>. Младшая цифра — <b>' + divisions[0].digit + '</b>.',
      divisions[1]
        ? 'Следующий шаг: <span class="mono">' + divisions[1].dividend + ' = ' + divisions[1].quotient + ' · ' + base + ' + ' + divisions[1].remainder + '</span>.'
        : 'Остаток последнего деления — старшая цифра ответа.'
    ];

    return {
      type: 'from-decimal',
      base: base,
      answerBase: base,
      value: value,
      digits: answer,
      divisions: divisions,
      answerDigits: answerDigits,
      answer: answer,
      hints: hints
    };
  }

  function makeAdd(random, base) {
    var a = randomDigits(random, base, randomInt(random, 3, 4));
    var b = randomDigits(random, base, randomInt(random, 2, 3));
    var computed = NL.computeAddition(a, b, base);
    var value = NL.parseInBase(computed.result, base);

    var hints = [
      'Складывайте справа налево. Если сумма в разряде больше или равна основанию, запишите сумму минус основание и перенесите 1.',
      NL.stepText(computed.steps[0], 'add', base, computed.cols, computed.result),
      computed.steps[1]
        ? NL.stepText(computed.steps[1], 'add', base, computed.cols, computed.result)
        : 'Не забудьте про перенос в следующий разряд.'
    ];

    return {
      type: 'add',
      base: base,
      answerBase: base,
      a: a,
      b: b,
      value: value,
      answer: computed.result,
      steps: computed.steps,
      res: computed.res,
      cols: computed.cols,
      baseCols: Math.max(a.length, b.length),
      hints: hints
    };
  }

  function makeSub(random, base) {
    var a;
    var b;
    var attempts = 0;
    do {
      a = randomDigits(random, base, randomInt(random, 3, 5));
      b = randomDigits(random, base, randomInt(random, 2, 4));
      attempts++;
    } while (NL.compareInBase(a, b, base) <= 0 && attempts < 60);

    if (NL.compareInBase(a, b, base) <= 0) {
      a = randomDigits(random, base, 4);
      b = randomDigits(random, base, 2);
    }

    var computed = NL.computeSubtraction(a, b, base);
    var value = NL.parseInBase(computed.result, base);

    var hints = [
      'Вычитайте справа налево. Если верхней цифры не хватает, займите единицу старшего разряда — она добавит основание к текущему разряду.',
      NL.stepText(computed.steps[0], 'sub', base, computed.cols, computed.result),
      computed.steps[1]
        ? NL.stepText(computed.steps[1], 'sub', base, computed.cols, computed.result)
        : 'Проверьте ответ сложением: разность плюс вычитаемое должны дать уменьшаемое.'
    ];

    return {
      type: 'sub',
      base: base,
      answerBase: base,
      a: a,
      b: b,
      value: value,
      answer: computed.result,
      steps: computed.steps,
      res: computed.res,
      sigMax: computed.sigMax,
      cols: computed.cols,
      baseCols: a.length,
      hints: hints
    };
  }

  function generate(type, options) {
    if (!TYPES[type]) throw new Error('Неизвестный тип задания: ' + type);
    options = options || {};
    var random = typeof options.random === 'function' ? options.random : Math.random;
    var base = baseOption(options, random);

    if (type === 'to-decimal') return makeToDecimal(random, base);
    if (type === 'from-decimal') return makeFromDecimal(random, base);
    if (type === 'add') return makeAdd(random, base);
    return makeSub(random, base);
  }

  function normalize(raw) {
    return String(raw == null ? '' : raw).replace(/\s+/g, '').toUpperCase();
  }

  function check(exercise, raw) {
    if (!exercise || !exercise.answerBase) {
      throw new Error('Некорректное задание.');
    }
    var normalized = normalize(raw);
    if (!normalized) return { ok: false, error: 'Введите ответ.' };

    var value;
    try {
      value = NL.parseInBase(normalized, exercise.answerBase);
    } catch (err) {
      return { ok: false, error: err.message };
    }

    if (value === exercise.value) {
      return { ok: true, normalized: normalized, value: value };
    }

    var message = exercise.type === 'add' || exercise.type === 'sub'
      ? 'Пока неверно. Проверьте переносы и порядок разрядов.'
      : 'Пока неверно. Проверьте разряды и веса цифр.';
    return { ok: false, error: message };
  }

  return {
    TYPES: TYPES,
    generate: generate,
    check: check,
    normalize: normalize
  };
});
