// Конвертеры и инструменты для inf-web
import { escapeHTML, setResultText, setResultHTML } from './utils.js';

// Конвертер систем счисления
export function convertBase() {
    const numStr = document.getElementById('num-input').value.trim();
    const fromBase = parseInt(document.getElementById('base-from').value);
    const toBase = parseInt(document.getElementById('base-to').value);
    const result = document.getElementById('base-result');

    if (!numStr) {
        setResultText(result, 'Пожалуйста, введите число.');
        return;
    }

    try {
        const decimalValue = parseInt(numStr, fromBase);
        if (isNaN(decimalValue)) {
            setResultText(result, 'Ошибка: число не соответствует указанной системе счисления.');
            return;
        }

        const converted = decimalValue.toString(toBase).toUpperCase();
        const safeNum = escapeHTML(numStr);
        let html = '<strong>' + safeNum + '</strong><sub>' + fromBase + '</sub> = <strong>' + converted + '</strong><sub>' + toBase + '</sub>';
        html += '<br><br>Десятичное значение: <strong>' + decimalValue + '</strong>';
        html += '<br>Двоичное: <strong>' + decimalValue.toString(2) + '</strong>';
        html += '<br>Восьмеричное: <strong>' + decimalValue.toString(8) + '</strong>';
        html += '<br>Шестнадцатеричное: <strong>' + decimalValue.toString(16).toUpperCase() + '</strong>';
        setResultHTML(result, html);
    } catch(e) {
        setResultText(result, 'Ошибка при переводе. Проверьте введённые данные.');
    }
}

// Калькулятор логических выражений
export function calcLogic() {
    const a = parseInt(document.getElementById('logic-a').value);
    const b = parseInt(document.getElementById('logic-b').value);
    const op = document.getElementById('logic-op').value;
    const result = document.getElementById('logic-result');

    let res, opName;
    switch(op) {
        case 'and':
            res = a && b;
            opName = 'Конъюнкция (A \u2227 B)';
            break;
        case 'or':
            res = a || b;
            opName = 'Дизъюнкция (A \u2228 B)';
            break;
        case 'xor':
            res = (a || b) && !(a && b) ? 1 : 0;
            opName = 'Исключающее ИЛИ (A \u2295 B)';
            break;
        case 'imp':
            res = (a === 1 && b === 0) ? 0 : 1;
            opName = 'Импликация (A \u2192 B)';
            break;
        default:
            res = 0;
    }

    let html = '<strong>' + opName + '</strong><br><br>';
    html += 'A = ' + (a === 1 ? 'Истина (1)' : 'Ложь (0)') + '<br>';
    html += 'B = ' + (b === 1 ? 'Истина (1)' : 'Ложь (0)') + '<br><br>';
    html += 'Результат: <strong>' + (res === 1 ? 'Истина (1)' : 'Ложь (0)') + '</strong>';
    setResultHTML(result, html);
}

// Шифр Цезаря
export function caesarCipher() {
    const input = document.getElementById('cipher-input').value;
    const shift = parseInt(document.getElementById('cipher-shift').value) || 3;
    const result = document.getElementById('cipher-result');

    if (!input) {
        setResultText(result, 'Введите текст для шифрования.');
        return;
    }

    const alphabet = '\u0410\u0411\u0412\u0413\u0414\u0415\u0419\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F';
    let output = '';

    for (let ci = 0; ci < input.length; ci++) {
        const char = input[ci];
        const upperChar = char.toUpperCase();
        const idx = alphabet.indexOf(upperChar);
        if (idx === -1) {
            output += char;
        } else {
            const newIdx = (idx + shift) % alphabet.length;
            const newChar = alphabet[newIdx];
            output += char === upperChar ? newChar : newChar.toLowerCase();
        }
    }

    let html = '<strong>Исходный текст:</strong> ' + escapeHTML(input) + '<br>';
    html += '<strong>Ключ (сдвиг):</strong> ' + shift + '<br><br>';
    html += '<strong>Зашифрованный текст:</strong> <strong style="color:var(--primary);">' + escapeHTML(output) + '</strong>';
    setResultHTML(result, html);
}

// Симуляция адресации ячеек
export function simulateAddressing() {
    const formula = document.getElementById('formula-input').value.trim();
    const result = document.getElementById('addressing-result');

    if (!formula) {
        setResultText(result, 'Введите формулу (например: A1+B1).');
        return;
    }

    let shiftedFormula = formula.replace(/\b([A-Z]+)(\d+)\b/g, function(match, col, row) {
        const newRow = parseInt(row) + 1;
        return col + newRow;
    });

    let html = '<strong>Исходная формула:</strong> =' + escapeHTML(formula) + '<br><br>';
    html += '<strong>При копировании на ячейку ниже:</strong><br>';
    html += '=<code>' + escapeHTML(shiftedFormula) + '</code><br>';
    html += '<br><span class="text-light" style="font-size:0.85rem;">';
    html += 'Абсолютные адреса ($A$1) не изменяются при копировании.</span>';
    setResultHTML(result, html);
}

// Верхний индекс
export function superscript(n) {
    const sup = '\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079';
    return String(n).split('').map(function(d) { return sup[parseInt(d)]; }).join('');
}

// Конвертер двоичного в десятичное
export function binToDec() {
    const input = document.getElementById('bin-input').value.trim();
    const result = document.getElementById('bin-dec-result');

    if (!input || !/^[01]+$/.test(input)) {
        setResultText(result, 'Введите корректное двоичное число (только 0 и 1).');
        return;
    }

    const decimal = parseInt(input, 2);
    let html = '<strong>' + escapeHTML(input) + '</strong><sub>2</sub> = <strong>' + decimal + '</strong><sub>10</sub>';
    html += '<br><br>Разбор: ';
    const bits = input.split('');
    let parts = [];
    for (let i = 0; i < bits.length; i++) {
        const power = bits.length - 1 - i;
        if (bits[i] === '1') {
            parts.push('1\u00D72' + (power > 0 ? superscript(power) : ''));
        }
    }
    html += parts.join(' + ') + ' = ' + decimal;
    setResultHTML(result, html);
}

// Конвертер десятичного в двоичное
export function decToBin() {
    const input = document.getElementById('dec-input').value.trim();
    const result = document.getElementById('dec-bin-result');

    if (!input || isNaN(parseInt(input)) || parseInt(input) < 0) {
        setResultText(result, 'Введите корректное неотрицательное десятичное число.');
        return;
    }

    const decimal = parseInt(input);
    const binary = decimal.toString(2);
    const octal = decimal.toString(8);
    const hex = decimal.toString(16).toUpperCase();

    let html = '<strong>' + decimal + '</strong><sub>10</sub> = <strong>' + binary + '</strong><sub>2</sub>';
    html += '<br><br>Дополнительно:';
    html += '<br>Восьмеричное: <strong>' + octal + '</strong><sub>8</sub>';
    html += '<br>Шестнадцатеричное: <strong>' + hex + '</strong><sub>16</sub>';
    html += '<br>Количество бит: <strong>' + binary.length + '</strong>';
    setResultHTML(result, html);
}

// Калькулятор объёма видео
export function calcVideoVolume() {
    const width = parseInt(document.getElementById('vid-width').value);
    const height = parseInt(document.getElementById('vid-height').value);
    const depth = parseInt(document.getElementById('vid-depth').value);
    const fps = parseInt(document.getElementById('vid-fps').value);
    const duration = parseInt(document.getElementById('vid-duration').value);
    const result = document.getElementById('video-volume-result');

    if (!width || !height || !depth || !fps || !duration || duration < 1) {
        setResultText(result, 'Пожалуйста, заполните все поля.');
        return;
    }

    const bitsPerFrame = width * height * depth;
    const bitsTotal = bitsPerFrame * fps * duration;
    const bytesTotal = bitsTotal / 8;
    const mbTotal = bytesTotal / 1024 / 1024;
    const gbTotal = mbTotal / 1024;

    result.innerHTML = 'Размер: ' + width + '\u00D7' + height + ', ' + fps + ' кадров/с, ' + duration + ' с';
    result.innerHTML += '<br>Объём: ' + bytesTotal.toFixed(0) + ' байт = ' + mbTotal.toFixed(2) + ' Мбайт = ' + gbTotal.toFixed(2) + ' Гбайт';
    result.className = 'result-box show';
}