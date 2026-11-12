'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const nl = require('../assets/numlib.js');

test('formatInBase / parseInBase: круговой перевод во всех основаниях 2–16', () => {
  for (let base = 2; base <= 16; base++) {
    for (const value of [1, 2, 5, 9, 10, 15, 16, 47, 156, 1024, 99999]) {
      const text = nl.formatInBase(value, base);
      assert.equal(nl.parseInBase(text, base), value, `base ${base}, value ${value}`);
    }
  }
});

test('formatInBase: ноль и защита от некорректных значений', () => {
  assert.equal(nl.formatInBase(0, 2), '0');
  assert.throws(() => nl.formatInBase(-5, 10), /неотрицательным/);
  assert.throws(() => nl.formatInBase(1.5, 10), /неотрицательным/);
  assert.throws(() => nl.formatInBase(Infinity, 10), /неотрицательным/);
  assert.throws(() => nl.formatInBase(Number.MAX_SAFE_INTEGER + 1, 10), /безопасным/);
});

test('computeAddition: пресеты и перенос в новый разряд', () => {
  const presets = [
    [2, '1011', '1101', '11000'],
    [3, '102', '212', '1021'],
    [5, '234', '123', '412'],
    [8, '745', '267', '1234'],
    [10, '47', '122', '169'],
    [12, 'A7', '39', '124'],
    [16, '2F', '7A', 'A9']
  ];
  for (const [base, a, b, expected] of presets) {
    const res = nl.computeAddition(a, b, base);
    assert.equal(res.result, expected, `${a} + ${b} в основании ${base}`);
    assert.equal(nl.parseInBase(res.result, base), nl.parseInBase(a, base) + nl.parseInBase(b, base));
  }
  assert.equal(nl.computeAddition('000', '000', 10).result, '0');
  assert.equal(nl.computeAddition('001', '002', 10).result, '3');
});

test('computeSubtraction: пресеты и ведущие нули', () => {
  const presets = [
    [2, '11000', '1011', '1101'],
    [3, '1021', '212', '102'],
    [5, '412', '123', '234'],
    [8, '1234', '267', '745'],
    [10, '169', '122', '47'],
    [12, '124', '39', 'A7'],
    [16, 'A9', '7A', '2F']
  ];
  for (const [base, a, b, expected] of presets) {
    const res = nl.computeSubtraction(a, b, base);
    assert.equal(res.result, expected, `${a} − ${b} в основании ${base}`);
    assert.equal(nl.parseInBase(res.result, base), nl.parseInBase(a, base) - nl.parseInBase(b, base));
  }
  assert.equal(nl.computeSubtraction('1000', '1', 10).result, '999');
});

test('computeSubtraction: запрещает отрицательный результат и неверные цифры', () => {
  assert.throws(() => nl.computeSubtraction('10', '11', 2), /не меньше/);
  assert.throws(() => nl.computeAddition('2', '1', 2), /недопустима/);
  assert.throws(() => nl.computeAddition('', '1', 10), /цифр/);
});

test('stepText: для основания 16 печатает цифры, а не десятичные значения', () => {
  const add = nl.computeAddition('FF', '0F', 16);
  assert.match(nl.stepText(add.steps[0], 'add', 16, add.cols, add.result), /пишем E/);
  assert.doesNotMatch(nl.stepText(add.steps[0], 'add', 16, add.cols, add.result), /пишем 14/);

  const sub = nl.computeSubtraction('A9', '7A', 16);
  assert.match(nl.stepText(sub.steps[0], 'sub', 16, sub.cols, sub.result), /=\s*F\.\s*Пишем F/);
  assert.doesNotMatch(nl.stepText(sub.steps[0], 'sub', 16, sub.cols, sub.result), /=\s*15/);

  const add12 = nl.computeAddition('BB', '0B', 12);
  assert.equal(add12.result, '10A');
  assert.match(nl.stepText(add12.steps[0], 'add', 12, add12.cols, add12.result), /пишем A/);
});

test('computeSubtraction: для равных чисел не называет ноль ведущим нулём', () => {
  const zero = nl.computeSubtraction('5', '5', 10);
  assert.equal(zero.result, '0');
  const text = nl.stepText(zero.steps[zero.steps.length - 1], 'sub', 10, zero.cols, zero.result);
  assert.match(text, /Получился ноль/);
  assert.doesNotMatch(text, /ведущий ноль/);
});

test('parseDecimalFraction: сокращает дробь и отвергает крайние случаи', () => {
  assert.deepEqual(nl.parseDecimalFraction('0,625'), { numerator: 5, denominator: 8 });
  assert.deepEqual(nl.parseDecimalFraction('0.10'), { numerator: 1, denominator: 10 });
  assert.deepEqual(nl.parseDecimalFraction('0,0625'), { numerator: 1, denominator: 16 });
  assert.throws(() => nl.parseDecimalFraction('1,5'), /от 0 до 1/);
  assert.throws(() => nl.parseDecimalFraction('0,000'), /больше нуля/);
});

test('fractionToBase: конечные и периодические дроби', () => {
  const finite = nl.fractionToBase(5, 8, 2, 12);
  assert.equal(finite.digits, '101');
  assert.equal(finite.terminated, true);
  assert.equal(finite.periodStart, -1);

  const periodic = nl.fractionToBase(1, 10, 2, 12);
  assert.equal(periodic.periodStart, 1);
  assert.equal(periodic.digits.slice(0, 5), '00011');
  assert.equal(periodic.complete, true);

  const octal = nl.fractionToBase(5, 8, 8, 12);
  assert.equal(octal.digits, '5');
  assert.equal(octal.terminated, true);

  const zero = nl.fractionToBase(0, 5, 2, 12);
  assert.equal(zero.digits, '0');
  assert.equal(zero.terminated, true);
  assert.equal(zero.complete, true);

  assert.throws(() => nl.fractionToBase(5, 4, 2), /меньше 1/);
  assert.throws(() => nl.fractionToBase(1, 1, 2), /меньше 1/);
});

test('основание проверяется во всех публичных функциях', () => {
  for (const base of [1, 0, -2, 17, 2.5, '10', null]) {
    assert.throws(() => nl.formatInBase(10, base), /Основание/, `formatInBase ${base}`);
    assert.throws(() => nl.parseInBase('10', base), /Основание/, `parseInBase ${base}`);
    assert.throws(() => nl.validateNumber('10', base), /Основание/, `validateNumber ${base}`);
  }
  assert.throws(() => nl.computeAddition('1', '1', 17), /Основание/);
  assert.throws(() => nl.computeSubtraction('10', '1', 1), /Основание/);
  assert.throws(() => nl.fractionToBase(1, 2, 1), /Основание/);
});

test('digitChar отвергает значения вне алфавита', () => {
  assert.equal(nl.digitChar(10), 'A');
  assert.throws(() => nl.digitChar(-1), /цифры/);
  assert.throws(() => nl.digitChar(16), /цифры/);
  assert.throws(() => nl.digitChar(1.5), /цифры/);
});

test('parseInBase отвергает недопустимые цифры, пустую запись и переполнение', () => {
  assert.throws(() => nl.parseInBase('2', 2), /недопустима/);
  assert.throws(() => nl.parseInBase('', 10), /цифр/);
  assert.throws(() => nl.parseInBase('G', 16), /цифр/);
  assert.throws(() => nl.parseInBase('9007199254740992', 10), /Слишком большое/);
});

test('validateNumber принимает числовой ноль и возвращает строку', () => {
  assert.equal(nl.validateNumber(0, 10), '0');
  assert.equal(nl.parseInBase(0, 10), 0);
  assert.equal(nl.computeAddition(0, 1, 10).result, '1');
});

test('compareInBase сравнивает записи без преобразования в Number', () => {
  assert.equal(nl.compareInBase('2', '10', 10), -1);
  assert.equal(nl.compareInBase('10', '2', 10), 1);
  assert.equal(nl.compareInBase('0001', '1', 10), 0);
  assert.equal(nl.compareInBase('FF', '100', 16), -1);
  assert.equal(nl.compareInBase('9007199254740992', '9007199254740993', 10), -1);
  assert.equal(nl.compareInBase('9007199254740993', '9007199254740992', 10), 1);
});

test('computeSubtraction корректен за пределами Number.MAX_SAFE_INTEGER', () => {
  const big = nl.computeSubtraction('9007199254740993', '9007199254740992', 10);
  assert.equal(big.result, '1');
  assert.throws(
    () => nl.computeSubtraction('9007199254740992', '9007199254740993', 10),
    /не меньше/
  );
  assert.equal(nl.computeSubtraction('0001000', '1', 10).result, '999');
});

test('fractionToBase отдаёт точные числители и знаменатели шагов', () => {
  const res = nl.fractionToBase(1, 10, 2, 12);
  assert.deepEqual(
    {
      beforeNum: res.steps[0].beforeNum,
      beforeDen: res.steps[0].beforeDen,
      productNum: res.steps[0].productNum,
      productDen: res.steps[0].productDen,
      afterNum: res.steps[0].afterNum,
      afterDen: res.steps[0].afterDen
    },
    { beforeNum: 1, beforeDen: 10, productNum: 2, productDen: 10, afterNum: 2, afterDen: 10 }
  );
  assert.equal(res.steps[1].productNum, 4);
  assert.equal(res.steps[1].productDen, 10);
});

test('parseInBaseBig и finalText сохраняют точность больших чисел', () => {
  assert.equal(nl.parseInBaseBig('FFFFFFFFFFFF', 16), 281474976710655n);
  assert.equal(nl.parseInBaseBig('2F', 16), 47n);
  const text = nl.finalText('add', '9007199254740992', '1', 10, '9007199254740993');
  assert.match(text, /9007199254740993/);
  assert.doesNotMatch(text, /9007199254740992 \+ 1 = 9007199254740992/);
});
