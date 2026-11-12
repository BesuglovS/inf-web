(function () {
  'use strict';

  var NL = window.NumLib;
  if (!NL) {
    if (window.console) console.error('NumLib не загружен: проверьте assets/numlib.js.');
    var loadMessage = 'Не удалось загрузить модуль расчётов. Обновите страницу.';
    var loadError = document.querySelector('#machineError');
    if (loadError) loadError.textContent = loadMessage;
    var fallback = document.querySelector('.js-fallback');
    if (fallback) fallback.textContent = loadMessage;
    return;
  }

  var digitVal = NL.digitVal;
  var digitChar = NL.digitChar;
  var fmt = NL.fmt;
  var baseName = NL.baseName;
  var formatInBase = NL.formatInBase;
  var parseInBase = NL.parseInBase;
  var computeAddition = NL.computeAddition;
  var computeSubtraction = NL.computeSubtraction;
  var appReady = true;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function gcd(a, b) {
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /* Точное отображение рационального числа: конечная десятичная дробь,
     смешанное число или обыкновенная дробь. Без округления float. */
  function formatRational(num, den) {
    if (!den || !isFinite(num) || !isFinite(den)) return '—';
    var g = gcd(num, den);
    num /= g;
    den /= g;
    var whole = Math.floor(num / den);
    var rem = num - whole * den;
    if (rem === 0) return String(whole);

    var d = den;
    var twos = 0;
    var fives = 0;
    while (d % 2 === 0) { d /= 2; twos++; }
    while (d % 5 === 0) { d /= 5; fives++; }

    if (d === 1) {
      var places = Math.max(twos, fives);
      var frac = '';
      var rest = rem;
      for (var i = 0; i < places && rest !== 0; i++) {
        rest *= 10;
        var digit = Math.floor(rest / den);
        frac += digit;
        rest -= digit * den;
      }
      frac = frac.replace(/0+$/, '');
      return whole + ',' + frac;
    }

    return (whole > 0 ? whole + ' ' : '') + rem + '/' + den;
  }

  function randomDigits(n, base) {
    var out = '';
    for (var i = 0; i < n; i++) {
      var v = Math.floor(Math.random() * base);
      if (i === 0 && v === 0) v = 1 + Math.floor(Math.random() * (base - 1));
      out += digitChar(v);
    }
    return out;
  }

  /* ---------- progress + nav ---------- */
  var progress = $('#progress');
  var ticking = false;
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (progress) progress.style.transform = 'scaleX(' + ratio + ')';
    ticking = false;
  }
  function requestProgress() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }
  }
  if (progress) {
    window.addEventListener('scroll', requestProgress, { passive: true });
    window.addEventListener('resize', requestProgress, { passive: true });
    updateProgress();
  }

  /* ---------- number machine ---------- */
  if ($('#numInput') && $('#heroEq')) {
    var machine = { value: 2026, base: 10 };
    var numInput = $('#numInput');
    var numField = $('#numField');
    var basePicker = $('#basePicker');
    var baseLabel = $('#baseName');
    var cellsEl = $('#cells');
    var sumEl = $('#machineSum');
    var valueEl = $('#machineValue');
    var errorEl = $('#machineError');
    var heroEq = $('#heroEq');
    var randomBtn = $('#machineRandom');
    var copyBtn = $('#machineCopy');
    var statusTimer = null;

    function maxDigitsForBase(base) {
      var n = Number.MAX_SAFE_INTEGER;
      var digits = 0;
      while (n > 0) {
        n = Math.floor(n / base);
        digits++;
      }
      return digits;
    }

    function syncInputLimit(str) {
      numInput.maxLength = Math.max(12, maxDigitsForBase(machine.base), String(str).length);
    }

    function renderBasePicker() {
      var html = '';
      for (var b = 2; b <= 16; b++) {
        html += '<button type="button" class="base-chip' + (b === machine.base ? ' is-active' : '') +
          '" data-base="' + b + '" aria-pressed="' + (b === machine.base) + '"' +
          ' aria-label="Основание ' + b + ' — ' + baseName(b) + '">' + b + '</button>';
      }
      basePicker.innerHTML = html;
    }

    function buildHeroEq() {
      var bases = [10, 2, 8, 16];
      heroEq.innerHTML = bases.map(function (b) {
        return '<button type="button" class="eq-row" data-base="' + b + '" aria-pressed="false">' +
          '<span class="eq-base">' + b + '</span>' +
          '<span class="eq-val"></span>' +
          '<span class="eq-name">' + baseName(b) + '</span>' +
          '</button>';
      }).join('');
    }

    function updateHeroEq() {
      $$('.eq-row', heroEq).forEach(function (btn) {
        var b = +btn.getAttribute('data-base');
        var on = b === machine.base;
        var val = formatInBase(machine.value, b);
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
        btn.setAttribute('aria-label', baseName(b) + ', основание ' + b + ': ' + val);
        var valEl = $('.eq-val', btn);
        if (valEl) valEl.textContent = val;
      });
    }

    function renderMachine() {
      var str = formatInBase(machine.value, machine.base);
      var digits = str.split('');
      var terms = [];
      var html = digits.map(function (d, i) {
        var pos = digits.length - 1 - i;
        var weight = Math.pow(machine.base, pos);
        var v = digitVal(d);
        terms.push('<span class="sum-term" data-term="' + i + '">' + v + ' × ' + fmt(weight) + '</span>');
        return '<div class="cell" data-term="' + i + '" title="' + d + ' = ' + v + ', вес ' + fmt(weight) + '">' +
          '<span class="cell-pow">' + machine.base + '<sup>' + pos + '</sup></span>' +
          '<span class="cell-digit' + (v > 9 ? ' is-letter' : '') + '">' + d + '</span>' +
          '</div>';
      }).join('');

      cellsEl.innerHTML = html;
      cellsEl.classList.toggle('is-dense', digits.length > 9);
      sumEl.innerHTML = '<span class="sum-caption">вклад разрядов</span>' + terms.join('<span class="plus">+</span>');
      valueEl.textContent = fmt(machine.value);
      baseLabel.textContent = baseName(machine.base);

      $$('.base-chip', basePicker).forEach(function (btn) {
        var on = +btn.getAttribute('data-base') === machine.base;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
      });

      updateHeroEq();
    }

    function showMachineStatus(msg, isError) {
      if (statusTimer) {
        window.clearTimeout(statusTimer);
        statusTimer = null;
      }
      errorEl.textContent = msg || '';
      numField.classList.toggle('has-error', !!isError);
      errorEl.classList.toggle('is-success', !!msg && !isError);
      if (isError) numInput.setAttribute('aria-invalid', 'true');
      else numInput.removeAttribute('aria-invalid');
    }

    function showMachineError(msg) {
      showMachineStatus(msg, true);
    }

    function clearMachineStatus() {
      showMachineStatus('', false);
    }

    function flashMachineStatus(msg) {
      showMachineStatus(msg, false);
      statusTimer = window.setTimeout(function () {
        if (errorEl.textContent === msg) showMachineStatus('', false);
      }, 2600);
    }

    function updateURLState() {
      if (!window.history || !window.history.replaceState) return;
      try {
        var params = new URLSearchParams(window.location.search);
        params.set('n', formatInBase(machine.value, machine.base));
        params.set('b', String(machine.base));
        window.history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash);
      } catch (e) {}
    }

    function applyURLState() {
      try {
        var params = new URLSearchParams(window.location.search);
        if (!params.has('n') && !params.has('b')) return false;
        var bRaw = params.get('b') || '';
        var b = parseInt(bRaw, 10);
        var n = String(params.get('n') || '').toUpperCase();
        if (!/^\d+$/.test(bRaw) || !Number.isInteger(b) || b < 2 || b > 16 || !n) return true;
        NL.validateNumber(n, b);
        var value = parseInBase(n, b);
        if (!Number.isSafeInteger(value)) return true;
        machine.base = b;
        machine.value = value;
        return true;
      } catch (e) {
        return true;
      }
    }

    function setMachineBase(base) {
      machine.base = base;
      clearMachineStatus();
      var str = formatInBase(machine.value, base);
      numInput.value = str;
      syncInputLimit(str);
      renderMachine();
      updateURLState();
    }

    function readMachineInput() {
      var str = numInput.value.toUpperCase().trim();
      if (str !== numInput.value) {
        var caret = numInput.selectionStart;
        numInput.value = str;
        if (typeof caret === 'number') {
          caret = Math.max(0, Math.min(caret, str.length));
          try { numInput.setSelectionRange(caret, caret); } catch (e) {}
        }
      }
      if (!str) {
        showMachineError('Введите хотя бы одну цифру.');
        return;
      }
      for (var i = 0; i < str.length; i++) {
        var v = digitVal(str.charAt(i));
        if (v < 0 || v >= machine.base) {
          showMachineError('Символ «' + str.charAt(i) + '» не является цифрой в основании ' + machine.base + '.');
          return;
        }
      }
      var value;
      try {
        value = parseInBase(str, machine.base);
      } catch (err) {
        showMachineError('Слишком большое число для точного перевода. Максимум — ' + fmt(Number.MAX_SAFE_INTEGER) + '.');
        return;
      }
      clearMachineStatus();
      machine.value = value;
      renderMachine();
      updateURLState();
    }

    basePicker.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-base]');
      if (btn) setMachineBase(+btn.getAttribute('data-base'));
    });
    heroEq.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-base]');
      if (btn) setMachineBase(+btn.getAttribute('data-base'));
    });
    numInput.addEventListener('input', readMachineInput);
    numInput.addEventListener('blur', function () {
      if (numField.classList.contains('has-error')) return;
      var str = formatInBase(machine.value, machine.base);
      numInput.value = str;
      syncInputLimit(str);
    });

    if (randomBtn) {
      randomBtn.addEventListener('click', function () {
        var max = Math.pow(machine.base, 4) - 1;
        machine.value = 1 + Math.floor(Math.random() * max);
        var str = formatInBase(machine.value, machine.base);
        numInput.value = str;
        syncInputLimit(str);
        clearMachineStatus();
        renderMachine();
        updateURLState();
        numInput.focus();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var base = machine.base;
        var value = machine.value;
        var text = formatInBase(value, base);
        var copiedState = base + ':' + value;
        var done = function () {
          if (machine.base + ':' + machine.value === copiedState) {
            numInput.value = text;
            syncInputLimit(text);
            clearMachineStatus();
          }
          flashMachineStatus('Скопировано: ' + text + ' (основание ' + base + ')');
        };
        var fallback = function () {
          var helper = document.createElement('textarea');
          helper.value = text;
          helper.setAttribute('readonly', '');
          helper.setAttribute('aria-hidden', 'true');
          helper.className = 'copy-helper';
          document.body.appendChild(helper);
          helper.focus();
          helper.select();
          var copied = false;
          try {
            copied = document.execCommand('copy');
          } catch (e) {
            copied = false;
          }
          document.body.removeChild(helper);
          copyBtn.focus();
          if (copied) done();
          else showMachineError('Не удалось скопировать. Выделите число и скопируйте вручную.');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            navigator.clipboard.writeText(text).then(done, fallback);
          } catch (e) {
            fallback();
          }
        } else {
          fallback();
        }
      });
    }

    cellsEl.addEventListener('mouseover', function (e) {
      var cell = e.target.closest('[data-term]');
      if (!cell) return;
      var term = sumEl.querySelector('[data-term="' + cell.getAttribute('data-term') + '"]');
      if (term) term.classList.add('is-hot');
    });
    cellsEl.addEventListener('mouseout', function (e) {
      var cell = e.target.closest('[data-term]');
      if (!cell) return;
      var term = sumEl.querySelector('[data-term="' + cell.getAttribute('data-term') + '"]');
      if (term) term.classList.remove('is-hot');
    });

    renderBasePicker();
    buildHeroEq();
    var hadURLState = applyURLState();
    var initial = formatInBase(machine.value, machine.base);
    numInput.value = initial;
    syncInputLimit(initial);
    renderMachine();
    if (hadURLState) updateURLState();
  }

  /* ---------- fraction converter ---------- */
  if ($('#fractionTool')) {
    var fracInput = $('#fracInput');
    var fracBase = $('#fracBase');
    var fracGo = $('#fracGo');
    var fracResult = $('#fracResult');

    function showFractionError(message) {
      fracResult.innerHTML = '';
      var p = document.createElement('p');
      p.className = 'fraction-error';
      p.textContent = message;
      fracResult.appendChild(p);
      fracInput.setAttribute('aria-invalid', 'true');
    }

    function renderFraction() {
      var base = +fracBase.value;
      try {
        var f = NL.parseDecimalFraction(fracInput.value);
        var res = NL.fractionToBase(f.numerator, f.denominator, base, 12);
        fracInput.removeAttribute('aria-invalid');

        var rows = res.steps.map(function (s, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' +
            formatRational(s.beforeNum, s.beforeDen) + ' · ' + base + ' = ' +
            formatRational(s.productNum, s.productDen) +
            '</td><td>' + NL.digitChar(s.digit) + '</td><td>' +
            formatRational(s.afterNum, s.afterDen) + '</td></tr>';
        }).join('');

        var answer = res.digits || '0';
        if (res.periodStart >= 0) {
          answer = res.digits.slice(0, res.periodStart) + '(' + res.digits.slice(res.periodStart) + ')';
        }

        var note;
        if (res.terminated) note = 'Дробь закончилась.';
        else if (res.periodStart >= 0) note = 'Дальше цифры периода повторяются.';
        else note = 'Показаны первые ' + res.steps.length + ' шагов; дробь не закончилась.';

        fracResult.innerHTML =
          '<table class="data-table"><caption>Шаги умножения</caption>' +
          '<thead><tr><th scope="col">Шаг</th><th scope="col">Умножение</th><th scope="col">Цифра</th><th scope="col">Остаток</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table>' +
          '<p class="frac-answer">Результат: <b>0,' + answer + '<sub>' + base + '</sub></b>. ' + note + '</p>';
      } catch (err) {
        showFractionError(err.message);
      }
    }

    fracGo.addEventListener('click', renderFraction);
    fracBase.addEventListener('change', renderFraction);
    fracInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderFraction();
      }
    });
    renderFraction();
  }

  /* ---------- multiplication / division quiz ---------- */
  if ($('#mulTrainer')) {
    var mulMode = $('#mulMode');
    var mulBase = $('#mulBase');
    var mulExpr = $('#mulExpr');
    var mulAnswer = $('#mulAnswer');
    var mulStatus = $('#mulStatus');
    var mulNew = $('#mulNew');
    var mulCheck = $('#mulCheck');
    var mulState = { answer: '', base: 16 };

    function setMulStatus(message, kind) {
      mulStatus.textContent = message || '';
      mulStatus.classList.toggle('is-ok', kind === 'ok');
      mulStatus.classList.toggle('is-bad', kind === 'bad');
      if (kind === 'bad') mulAnswer.setAttribute('aria-invalid', 'true');
      else mulAnswer.removeAttribute('aria-invalid');
    }

    function newMulExample(shouldFocus) {
      var base = +mulBase.value;
      var op = mulMode.value;
      if (op === 'mul') {
        var a = randomDigits(2 + Math.floor(Math.random() * 2), base);
        var b = randomDigits(1 + Math.floor(Math.random() * 2), base);
        var product = parseInBase(a, base) * parseInBase(b, base);
        mulState = { answer: formatInBase(product, base), base: base };
        mulExpr.innerHTML = a + '<sub>' + base + '</sub> · ' +
          b + '<sub>' + base + '</sub>';
      } else {
        var quotient = randomDigits(2 + Math.floor(Math.random() * 2), base);
        var divisor = randomDigits(1 + Math.floor(Math.random() * 2), base);
        var dividend = parseInBase(quotient, base) * parseInBase(divisor, base);
        mulState = { answer: quotient, base: base };
        mulExpr.innerHTML = formatInBase(dividend, base) + '<sub>' + base + '</sub> ÷ ' +
          divisor + '<sub>' + base + '</sub>';
      }
      mulAnswer.value = '';
      setMulStatus('', '');
      if (shouldFocus) mulAnswer.focus();
    }

    function checkMulAnswer() {
      var raw = mulAnswer.value.toUpperCase().trim();
      if (!raw) {
        setMulStatus('Введите ответ.', 'bad');
        return;
      }
      try {
        NL.validateNumber(raw, mulState.base);
      } catch (err) {
        setMulStatus(err.message, 'bad');
        return;
      }
      var value;
      try {
        value = parseInBase(raw, mulState.base);
      } catch (err) {
        setMulStatus('Слишком большое число для точной проверки.', 'bad');
        return;
      }
      var expected = parseInBase(mulState.answer, mulState.base);
      if (value === expected) {
        setMulStatus('Верно: ' + mulState.answer + ' (основание ' + mulState.base + ').', 'ok');
      } else {
        setMulStatus('Пока неверно. Проверьте переносы и сдвиг; правильный ответ: ' +
          mulState.answer + ' (основание ' + mulState.base + ').', 'bad');
      }
    }

    mulMode.addEventListener('change', function () { newMulExample(false); });
    mulBase.addEventListener('change', function () { newMulExample(false); });
    mulNew.addEventListener('click', function () { newMulExample(true); });
    mulCheck.addEventListener('click', checkMulAnswer);
    mulAnswer.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkMulAnswer();
      }
    });
    newMulExample(false);
  }

  /* ---------- column arithmetic ---------- */
  if ($('#calc')) {
    var PRESETS = {
      add: {
        2: ['1011', '1101'],
        3: ['102', '212'],
        5: ['234', '123'],
        8: ['745', '267'],
        10: ['47', '122'],
        12: ['A7', '39'],
        16: ['2F', '7A']
      },
      sub: {
        2: ['11000', '1011'],
        3: ['1021', '212'],
        5: ['412', '123'],
        8: ['1234', '267'],
        10: ['169', '122'],
        12: ['124', '39'],
        16: ['A9', '7A']
      }
    };
    var calc = {
      mode: 'add',
      base: 16,
      a: '2F',
      b: '7A',
      steps: [],
      res: [],
      cols: 0,
      sigMax: 0,
      result: '',
      completed: 0,
      error: ''
    };

    var calcBoard = $('#calcBoard');
    var calcExpr = $('#calcExpr');
    var calcProgress = $('#calcProgress');
    var calcNote = $('#calcNote');
    var calcNext = $('#calcNext');
    var calcAll = $('#calcAll');
    var calcReset = $('#calcReset');
    var calcNew = $('#calcNew');
    var calcBases = $('#calcBases');
    var calcTabs = $$('.calc-tab');

    function syncCalcControls(mode, base) {
      calcTabs.forEach(function (tab) {
        var on = tab.getAttribute('data-mode') === mode;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-pressed', String(on));
      });
      $$('.calc-base', calcBases).forEach(function (btn) {
        var on = +btn.getAttribute('data-base') === base;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
      });
    }

    function loadExample(mode, base, a, b) {
      var A = String(a).toUpperCase();
      var B = String(b).toUpperCase();
      var computed;
      try {
        computed = mode === 'add'
          ? computeAddition(A, B, base)
          : computeSubtraction(A, B, base);
      } catch (err) {
        calc.mode = mode;
        calc.base = base;
        calc.a = A;
        calc.b = B;
        calc.steps = [];
        calc.res = [];
        calc.cols = 0;
        calc.sigMax = 0;
        calc.result = '';
        calc.completed = 0;
        calc.error = err.message;
        syncCalcControls(mode, base);
        calcExpr.textContent = '';
        calcBoard.innerHTML = '';
        calcProgress.textContent = '';
        calcNote.textContent = err.message;
        calcNext.disabled = true;
        calcAll.disabled = true;
        calcReset.disabled = true;
        return;
      }

      calc.mode = mode;
      calc.base = base;
      calc.a = A;
      calc.b = B;
      calc.steps = computed.steps;
      calc.res = computed.res;
      calc.cols = computed.cols;
      calc.sigMax = computed.sigMax || 0;
      calc.result = computed.result;
      calc.completed = 0;
      calc.error = '';

      syncCalcControls(mode, base);
      calcExpr.innerHTML = calc.a + '<sub>' + base + '</sub> ' + (mode === 'add' ? '+' : '−') + ' ' + calc.b + '<sub>' + base + '</sub>';
      renderCalc();
    }

    function buildCalcTable() {
      var cols = calc.cols;
      var finished = calc.completed >= calc.steps.length;
      var activePos = finished ? -1 : (calc.completed === 0 ? 0 : calc.steps[calc.completed - 1].i);
      var isAdd = calc.mode === 'add';
      var html = '<table class="calc-table">';
      html += '<caption class="sr-only">' + (isAdd ? 'Сложение' : 'Вычитание') + ' чисел ' + calc.a + ' и ' + calc.b + ' в основании ' + calc.base + '</caption>';
      html += '<tbody>';

      /* carry / borrow marks */
      html += '<tr class="r-carry"><th scope="row"><span class="sr-only">' + (isAdd ? 'перенос' : 'заём') + '</span></th>';
      var finalExtra = isAdd && calc.steps.length > 0 && calc.steps[calc.steps.length - 1].extra;
      for (var c = 0; c < cols; c++) {
        var pos = cols - 1 - c;
        var mark = '';
        var fresh = false;
        var redundant = finalExtra && pos === cols - 1;
        if (pos > 0 && pos <= calc.completed && !redundant) {
          var prev = calc.steps[pos - 1];
          if (prev && (prev.carryOut === 1 || prev.borrowOut === 1)) {
            mark = '1';
            fresh = (pos - 1 === calc.completed - 1);
          }
        }
        html += '<td class="' + (pos === activePos ? 'is-active ' : '') + (fresh ? 'is-new' : '') + '">' + mark + '</td>';
      }
      html += '</tr>';

      function operandRow(str, sign, cls) {
        var digits = str.split('');
        var row = '<tr class="' + cls + '"><th scope="row">' + sign + '</th>';
        for (var ci = 0; ci < cols; ci++) {
          var p = cols - 1 - ci;
          var idx = digits.length - 1 - p;
          var ch = idx >= 0 ? digits[idx] : '';
          row += '<td class="' + (p === activePos ? 'is-active' : '') + '">' + ch + '</td>';
        }
        return row + '</tr>';
      }

      html += operandRow(calc.a, '', 'r-a');
      html += operandRow(calc.b, isAdd ? '+' : '−', 'r-b');

      html += '<tr class="r-res"><th scope="row">=</th>';
      for (var cr = 0; cr < cols; cr++) {
        var p2 = cols - 1 - cr;
        var done = p2 < calc.completed;
        var content = '';
        if (done) {
          if (isAdd || p2 <= calc.sigMax) content = digitChar(calc.res[p2] === undefined ? 0 : calc.res[p2]);
        }
        var isNew = done && p2 === calc.completed - 1;
        html += '<td class="' + (p2 === activePos ? 'is-active ' : '') + (isNew ? 'is-new ' : '') + (done && content === '' ? 'is-blank' : '') + '">' + (content === '' ? '&nbsp;' : content) + '</td>';
      }
      html += '</tr></tbody></table>';
      return html;
    }

    function renderCalc() {
      if (!calc.steps.length) {
        calcBoard.innerHTML = '';
        calcProgress.textContent = '';
        calcNote.textContent = calc.error || 'Для этого примера нет данных. Нажмите «другой пример».';
        calcNext.disabled = true;
        calcAll.disabled = true;
        calcReset.disabled = true;
        return;
      }
      calcBoard.innerHTML = buildCalcTable();
      calcProgress.textContent = 'Разобрано ' + calc.completed + ' из ' + calc.steps.length;
      if (calc.completed === 0) {
        calcNote.innerHTML = 'Начинаем с младшего разряда — крайнего справа. Нажмите «Следующий шаг».';
      } else if (calc.completed >= calc.steps.length) {
        var last = calc.steps[calc.steps.length - 1];
        calcNote.innerHTML = last.extra
          ? 'Остался перенос 1 — он становится новым старшим разрядом.<br><br>' + NL.finalText(calc.mode, calc.a, calc.b, calc.base, calc.result)
          : NL.stepText(last, calc.mode, calc.base, calc.cols, calc.result) + '<br><br>' + NL.finalText(calc.mode, calc.a, calc.b, calc.base, calc.result);
      } else {
        calcNote.innerHTML = NL.stepText(calc.steps[calc.completed - 1], calc.mode, calc.base, calc.cols, calc.result);
      }
      calcNext.disabled = calc.completed >= calc.steps.length;
      calcAll.disabled = calc.completed >= calc.steps.length;
      calcReset.disabled = calc.completed === 0;
    }

    calcTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var mode = tab.getAttribute('data-mode');
        var pair = PRESETS[mode][calc.base];
        loadExample(mode, calc.base, pair[0], pair[1]);
      });
    });

    calcBases.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-base]');
      if (!btn) return;
      var base = +btn.getAttribute('data-base');
      var pair = PRESETS[calc.mode][base];
      loadExample(calc.mode, base, pair[0], pair[1]);
    });

    calcNext.addEventListener('click', function () {
      if (calc.completed < calc.steps.length) {
        calc.completed++;
        renderCalc();
      }
    });
    calcAll.addEventListener('click', function () {
      calc.completed = calc.steps.length;
      renderCalc();
    });
    calcReset.addEventListener('click', function () {
      calc.completed = 0;
      renderCalc();
    });
    calcNew.addEventListener('click', function () {
      var a, b, guard = 0;
      do {
        a = randomDigits(3 + Math.floor(Math.random() * 2), calc.base);
        b = randomDigits(2 + Math.floor(Math.random() * 2), calc.base);
        guard++;
      } while (calc.mode === 'sub' && NL.compareInBase(b, a, calc.base) >= 0 && guard < 60);
      if (calc.mode === 'sub' && NL.compareInBase(b, a, calc.base) >= 0) {
        a = randomDigits(4, calc.base);
        b = randomDigits(2, calc.base);
      }
      loadExample(calc.mode, calc.base, a, b);
    });

    loadExample('add', 16, '2F', '7A');
  }

  /* ---------- trainer ---------- */
  if ($('#trainer')) {
    var trainerGrid = $('#trainerGrid');
    var trainerBaseSelect = $('#trainerBase');
    var trainerAllBtn = $('#trainerAll');
    var trainerResetBtn = $('#trainerReset');
    var trainerScoreEl = $('#trainerScore');
    var EX = window.Exercises;

    if (!EX) {
      var trainerFallback = document.querySelector('.js-fallback');
      if (trainerFallback) {
        trainerFallback.textContent = 'Не удалось загрузить модуль заданий. Обновите страницу.';
      }
      appReady = false;
    } else {
      var trainerSpecs = [
        { type: 'to-decimal', title: 'В десятичную', rule: 'Заполните вклад каждого разряда, затем сумму.' },
        { type: 'from-decimal', title: 'Из десятичной', rule: 'Заполните частные и остатки, затем соберите ответ снизу вверх.' },
        { type: 'add', title: 'Сложение столбиком', rule: 'Заполните переносы и цифры результата по разрядам.' },
        { type: 'sub', title: 'Вычитание столбиком', rule: 'Заполните заёмы и цифры результата по разрядам.' }
      ];
      var trainerCards = [];

      function fillTrainerBases() {
        var html = '<option value="random" selected>случайное 2–16</option>';
        for (var b = 2; b <= 16; b++) {
          html += '<option value="' + b + '">' + b + ' — ' + baseName(b) + '</option>';
        }
        trainerBaseSelect.innerHTML = html;
      }

      function trainerBasePreference() {
        var value = trainerBaseSelect.value;
        return value === 'random' ? undefined : Number(value);
      }

      function cellText(value) {
        return String(value == null ? '' : value).replace(/\s+/g, '').toUpperCase();
      }

      function decimalCellValue(value) {
        var text = cellText(value);
        if (!/^\d+$/.test(text)) return null;
        var number = Number(text);
        return Number.isSafeInteger(number) ? number : null;
      }

      function remainderCellValue(value, base) {
        var text = cellText(value);
        if (!text) return null;
        if (/^\d+$/.test(text)) {
          var number = Number(text);
          if (Number.isSafeInteger(number) && number >= 0 && number < base) return number;
        }
        try {
          return NL.parseInBase(text, base);
        } catch (err) {
          return null;
        }
      }

      function digitCellValue(value, base) {
        var text = cellText(value);
        if (text.length !== 1) return null;
        var digit = NL.digitVal(text);
        return digit >= 0 && digit < base ? digit : null;
      }

      function carryCellValue(value) {
        var text = cellText(value);
        if (!text) return 0;
        if (text === '0' || text === '1') return Number(text);
        return null;
      }

      function setCellState(input, ok) {
        if (!input) return;
        input.classList.toggle('is-correct', ok);
        input.classList.toggle('is-wrong', !ok);
        if (ok) input.removeAttribute('aria-invalid');
        else input.setAttribute('aria-invalid', 'true');
      }

      function setWorkDisabled(state, disabled) {
        $$('input', state.work).forEach(function (input) { input.disabled = disabled; });
      }

      function setTrainerStatus(state, message, kind) {
        state.status.textContent = message;
        state.status.classList.remove('is-ok', 'is-bad', 'is-answer');
        if (kind) state.status.classList.add(kind);
      }

      function updateTrainerStats() {
        var totalCorrect = 0;
        var totalAttempts = 0;
        trainerCards.forEach(function (state) {
          state.stats.textContent = 'Верно: ' + state.correct + ' · Попыток: ' + state.attempts;
          totalCorrect += state.correct;
          totalAttempts += state.attempts;
        });
        trainerScoreEl.textContent = 'Верно: ' + totalCorrect + ' · Попыток: ' + totalAttempts;
      }

      function renderToDecimalWork(exercise) {
        var rows = exercise.terms.map(function (term, index) {
          return '<tr>' +
            '<td class="trainer-term-digit"><span class="mono">' + term.digit + '</span></td>' +
            '<td class="trainer-term-op">×</td>' +
            '<td class="trainer-term-weight"><span class="mono">' + exercise.base + '<sup>' + term.position + '</sup></span></td>' +
            '<td class="trainer-term-op">=</td>' +
            '<td><input class="trainer-cell trainer-cell--number" data-cell="term" data-index="' + index + '" type="text" inputmode="numeric" maxlength="10" aria-label="Вклад разряда ' + term.position + '"></td>' +
          '</tr>';
        }).join('');

        return '<div class="trainer-work-block">' +
          '<p class="trainer-work-caption">Развёрнутая форма</p>' +
          '<div class="trainer-table-scroll">' +
            '<table class="trainer-work-table">' +
              '<caption class="sr-only">Разложение числа ' + exercise.digits + ' по разрядам</caption>' +
              '<thead><tr><th scope="col">Цифра</th><th scope="col"><span class="sr-only">Умножение</span></th><th scope="col">Вес</th><th scope="col"><span class="sr-only">Равно</span></th><th scope="col">Вклад</th></tr></thead>' +
              '<tbody>' + rows + '</tbody>' +
            '</table>' +
          '</div>' +
          '<label class="trainer-sum-row"><span>Сумма в десятичной</span><input class="trainer-cell trainer-cell--number" data-cell="sum" type="text" inputmode="numeric" maxlength="10" aria-label="Сумма в десятичной"></label>' +
        '</div>';
      }

      function renderFromDecimalWork(exercise) {
        var rows = exercise.divisions.map(function (step, index) {
          return '<div class="trainer-division-row">' +
            '<div class="trainer-division-expr"><span class="mono">' + step.dividend + ' ÷ ' + exercise.base + '</span><span class="trainer-division-eq">=</span></div>' +
            '<label class="trainer-division-field"><span>Частное</span><input class="trainer-cell trainer-cell--number" data-cell="quotient" data-index="' + index + '" type="text" inputmode="numeric" maxlength="16" placeholder="?" aria-label="Частное шага ' + (index + 1) + '"></label>' +
            '<label class="trainer-division-field"><span>Остаток</span><input class="trainer-cell trainer-cell--remainder" data-cell="remainder" data-index="' + index + '" type="text" inputmode="text" maxlength="2" placeholder="?" aria-label="Остаток шага ' + (index + 1) + '"></label>' +
          '</div>';
        }).join('');

        var answer = exercise.answerDigits.map(function (digit, index) {
          return '<label class="trainer-answer-digit">' +
            '<span class="sr-only">Цифра ответа ' + (index + 1) + '</span>' +
            '<input class="trainer-cell trainer-cell--digit" data-cell="answer-digit" data-index="' + index + '" type="text" inputmode="text" maxlength="1" placeholder="?" aria-label="Цифра ответа ' + (index + 1) + ', начиная со старшей">' +
          '</label>';
        }).join('');

        return '<div class="trainer-work-block">' +
          '<p class="trainer-work-caption">Деление с остатком</p>' +
          '<div class="trainer-division-list" aria-label="Деление числа ' + exercise.value + ' на ' + exercise.base + '">' + rows + '</div>' +
          '<p class="trainer-work-note">Остатки читайте снизу вверх — от последнего деления к первому.</p>' +
          '<div class="trainer-answer-row"><span class="trainer-answer-label">Ответ</span>' + answer + '</div>' +
        '</div>';
      }

      function renderColumnWork(exercise) {
        var isAdd = exercise.type === 'add';
        var cols = exercise.cols;
        var baseCols = exercise.baseCols;

        function digitAt(value, position) {
          var index = value.length - 1 - position;
          return index >= 0 ? value.charAt(index) : '';
        }

        var carryRow = '<tr class="trainer-carry-row"><th scope="row">' + (isAdd ? 'перенос' : 'заём') + '</th>';
        for (var p = cols - 1; p >= 0; p--) {
          var carryCell = '';
          if (p > 0 && p < baseCols) {
            carryCell = '<input class="trainer-cell trainer-cell--tiny" data-cell="' + (isAdd ? 'carry' : 'borrow') + '" data-pos="' + p + '" type="text" inputmode="numeric" maxlength="1" placeholder="0" aria-label="' + (isAdd ? 'Перенос в разряд ' : 'Заём из разряда ') + p + '">';
          }
          carryRow += '<td>' + carryCell + '</td>';
        }
        carryRow += '</tr>';

        var aRow = '<tr class="trainer-operand-a"><th scope="row"></th>';
        for (var pa = cols - 1; pa >= 0; pa--) aRow += '<td>' + digitAt(exercise.a, pa) + '</td>';
        aRow += '</tr>';

        var bRow = '<tr class="trainer-operand-b"><th scope="row">' + (isAdd ? '+' : '−') + '</th>';
        for (var pb = cols - 1; pb >= 0; pb--) bRow += '<td>' + digitAt(exercise.b, pb) + '</td>';
        bRow += '</tr>';

        var resultRow = '<tr class="trainer-result-row"><th scope="row">=</th>';
        for (var pr = cols - 1; pr >= 0; pr--) {
          resultRow += '<td><input class="trainer-cell trainer-cell--result" data-cell="result" data-pos="' + pr + '" type="text" inputmode="text" maxlength="1" placeholder="?" aria-label="Цифра результата, разряд ' + pr + '"></td>';
        }
        resultRow += '</tr>';

        return '<div class="trainer-work-block">' +
          '<p class="trainer-work-caption">' + (isAdd ? 'Сложение' : 'Вычитание') + ' столбиком</p>' +
          '<div class="trainer-table-scroll">' +
            '<table class="trainer-calc-table">' +
              '<caption class="sr-only">' + (isAdd ? 'Сложение' : 'Вычитание') + ' чисел ' + exercise.a + ' и ' + exercise.b + ' в основании ' + exercise.base + '</caption>' +
              '<tbody>' + carryRow + aRow + bRow + resultRow + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
      }

      function renderTrainerCard(state) {
        var exercise = state.exercise;
        if (!exercise) return;

        state.base.textContent = baseName(exercise.base) + ' · основание ' + exercise.base;

        if (exercise.type === 'to-decimal') state.work.innerHTML = renderToDecimalWork(exercise);
        else if (exercise.type === 'from-decimal') state.work.innerHTML = renderFromDecimalWork(exercise);
        else state.work.innerHTML = renderColumnWork(exercise);

        state.check.disabled = false;
        state.hint.disabled = false;
        state.hint.textContent = 'Подсказка';
        state.show.hidden = true;
        state.show.disabled = false;
        state.hints.innerHTML = '';
        setTrainerStatus(state, '', '');
        state.card.classList.remove('is-correct');

        state.card.setAttribute('data-type', exercise.type);
        state.card.setAttribute('data-base', String(exercise.base));
        state.card.setAttribute('data-a', exercise.a || '');
        state.card.setAttribute('data-b', exercise.b || '');
        state.card.setAttribute('data-value',
          exercise.type === 'to-decimal' ? exercise.digits :
            exercise.type === 'from-decimal' ? String(exercise.value) : '');
        state.card.setAttribute('data-cols', String(exercise.cols || 0));
        state.card.setAttribute('data-base-cols', String(exercise.baseCols || 0));
        state.card.setAttribute('data-sigmax', String(exercise.sigMax == null ? -1 : exercise.sigMax));

        state.hintIndex = 0;
        state.solved = false;
        state.answerShown = false;
        state.taskAttempts = 0;
        updateTrainerStats();
      }

      function newTrainerTask(state, shouldFocus) {
        try {
          state.exercise = EX.generate(state.spec.type, { base: trainerBasePreference() });
        } catch (err) {
          setTrainerStatus(state, err.message, 'is-bad');
          return;
        }
        renderTrainerCard(state);
        if (shouldFocus) {
          var first = state.work.querySelector('input');
          if (first) first.focus();
        }
      }

      function addTrainerHint(state) {
        if (state.solved || state.answerShown ||
            !state.exercise || state.hintIndex >= state.exercise.hints.length) return;
        var item = document.createElement('li');
        item.innerHTML = state.exercise.hints[state.hintIndex];
        state.hints.appendChild(item);
        state.hintIndex++;
        if (state.hintIndex >= state.exercise.hints.length) {
          state.hint.disabled = true;
          state.hint.textContent = 'Подсказок больше нет';
        } else {
          state.hint.textContent = 'Следующая подсказка';
        }
      }

      function fillTrainerAnswer(state) {
        var exercise = state.exercise;
        var work = state.work;

        function setValue(selector, value) {
          var input = work.querySelector(selector);
          if (input) input.value = String(value);
        }

        if (exercise.type === 'to-decimal') {
          exercise.terms.forEach(function (term, index) {
            setValue('[data-cell="term"][data-index="' + index + '"]', term.product);
          });
          setValue('[data-cell="sum"]', exercise.value);
        } else if (exercise.type === 'from-decimal') {
          exercise.divisions.forEach(function (step, index) {
            setValue('[data-cell="quotient"][data-index="' + index + '"]', step.quotient);
            setValue('[data-cell="remainder"][data-index="' + index + '"]', step.digit);
          });
          exercise.answerDigits.forEach(function (digit, index) {
            setValue('[data-cell="answer-digit"][data-index="' + index + '"]', digit);
          });
        } else {
          var isAdd = exercise.type === 'add';
          for (var p = 1; p < exercise.baseCols; p++) {
            var expected = isAdd ? exercise.steps[p - 1].carryOut : exercise.steps[p - 1].borrowOut;
            setValue('[data-cell="' + (isAdd ? 'carry' : 'borrow') + '"][data-pos="' + p + '"]', expected);
          }
          for (var pr = 0; pr < exercise.cols; pr++) {
            setValue('[data-cell="result"][data-pos="' + pr + '"]', NL.digitChar(exercise.res[pr]));
          }
        }
      }

      function showTrainerAnswer(state) {
        if (!state.exercise || state.answerShown) return;
        fillTrainerAnswer(state);
        state.answerShown = true;
        state.show.hidden = true;
        state.check.disabled = true;
        state.hint.disabled = true;
        setWorkDisabled(state, true);
        setTrainerStatus(state, 'Правильный ответ заполнен.', 'is-answer');
      }

      function checkToDecimal(state) {
        var exercise = state.exercise;
        var all = true;
        exercise.terms.forEach(function (term, index) {
          var input = state.work.querySelector('[data-cell="term"][data-index="' + index + '"]');
          var value = decimalCellValue(input.value);
          var ok = value === term.product;
          setCellState(input, ok);
          all = all && ok;
        });
        var sumInput = state.work.querySelector('[data-cell="sum"]');
        var sumValue = decimalCellValue(sumInput.value);
        var sumOk = sumValue === exercise.value;
        setCellState(sumInput, sumOk);
        all = all && sumOk;
        return {
          ok: all,
          message: all ? 'Верно. Сумма: ' + exercise.answer + '.' : 'Пока неверно. Проверьте вклады разрядов и сумму.'
        };
      }

      function checkFromDecimal(state) {
        var exercise = state.exercise;
        var all = true;
        exercise.divisions.forEach(function (step, index) {
          var quotientInput = state.work.querySelector('[data-cell="quotient"][data-index="' + index + '"]');
          var remainderInput = state.work.querySelector('[data-cell="remainder"][data-index="' + index + '"]');
          var quotientOk = decimalCellValue(quotientInput.value) === step.quotient;
          var remainderOk = remainderCellValue(remainderInput.value, exercise.base) === step.remainder;
          setCellState(quotientInput, quotientOk);
          setCellState(remainderInput, remainderOk);
          all = all && quotientOk && remainderOk;
        });
        exercise.answerDigits.forEach(function (digit, index) {
          var input = state.work.querySelector('[data-cell="answer-digit"][data-index="' + index + '"]');
          var ok = digitCellValue(input.value, exercise.base) === NL.digitVal(digit);
          setCellState(input, ok);
          all = all && ok;
        });
        return {
          ok: all,
          message: all ? 'Верно. Ответ: ' + exercise.answer + '.' : 'Пока неверно. Проверьте частные, остатки и порядок цифр.'
        };
      }

      function checkColumn(state) {
        var exercise = state.exercise;
        var isAdd = exercise.type === 'add';
        var all = true;

        for (var p = 1; p < exercise.baseCols; p++) {
          var input = state.work.querySelector('[data-cell="' + (isAdd ? 'carry' : 'borrow') + '"][data-pos="' + p + '"]');
          var expected = isAdd ? exercise.steps[p - 1].carryOut : exercise.steps[p - 1].borrowOut;
          var okCarry = carryCellValue(input.value) === expected;
          setCellState(input, okCarry);
          all = all && okCarry;
        }

        for (var pos = 0; pos < exercise.cols; pos++) {
          var resultInput = state.work.querySelector('[data-cell="result"][data-pos="' + pos + '"]');
          var expectedDigit = NL.digitChar(exercise.res[pos]);
          var value = digitCellValue(resultInput.value, exercise.base);
          var blank = cellText(resultInput.value) === '';
          var allowBlank = !isAdd && pos > exercise.sigMax && expectedDigit === '0';
          var okResult = (blank && allowBlank) || value === NL.digitVal(expectedDigit);
          setCellState(resultInput, okResult);
          all = all && okResult;
        }

        return {
          ok: all,
          message: all ? 'Верно. Результат: ' + exercise.answer + '.' : 'Пока неверно. Проверьте переносы, заёмы и цифры результата.'
        };
      }

      function checkTrainerAnswer(state) {
        if (!state.exercise || state.solved || state.answerShown) return;
        var result;
        if (state.exercise.type === 'to-decimal') result = checkToDecimal(state);
        else if (state.exercise.type === 'from-decimal') result = checkFromDecimal(state);
        else result = checkColumn(state);

        state.attempts++;
        state.taskAttempts++;

        if (result.ok) {
          state.correct++;
          state.solved = true;
          state.check.disabled = true;
          state.hint.disabled = true;
          state.show.hidden = true;
          setWorkDisabled(state, true);
          state.card.classList.add('is-correct');
          setTrainerStatus(state, result.message, 'is-ok');
        } else {
          setTrainerStatus(state, result.message, 'is-bad');
          if (state.taskAttempts >= 2) {
            state.show.hidden = false;
            state.show.disabled = false;
          }
        }
        updateTrainerStats();
      }

      function createTrainerCard(spec, index) {
        var card = document.createElement('section');
        card.className = 'trainer-card';
        card.id = 'trainer-card-' + index;
        card.setAttribute('aria-labelledby', 'trainer-title-' + index);
        card.innerHTML =
          '<div class="trainer-card-head">' +
            '<span class="trainer-num">' + ('0' + (index + 1)).slice(-2) + '</span>' +
            '<h2 id="trainer-title-' + index + '">' + spec.title + '</h2>' +
            '<span class="trainer-base" id="trainer-base-' + index + '"></span>' +
          '</div>' +
          '<p class="trainer-rule">' + spec.rule + '</p>' +
          '<div class="trainer-work" id="trainer-work-' + index + '"></div>' +
          '<div class="trainer-check-row">' +
            '<button class="btn btn--primary" type="button" id="trainer-check-' + index + '">Проверить</button>' +
          '</div>' +
          '<div class="trainer-actions">' +
            '<button class="btn" type="button" id="trainer-hint-' + index + '">Подсказка</button>' +
            '<button class="btn btn--quiet" type="button" id="trainer-show-' + index + '" hidden>Показать ответ</button>' +
            '<button class="btn btn--quiet" type="button" id="trainer-new-' + index + '">Новое задание</button>' +
          '</div>' +
          '<ol class="trainer-hints" id="trainer-hints-' + index + '" aria-live="polite"></ol>' +
          '<p class="trainer-status" id="trainer-status-' + index + '" role="status"></p>' +
          '<p class="trainer-stats" id="trainer-stats-' + index + '">Верно: 0 · Попыток: 0</p>';

        trainerGrid.appendChild(card);

        var state = {
          spec: spec,
          card: card,
          work: $('#trainer-work-' + index, card),
          base: $('#trainer-base-' + index, card),
          check: $('#trainer-check-' + index, card),
          hint: $('#trainer-hint-' + index, card),
          show: $('#trainer-show-' + index, card),
          hints: $('#trainer-hints-' + index, card),
          status: $('#trainer-status-' + index, card),
          stats: $('#trainer-stats-' + index, card),
          exercise: null,
          correct: 0,
          attempts: 0,
          taskAttempts: 0,
          hintIndex: 0,
          solved: false,
          answerShown: false
        };

        state.check.addEventListener('click', function () { checkTrainerAnswer(state); });
        state.work.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' && event.target && event.target.tagName === 'INPUT') {
            event.preventDefault();
            checkTrainerAnswer(state);
          }
        });
        state.work.addEventListener('input', function (event) {
          if (!event.target || event.target.tagName !== 'INPUT') return;
          event.target.classList.remove('is-correct', 'is-wrong');
          event.target.removeAttribute('aria-invalid');
        });
        state.hint.addEventListener('click', function () { addTrainerHint(state); });
        state.show.addEventListener('click', function () { showTrainerAnswer(state); });
        state.show.hidden = true;
        $('#trainer-new-' + index, card).addEventListener('click', function () {
          newTrainerTask(state, true);
        });

        return state;
      }

      function newAllTrainerTasks() {
        trainerCards.forEach(function (state) { newTrainerTask(state, false); });
      }

      fillTrainerBases();
      trainerSpecs.forEach(function (spec, index) {
        trainerCards.push(createTrainerCard(spec, index));
      });
      newAllTrainerTasks();
      updateTrainerStats();

      trainerBaseSelect.addEventListener('change', newAllTrainerTasks);
      trainerAllBtn.addEventListener('click', newAllTrainerTasks);
      trainerResetBtn.addEventListener('click', function () {
        trainerCards.forEach(function (state) {
          state.correct = 0;
          state.attempts = 0;
        });
        updateTrainerStats();
      });
    }
  }

  /* ---------- print ---------- */
  var printDetailsState = [];
  window.addEventListener('beforeprint', function () {
    var details = $$('details');
    printDetailsState = details.map(function (item) { return item.open; });
    details.forEach(function (item) { item.open = true; });
  });
  window.addEventListener('afterprint', function () {
    $$('details').forEach(function (item, i) {
      if (i < printDetailsState.length) item.open = printDetailsState[i];
    });
  });

  /* ---------- offline / PWA ---------- */
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        /* Офлайн-режим не критичен: сайт продолжает работать без него. */
      });
    });
  }

  if (appReady) document.documentElement.classList.add('is-enhanced');
})();
