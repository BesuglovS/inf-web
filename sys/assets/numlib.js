/* numlib.js — чистая логика систем счисления.
   Работает и в браузере (window.NumLib), и в Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NumLib = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DIGITS = '0123456789ABCDEF';
  var MIN_BASE = 2;
  var MAX_BASE = DIGITS.length;

  function assertBase(base) {
    if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) {
      throw new Error('Основание должно быть целым числом от ' + MIN_BASE + ' до ' + MAX_BASE + '.');
    }
    return base;
  }

  function digitVal(ch) { return DIGITS.indexOf(String(ch).toUpperCase()); }
  function digitChar(v) {
    if (!Number.isInteger(v) || v < 0 || v >= DIGITS.length) {
      throw new Error('Значение цифры должно быть целым числом от 0 до ' + (DIGITS.length - 1) + '.');
    }
    return DIGITS.charAt(v);
  }
  function fmt(n) { return Number(n).toLocaleString('ru-RU'); }

  function baseName(b) {
    var names = {
      2: 'двоичная', 3: 'троичная', 4: 'четверичная', 5: 'пятеричная',
      6: 'шестеричная', 7: 'семеричная', 8: 'восьмеричная', 9: 'девятеричная',
      10: 'десятичная', 11: 'одиннадцатеричная', 12: 'двенадцатеричная',
      13: 'тринадцатеричная', 14: 'четырнадцатеричная', 15: 'пятнадцатеричная',
      16: 'шестнадцатеричная'
    };
    return names[b] || ('основание ' + b);
  }

  function formatInBase(value, base) {
    assertBase(base);
    value = Number(value);
    if (!isFinite(value) || value < 0 || Math.floor(value) !== value) {
      throw new Error('Значение должно быть целым неотрицательным числом.');
    }
    if (!Number.isSafeInteger(value)) {
      throw new Error('Значение должно быть безопасным целым числом JavaScript.');
    }
    if (value === 0) return '0';
    var out = '';
    while (value > 0) {
      out = digitChar(value % base) + out;
      value = Math.floor(value / base);
    }
    return out;
  }

  function validateNumber(str, base) {
    assertBase(base);
    str = String(str == null ? '' : str);
    if (!str || !/^[0-9A-F]+$/i.test(str)) {
      throw new Error('Запись должна состоять из цифр 0–9 и A–F.');
    }
    for (var i = 0; i < str.length; i++) {
      if (digitVal(str.charAt(i)) >= base) {
        throw new Error('Цифра «' + str.charAt(i) + '» недопустима в основании ' + base + '.');
      }
    }
    return str;
  }

  function parseInBase(str, base) {
    str = validateNumber(str, base);
    var n = 0;
    for (var i = 0; i < str.length; i++) n = n * base + digitVal(str.charAt(i));
    if (!Number.isSafeInteger(n)) {
      throw new Error('Слишком большое число для точного перевода. Используйте parseInBaseBig.');
    }
    return n;
  }

  /* Точный разбор без потери точности за пределами Number.MAX_SAFE_INTEGER.
     Если BigInt недоступен, возвращается обычное число. */
  function parseInBaseBig(str, base) {
    str = validateNumber(str, base);
    if (typeof BigInt !== 'function') return parseInBase(str, base);
    var n = BigInt(0);
    var bigBase = BigInt(base);
    for (var i = 0; i < str.length; i++) {
      n = n * bigBase + BigInt(digitVal(str.charAt(i)));
    }
    return n;
  }

  function stripLeadingZeros(str) {
    return str.replace(/^0+(?=.)/, '');
  }

  /* Сравнивает две записи без преобразования в Number: -1, 0 или 1. */
  function compareInBase(a, b, base) {
    a = validateNumber(a, base);
    b = validateNumber(b, base);
    var A = stripLeadingZeros(String(a).toUpperCase());
    var B = stripLeadingZeros(String(b).toUpperCase());
    if (A.length !== B.length) return A.length < B.length ? -1 : 1;
    for (var i = 0; i < A.length; i++) {
      var da = digitVal(A.charAt(i));
      var db = digitVal(B.charAt(i));
      if (da !== db) return da < db ? -1 : 1;
    }
    return 0;
  }

  function computeAddition(a, b, base) {
    a = validateNumber(a, base);
    b = validateNumber(b, base);
    var A = a.split('').reverse().map(digitVal);
    var B = b.split('').reverse().map(digitVal);
    var n = Math.max(A.length, B.length);
    var carry = 0;
    var steps = [];
    var res = [];
    for (var i = 0; i < n; i++) {
      var x = i < A.length ? A[i] : 0;
      var y = i < B.length ? B[i] : 0;
      var total = x + y + carry;
      var d = total % base;
      var co = Math.floor(total / base);
      steps.push({ i: i, x: x, y: y, carryIn: carry, total: total, d: d, carryOut: co });
      res[i] = d;
      carry = co;
    }
    var extra = false;
    if (carry > 0) {
      res[n] = carry;
      steps.push({ i: n, x: null, y: null, carryIn: carry, total: carry, d: carry, carryOut: 0, extra: true });
      extra = true;
    }
    return {
      steps: steps,
      res: res,
      cols: extra ? n + 1 : n,
      result: res.slice().reverse().map(digitChar).join('').replace(/^0+(?=.)/, '')
    };
  }

  function computeSubtraction(a, b, base) {
    a = validateNumber(a, base);
    b = validateNumber(b, base);
    if (compareInBase(a, b, base) < 0) {
      throw new Error('Уменьшаемое должно быть не меньше вычитаемого.');
    }
    var A = a.split('').reverse().map(digitVal);
    var B = b.split('').reverse().map(digitVal);
    var n = A.length;
    var borrow = 0;
    var steps = [];
    var res = [];
    for (var i = 0; i < n; i++) {
      var x = A[i];
      var yRaw = i < B.length ? B[i] : 0;
      var y = yRaw + borrow;
      var d, bo;
      if (x >= y) { d = x - y; bo = 0; }
      else { d = x + base - y; bo = 1; }
      steps.push({ i: i, x: x, yRaw: yRaw, borrowIn: borrow, y: y, d: d, borrowOut: bo });
      res[i] = d;
      borrow = bo;
    }
    var sigMax = res.length - 1;
    while (sigMax > 0 && res[sigMax] === 0) sigMax--;
    return {
      steps: steps,
      res: res,
      cols: n,
      sigMax: sigMax,
      result: res.slice(0, sigMax + 1).reverse().map(digitChar).join('')
    };
  }

  function gcd(a, b) {
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  function parseDecimalFraction(str) {
    var s = String(str).trim().replace(',', '.');
    var m = /^0?\.(\d{1,9})$/.exec(s);
    if (!m) throw new Error('Введите дробь от 0 до 1, например 0,625.');
    var digits = m[1].replace(/0+$/, '');
    if (!digits) throw new Error('Дробная часть должна быть больше нуля.');
    var den = Math.pow(10, digits.length);
    var num = parseInt(digits, 10);
    var g = gcd(num, den);
    return { numerator: num / g, denominator: den / g };
  }

  function fractionToBase(numerator, denominator, base, maxSteps) {
    assertBase(base);
    if (!Number.isInteger(numerator) || numerator < 0 ||
        !Number.isInteger(denominator) || denominator <= 0) {
      throw new Error('Дробь должна быть задана целым неотрицательным числителем и целым положительным знаменателем.');
    }
    if (numerator >= denominator) {
      throw new Error('Дробь должна быть меньше 1: числитель меньше знаменателя.');
    }
    maxSteps = (Number.isInteger(maxSteps) && maxSteps > 0) ? Math.min(maxSteps, 100000) : 12;
    if (numerator === 0) {
      return { digits: '0', periodStart: -1, steps: [], terminated: true, complete: true };
    }
    var digits = [];
    var steps = [];
    var seen = {};
    var periodStart = -1;
    for (var i = 0; i < maxSteps; i++) {
      if (numerator === 0) break;
      if (seen[numerator] !== undefined) {
        periodStart = seen[numerator];
        break;
      }
      seen[numerator] = i;
      var beforeNum = numerator;
      var beforeDen = denominator;
      numerator *= base;
      var digit = Math.floor(numerator / denominator);
      var rem = numerator - digit * denominator;
      /* before/after оставлены для совместимости; точные целые поля
         позволяют интерфейсу показывать дроби без округления. */
      steps.push({
        before: beforeNum / beforeDen,
        digit: digit,
        after: rem / denominator,
        beforeNum: beforeNum,
        beforeDen: beforeDen,
        productNum: beforeNum * base,
        productDen: beforeDen,
        afterNum: rem,
        afterDen: denominator
      });
      digits.push(digitChar(digit));
      numerator = rem;
    }
    return {
      digits: digits.join(''),
      periodStart: periodStart,
      steps: steps,
      terminated: numerator === 0,
      complete: numerator === 0 || periodStart >= 0
    };
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function lab(v) {
    return v > 9 ? digitChar(v) + ' (' + v + ')' : escapeHtml(v);
  }

  function stepText(step, mode, base, cols, result) {
    if (step.extra) {
      return 'Остался перенос 1. Записываем его в новый старший разряд — получаем <b>' +
        escapeHtml(result) + '<sub>' + base + '</sub></b>.';
    }
    if (mode === 'add') {
      var s = 'Разряд ' + step.i + ': ' + lab(step.x) + ' + ' + lab(step.y);
      if (step.carryIn) s += ' + 1 перенос';
      s += ' = ' + step.total + '. ';
      if (step.carryOut) {
        s += step.total + ' ≥ ' + base + ', поэтому пишем ' +
          digitChar(step.total - base) + ' и переносим 1 в следующий разряд.';
      } else {
        s += step.total + ' &lt; ' + base + ' — пишем ' +
          digitChar(step.d) + ', переноса нет.';
      }
      return s;
    }

    var t = 'Разряд ' + step.i + ': ' + lab(step.x) + ' − ' + lab(step.yRaw);
    if (step.borrowIn) t += ' − 1 (заём)';
    t += '. ';
    if (step.borrowOut) {
      var sub = step.borrowIn ? '(' + lab(step.yRaw) + ' + 1)' : lab(step.yRaw);
      t += 'Не хватило: заняли ' + base + ' у старшего разряда, поэтому ' +
        lab(step.x) + ' + ' + base + ' − ' + sub + ' = ' +
        digitChar(step.d) + '. Пишем ' + digitChar(step.d) + '.';
    } else if (step.i === cols - 1 && step.d === 0) {
      t += String(result) === '0'
        ? 'Нового заёма нет — пишем 0. Получился ноль.'
        : 'Нового заёма нет — пишем 0. Это ведущий ноль, в ответ он не входит.';
    } else {
      t += 'Нового заёма нет — пишем ' + digitChar(step.d) + '.';
    }
    return t;
  }

  function finalText(mode, a, b, base, result) {
    var exact = typeof BigInt === 'function';
    var safeA = escapeHtml(a);
    var safeB = escapeHtml(b);
    var safeResult = escapeHtml(result);
    var da = exact ? parseInBaseBig(a, base) : parseInBase(a, base);
    var db = exact ? parseInBaseBig(b, base) : parseInBase(b, base);
    var B = '<sub>' + base + '</sub>';
    if (mode === 'add') {
      return 'Готово: <b>' + safeResult + B + '</b>. Проверка в десятичной: ' +
        da.toString() + ' + ' + db.toString() + ' = ' + (da + db).toString() + '.';
    }
    return 'Готово: <b>' + safeResult + B + '</b>. Проверка сложением: ' +
      safeResult + B + ' + ' + safeB + B + ' = ' + safeA + B +
      ' (' + (da - db).toString() + ' + ' + db.toString() + ' = ' + da.toString() + ').';
  }

  return {
    DIGITS: DIGITS,
    MIN_BASE: MIN_BASE,
    MAX_BASE: MAX_BASE,
    assertBase: assertBase,
    digitVal: digitVal,
    digitChar: digitChar,
    fmt: fmt,
    baseName: baseName,
    formatInBase: formatInBase,
    parseInBase: parseInBase,
    parseInBaseBig: parseInBaseBig,
    compareInBase: compareInBase,
    validateNumber: validateNumber,
    computeAddition: computeAddition,
    computeSubtraction: computeSubtraction,
    parseDecimalFraction: parseDecimalFraction,
    fractionToBase: fractionToBase,
    stepText: stepText,
    finalText: finalText
  };
});
