// Калькуляторы для inf-web
import { escapeHTML, setResultText } from './utils.js';

const UNITS = { bit: 1, byte: 8, kb: 8 * 1024, mb: 8 * 1024 * 1024, gb: 8 * 1024 * 1024 * 1024 };
const UNIT_NAMES = { bit: 'бит', byte: 'байт', kb: 'Кбайт', mb: 'Мбайт', gb: 'Гбайт' };

// Конвертер единиц измерения информации
export function convertInfoUnits() {
    const value = parseFloat(document.getElementById('convert-value').value);
    const from = document.getElementById('convert-from').value;
    const to = document.getElementById('convert-to').value;
    const result = document.getElementById('convert-result');

    if (isNaN(value) || value < 0) {
        setResultText(result, 'Пожалуйста, введите положительное число.');
        return;
    }

    const bits = value * UNITS[from];
    const resultValue = bits / UNITS[to];

    setResultText(result, value + ' ' + UNIT_NAMES[from] + ' = ' + resultValue + ' ' + UNIT_NAMES[to]);
}

// Калькулятор информационного объёма текста
export function calcTextVolume() {
    const text = document.getElementById('text-input').value;
    const encoding = document.getElementById('encoding-select').value;
    const result = document.getElementById('text-volume-result');

    let bytes;
    if (encoding === 'utf8') {
        bytes = 0;
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code <= 0x7F) bytes += 1;
            else if (code <= 0x7FF) bytes += 2;
            else if (code <= 0xFFFF) bytes += 3;
            else bytes += 4;
        }
    } else {
        bytes = text.length * 2;
    }

    setResultText(result, 'Количество символов: ' + text.length + ' | Информационный объём: ' + bytes + ' байт (' + (bytes / 1024).toFixed(3) + ' Кбайт)');
}

// RGB Калькулятор (общая функция)
export function updateRGBGeneric(rId, gId, bId, previewId, infoId, showDepth) {
    const r = parseInt(document.getElementById(rId).value) || 0;
    const g = parseInt(document.getElementById(gId).value) || 0;
    const b = parseInt(document.getElementById(bId).value) || 0;
    const preview = document.getElementById(previewId);
    const info = document.getElementById(infoId);

    preview.style.backgroundColor = 'rgb(' + r + ', ' + g + ', ' + b + ')';
    const hex = '#' + [r, g, b].map(function(x) { return x.toString(16).padStart(2, '0'); }).join('');
    let text = 'RGB(' + r + ', ' + g + ', ' + b + ') | HEX: ' + hex.toUpperCase();
    if (showDepth) {
        text += ' | Глубина: 24 бит (8 бит на канал)';
    }
    info.textContent = text;
}

export function updateRGB() {
    updateRGBGeneric('rgb-r', 'rgb-g', 'rgb-b', 'rgb-preview', 'rgb-info', true);
}

export function updateRGB2() {
    updateRGBGeneric('rgb-r2', 'rgb-g2', 'rgb-b2', 'rgb-preview2', 'rgb-info2', false);
}

// Калькулятор объёма изображения
export function calcImageVolume() {
    const width = parseInt(document.getElementById('img-width').value);
    const height = parseInt(document.getElementById('img-height').value);
    const depth = parseInt(document.getElementById('img-depth').value);
    const result = document.getElementById('img-volume-result');

    if (!width || !height || !depth || width < 1 || height < 1) {
        setResultText(result, 'Пожалуйста, введите корректные положительные числа.');
        return;
    }

    const bits = width * height * depth;
    const bytes = bits / 8;
    const kb = bytes / 1024;
    const mb = kb / 1024;

    result.textContent = 'Размер: ' + width + '\u00D7' + height + ' пикселей, глубина: ' + depth + ' бит/пиксель';
    result.innerHTML += '<br>Объём: ' + bits + ' бит = ' + bytes + ' байт = ' + kb.toFixed(2) + ' Кбайт = ' + mb.toFixed(4) + ' Мбайт';
    result.className = 'result-box show';
}

// Калькулятор объёма звука
export function calcAudioVolume() {
    const freq = parseInt(document.getElementById('audio-freq').value);
    const depth = parseInt(document.getElementById('audio-depth').value);
    const channels = parseInt(document.getElementById('audio-channels').value);
    const seconds = parseInt(document.getElementById('audio-seconds').value);
    const result = document.getElementById('audio-volume-result');

    if (!freq || !depth || !channels || !seconds || seconds < 1) {
        setResultText(result, 'Пожалуйста, заполните все поля корректными значениями.');
        return;
    }

    const bitsPerSec = freq * depth * channels;
    const bytesPerSec = bitsPerSec / 8;
    const totalBytes = bytesPerSec * seconds;
    const kb = totalBytes / 1024;
    const mb = kb / 1024;

    result.textContent = 'Параметры: ' + freq + ' Гц, ' + depth + ' бит, ' + channels + ' канал(ов), ' + seconds + ' с';
    result.innerHTML += '<br>Объём: ' + totalBytes + ' байт = ' + kb.toFixed(2) + ' Кбайт = ' + mb.toFixed(2) + ' Мбайт';
    result.className = 'result-box show';
}

// Скорость передачи данных
export function calcSpeed() {
    const volume = parseFloat(document.getElementById('speed-volume').value);
    const unit = document.getElementById('speed-unit').value;
    const time = parseFloat(document.getElementById('speed-time').value);
    const result = document.getElementById('speed-result');

    if (isNaN(volume) || isNaN(time) || volume <= 0 || time <= 0) {
        setResultText(result, 'Введите положительные числа.');
        return;
    }

    const toBits = { bit: 1, byte: 8, kb: 8 * 1024, mb: 8 * 1024 * 1024 };
    const bits = volume * toBits[unit];
    const speedBps = bits / time;
    const speedKbps = speedBps / 1024;
    const speedMbps = speedKbps / 1024;

    result.innerHTML = 'Передано: ' + escapeHTML(String(volume)) + ' ' + UNIT_NAMES[unit] + ' за ' + escapeHTML(String(time)) + ' с';
    result.innerHTML += '<br>Скорость: ' + speedBps.toFixed(1) + ' бит/с = ' + speedKbps.toFixed(2) + ' Кбит/с = ' + speedMbps.toFixed(2) + ' Мбит/с';
    result.className = 'result-box show';
}

// Проверка пароля
export function checkPasswordStrength() {
    const password = document.getElementById('password-input').value;
    const result = document.getElementById('password-result');

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = ['Очень слабый', 'Слабый', 'Средний', 'Надёжный', 'Очень надёжный', 'Максимальный'];
    const colors = ['#e74c3c', '#e74c3c', '#f39c12', '#f39c12', '#27ae60', '#27ae60'];

    result.textContent = 'Надёжность пароля: ' + levels[strength];
    result.style.borderColor = colors[strength];
    result.style.color = colors[strength];
    result.className = 'result-box show';
}

// Расчёт объёма цифрового фото
export function calcPhotoVolume() {
    const mp = parseFloat(document.getElementById('photo-mp').value);
    const format = document.getElementById('photo-format').value;
    const result = document.getElementById('photo-volume-result');

    if (isNaN(mp) || mp <= 0) {
        setResultText(result, 'Введите корректное количество мегапикселей.');
        return;
    }

    const pixels = mp * 1000000;
    const rawBytes = pixels * 3;

    const compressionRatios = {
        bmp: 1.0,
        png: 0.5,
        'jpg-hi': 0.1,
        'jpg-med': 0.05,
        'jpg-low': 0.02
    };

    const ratio = compressionRatios[format] || 0.1;
    const compressedBytes = rawBytes * ratio;
    const compressedKB = compressedBytes / 1024;
    const compressedMB = compressedKB / 1024;
    const formatNames = {
        bmp: 'BMP (без сжатия)',
        png: 'PNG (без потерь)',
        'jpg-hi': 'JPEG (высокое качество)',
        'jpg-med': 'JPEG (среднее качество)',
        'jpg-low': 'JPEG (низкое качество)'
    };

    result.innerHTML = 'Разрешение: ' + escapeHTML(String(mp)) + ' Мп (\u2248' + (pixels / 1000000).toFixed(1) + ' млн пикселей)';
    result.innerHTML += '<br>Формат: ' + formatNames[format];
    result.innerHTML += '<br>Объём: ' + compressedBytes.toFixed(0) + ' байт = ' + compressedKB.toFixed(1) + ' Кбайт = ' + compressedMB.toFixed(2) + ' Мбайт';
    result.className = 'result-box show';
}

// Конвертер IP-адреса (IPv4)
export function convertIP() {
    const input = document.getElementById('ip-input').value.trim();
    const result = document.getElementById('ip-result');

    result.style.display = 'block';

    const octets = input.split('.');
    if (octets.length !== 4) {
        setResultText(result, 'Ошибка: IP-адрес должен содержать 4 октета, разделённых точками (например, 192.168.1.1).');
        return;
    }

    const nums = [];
    for (let i = 0; i < 4; i++) {
        const n = parseInt(octets[i], 10);
        if (isNaN(n) || n < 0 || n > 255 || octets[i] !== n.toString()) {
            setResultText(result, 'Ошибка: октет ' + (i + 1) + ' (' + escapeHTML(octets[i]) + ') — некорректное число. Каждый октет должен быть числом от 0 до 255.');
            return;
        }
        nums.push(n);
    }

    const binary = nums.map(function(n) { return n.toString(2).padStart(8, '0'); }).join('.');
    const hex = nums.map(function(n) { return n.toString(16).toUpperCase().padStart(2, '0'); }).join('.');
    const decimalInt = nums.reduce(function(acc, n) { return acc * 256 + n; }, 0);

    let addressClass = '';
    if (nums[0] >= 1 && nums[0] <= 126) addressClass = 'A (большие сети)';
    else if (nums[0] >= 128 && nums[0] <= 191) addressClass = 'B (средние сети)';
    else if (nums[0] >= 192 && nums[0] <= 223) addressClass = 'C (малые сети)';
    else if (nums[0] >= 224 && nums[0] <= 239) addressClass = 'D (многоадресная рассылка)';
    else if (nums[0] >= 240 && nums[0] <= 255) addressClass = 'E (резерв)';
    else addressClass = 'Специальный';

    let isPrivate = false;
    if (nums[0] === 10) isPrivate = true;
    else if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) isPrivate = true;
    else if (nums[0] === 192 && nums[1] === 168) isPrivate = true;
    else if (nums[0] === 127) isPrivate = true;

    let html = 'Введённый IP-адрес: ' + escapeHTML(input) + ' (IPv4)';
    html += '<br>Бинарный формат: ' + binary;
    html += '<br>Шестнадцатеричный формат: ' + hex;
    html += '<br>Десятичное целое: ' + decimalInt;
    html += '<br>Класс сети: ' + addressClass;
    if (isPrivate) html += '<br>Частный адрес: Да';
    if (input === '127.0.0.1') html += '<br>Особое: локальный (loopback) — ваш компьютер';
    setResultHTML(result, html);
}

// Проверяемость текста
export function checkReadability() {
    const text = document.getElementById('readability-text').value;
    const result = document.getElementById('readability-result');

    if (!text.trim()) {
        setResultText(result, 'Пожалуйста, введите текст для проверки.');
        return;
    }

    const words = text.trim().split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(function(s) { return s.trim().length > 0; }).length || 1;
    const vowels = text.match(/[аеёиоуыэюяaeiouy]/gi);
    const syllables = vowels ? vowels.length : 1;

    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    const flesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    const fleschRounded = Math.round(flesch * 100) / 100;

    let level;
    if (flesch >= 90) level = 'Очень лёгкий текст (начальная школа)';
    else if (flesch >= 80) level = 'Лёгкий текст (5-6 класс)';
    else if (flesch >= 70) level = 'Довольно лёгкий текст (7-8 класс)';
    else if (flesch >= 60) level = 'Средний текст (9-11 класс)';
    else if (flesch >= 50) level = 'Довольно сложный текст (студенты)';
    else if (flesch >= 30) level = 'Сложный текст (выпускники вузов)';
    else level = 'Очень сложный текст (специалисты)';

    result.innerHTML = 'Статистика: ' + words + ' слов, ' + sentences + ' предложений';
    result.innerHTML += '<br>Индекс удобочитаемости: ' + fleschRounded;
    result.innerHTML += '<br>Уровень сложности: ' + level;
    result.className = 'result-box show';
}

// Интерактивная демонстрация слайдов
const slideData = [
    '<h4>Слайд 1: Титульный слайд</h4><p style="font-size:0.9rem;">&laquo;Мультимедийные презентации&raquo;<br>Автор: Ученик 7 класса</p>',
    '<h4>Слайд 2: Содержание</h4><ul style="font-size:0.85rem; text-align:left;"><li>Введение</li><li>Основная часть</li><li>Примеры</li><li>Заключение</li></ul>',
    '<h4>Слайд 3: Основные данные</h4><p style="font-size:0.85rem;">Используйте таблицы, графики и схемы для наглядности.</p><div style="background:#eef; padding:8px; border-radius:6px; font-size:0.8rem;">График успеваемости</div>',
    '<h4>Слайд 4: Заключительный слайд</h4><p style="font-size:0.9rem;">Спасибо за внимание!<br>Вопросы?</p>'
];

let currentSlide = 0;

export function updateSlide() {
    const content = document.getElementById('slide-content');
    const counter = document.getElementById('slide-counter');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateX(20px)';
        setTimeout(function() {
            content.innerHTML = slideData[currentSlide];
            content.style.opacity = '1';
            content.style.transform = 'translateX(0)';
        }, 150);
    }
    if (counter) counter.textContent = (currentSlide + 1) + ' / ' + slideData.length;
}

export function nextSlide() {
    if (currentSlide < slideData.length - 1) {
        currentSlide++;
        updateSlide();
    }
}

export function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
    }
}