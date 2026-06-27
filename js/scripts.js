// ===== Конвертер единиц измерения информации =====
function convertInfoUnits() {
    const value = parseFloat(document.getElementById('convert-value').value);
    const from = document.getElementById('convert-from').value;
    const to = document.getElementById('convert-to').value;
    const result = document.getElementById('convert-result');

    if (isNaN(value) || value < 0) {
        result.textContent = 'Пожалуйста, введите положительное число.';
        result.className = 'result-box show';
        return;
    }

    // Все в биты
    const units = { bit: 1, byte: 8, kb: 8 * 1024, mb: 8 * 1024 * 1024, gb: 8 * 1024 * 1024 * 1024 };
    const bits = value * units[from];
    const resultValue = bits / units[to];

    const unitNames = { bit: 'бит', byte: 'байт', kb: 'Кбайт', mb: 'Мбайт', gb: 'Гбайт' };
    result.textContent = `${value} ${unitNames[from]} = ${resultValue} ${unitNames[to]}`;
    result.className = 'result-box show';
}

// ===== Калькулятор информационного объёма текста =====
function calcTextVolume() {
    const text = document.getElementById('text-input').value;
    const encoding = document.getElementById('encoding-select').value;
    const result = document.getElementById('text-volume-result');

    const bytesPerChar = encoding === 'utf8' ? 1 : 2;
    const bytes = text.length * bytesPerChar;

    result.textContent = `Количество символов: ${text.length} | Информационный объём: ${bytes} байт (${(bytes / 1024).toFixed(3)} Кбайт)`;
    result.className = 'result-box show';
}

// ===== RGB Калькулятор =====
function updateRGB() {
    const r = parseInt(document.getElementById('rgb-r').value) || 0;
    const g = parseInt(document.getElementById('rgb-g').value) || 0;
    const b = parseInt(document.getElementById('rgb-b').value) || 0;
    const preview = document.getElementById('rgb-preview');
    const info = document.getElementById('rgb-info');

    preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    const depth = 24; // 8 бит на канал
    info.textContent = `RGB(${r}, ${g}, ${b}) | HEX: ${hex.toUpperCase()} | Глубина: ${depth} бит (8 бит на канал)`;
}

// ===== Калькулятор объёма изображения =====
function calcImageVolume() {
    const width = parseInt(document.getElementById('img-width').value);
    const height = parseInt(document.getElementById('img-height').value);
    const depth = parseInt(document.getElementById('img-depth').value);
    const result = document.getElementById('img-volume-result');

    if (!width || !height || !depth || width < 1 || height < 1) {
        result.textContent = 'Пожалуйста, введите корректные положительные числа.';
        result.className = 'result-box show';
        return;
    }

    const bits = width * height * depth;
    const bytes = bits / 8;
    const kb = bytes / 1024;
    const mb = kb / 1024;

    result.textContent = `Размер: ${width}×${height} пикселей, глубина: ${depth} бит/пиксель`;
    result.innerHTML += `<br>Объём: ${bits} бит = ${bytes} байт = ${kb.toFixed(2)} Кбайт = ${mb.toFixed(4)} Мбайт`;
    result.className = 'result-box show';
}

// ===== Калькулятор объёма звука =====
function calcAudioVolume() {
    const freq = parseInt(document.getElementById('audio-freq').value);
    const depth = parseInt(document.getElementById('audio-depth').value);
    const channels = parseInt(document.getElementById('audio-channels').value);
    const seconds = parseInt(document.getElementById('audio-seconds').value);
    const result = document.getElementById('audio-volume-result');

    if (!freq || !depth || !channels || !seconds || seconds < 1) {
        result.textContent = 'Пожалуйста, заполните все поля корректными значениями.';
        result.className = 'result-box show';
        return;
    }

    const bitsPerSec = freq * depth * channels;
    const bytesPerSec = bitsPerSec / 8;
    const totalBytes = bytesPerSec * seconds;
    const kb = totalBytes / 1024;
    const mb = kb / 1024;

    result.textContent = `Параметры: ${freq} Гц, ${depth} бит, ${channels} канал(ов), ${seconds} с`;
    result.innerHTML += `<br>Объём: ${totalBytes} байт = ${kb.toFixed(2)} Кбайт = ${mb.toFixed(2)} Мбайт`;
    result.className = 'result-box show';
}

// ===== Скорость передачи данных =====
function calcSpeed() {
    const volume = parseFloat(document.getElementById('speed-volume').value);
    const unit = document.getElementById('speed-unit').value;
    const time = parseFloat(document.getElementById('speed-time').value);
    const result = document.getElementById('speed-result');

    if (isNaN(volume) || isNaN(time) || volume <= 0 || time <= 0) {
        result.textContent = 'Введите положительные числа.';
        result.className = 'result-box show';
        return;
    }

    const unitNames = { bit: 'бит', byte: 'байт', kb: 'Кбайт', mb: 'Мбайт' };
    const toBits = { bit: 1, byte: 8, kb: 8 * 1024, mb: 8 * 1024 * 1024 };
    const bits = volume * toBits[unit];
    const speedBps = bits / time;
    const speedKbps = speedBps / 1024;
    const speedMbps = speedKbps / 1024;

    result.innerHTML = `Передано: ${volume} ${unitNames[unit]} за ${time} с`;
    result.innerHTML += `<br>Скорость: ${speedBps.toFixed(1)} бит/с = ${speedKbps.toFixed(2)} Кбит/с = ${speedMbps.toFixed(2)} Мбит/с`;
    result.className = 'result-box show';
}

// ===== Проверка знаний (тест) =====
function checkQuiz(formId, answers) {
    const form = document.getElementById(formId);
    if (!form) return;
    const formData = new FormData(form);
    let score = 0;
    const total = Object.keys(answers).length;
    const result = form.querySelector('.quiz-result');

    for (const [q, correct] of Object.entries(answers)) {
        const selected = formData.get(q);
        if (selected === correct) score++;
    }

    result.innerHTML = `Вы ответили правильно на ${score} из ${total} вопросов.`;
    if (score === total) {
        result.style.color = 'var(--success)';
        result.innerHTML += ' 🎉 Отлично!';
    } else if (score >= total / 2) {
        result.style.color = 'var(--accent)';
        result.innerHTML += ' Хорошо, но есть над чем поработать.';
    } else {
        result.style.color = 'var(--warning)';
        result.innerHTML += ' Рекомендуется повторить материал.';
    }
    result.className = 'result-box show';
}

// ===== Проверка пароля (информационная безопасность) =====
function checkPasswordStrength() {
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

    result.textContent = `Надёжность пароля: ${levels[strength]}`;
    result.style.borderColor = colors[strength];
    result.style.color = colors[strength];
    result.className = 'result-box show';
}

// ===== Вторая RGB-палитра (для темы 3.2) =====
function updateRGB2() {
    const r = parseInt(document.getElementById('rgb-r2').value) || 0;
    const g = parseInt(document.getElementById('rgb-g2').value) || 0;
    const b = parseInt(document.getElementById('rgb-b2').value) || 0;
    const preview = document.getElementById('rgb-preview2');
    const info = document.getElementById('rgb-info2');

    preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    info.textContent = `RGB(${r}, ${g}, ${b}) | HEX: ${hex.toUpperCase()}`;
}

// ===== Расчёт объёма цифрового фото =====
function calcPhotoVolume() {
    const mp = parseFloat(document.getElementById('photo-mp').value);
    const format = document.getElementById('photo-format').value;
    const result = document.getElementById('photo-volume-result');

    if (isNaN(mp) || mp <= 0) {
        result.textContent = 'Введите корректное количество мегапикселей.';
        result.className = 'result-box show';
        return;
    }

    const pixels = mp * 1000000;
    const rawBytes = pixels * 3; // 24 бита = 3 байта на пиксель

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

    result.innerHTML = `Разрешение: ${mp} Мп (≈${(pixels / 1000000).toFixed(1)} млн пикселей)`;
    result.innerHTML += `<br>Формат: ${formatNames[format]}`;
    result.innerHTML += `<br>Объём: ${compressedBytes.toFixed(0)} байт = ${compressedKB.toFixed(1)} Кбайт = ${compressedMB.toFixed(2)} Мбайт`;
    result.className = 'result-box show';
}

// ===== Проверка читаемости текста (индекс Флеша-Кинкейда) =====
function checkReadability() {
    const text = document.getElementById('readability-text').value;
    const result = document.getElementById('readability-result');

    if (!text.trim()) {
        result.textContent = 'Пожалуйста, введите текст для проверки.';
        result.className = 'result-box show';
        return;
    }

    // Подсчёт слов
    const words = text.trim().split(/\s+/).length;
    // Подсчёт предложений (по . ! ?)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
    // Подсчёт слогов (упрощённо — по гласным буквам)
    const vowels = text.match(/[аеёиоуыэюяaeiouy]/gi);
    const syllables = vowels ? vowels.length : 1;

    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    // Индекс Флеша-Кинкейда (адаптированный для русского)
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

    result.innerHTML = `📊 Статистика: ${words} слов, ${sentences} предложений`;
    result.innerHTML += `<br>📖 Индекс удобочитаемости: ${fleschRounded}`;
    result.innerHTML += `<br>📚 Уровень сложности: ${level}`;
    result.className = 'result-box show';
}

// ===== Интерактивная демонстрация слайдов =====
const slideData = [
    '<h4>✅ Слайд 1: Титульный слайд</h4><p style="font-size:0.9rem;">«Мультимедийные презентации»<br>Автор: Ученик 7 класса</p>',
    '<h4>📋 Слайд 2: Содержание</h4><ul style="font-size:0.85rem; text-align:left;"><li>Введение</li><li>Основная часть</li><li>Примеры</li><li>Заключение</li></ul>',
    '<h4>📊 Слайд 3: Основные данные</h4><p style="font-size:0.85rem;">Используйте таблицы, графики и схемы для наглядности.</p><div style="background:#eef; padding:8px; border-radius:6px; font-size:0.8rem;">📈 График успеваемости</div>',
    '<h4>🎯 Слайд 4: Заключительный слайд</h4><p style="font-size:0.9rem;">Спасибо за внимание!<br>Вопросы?</p>'
];

let currentSlide = 0;

function updateSlide() {
    const content = document.getElementById('slide-content');
    const counter = document.getElementById('slide-counter');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateX(20px)';
        setTimeout(() => {
            content.innerHTML = slideData[currentSlide];
            content.style.opacity = '1';
            content.style.transform = 'translateX(0)';
        }, 150);
    }
    if (counter) counter.textContent = `${currentSlide + 1} / ${slideData.length}`;
}

function nextSlide() {
    if (currentSlide < slideData.length - 1) {
        currentSlide++;
        updateSlide();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
    }
}

// ===== Конвертер IP-адреса (IPv4) =====
function convertIP() {
    const input = document.getElementById('ip-input').value.trim();
    const result = document.getElementById('ip-result');

    result.style.display = 'block';

    // Проверка формата: 4 октета через точку
    const octets = input.split('.');
    if (octets.length !== 4) {
        result.textContent = '❌ Ошибка: IP-адрес должен содержать 4 октета, разделённых точками (например, 192.168.1.1).';
        return;
    }

    const nums = [];
    for (let i = 0; i < 4; i++) {
        const n = parseInt(octets[i], 10);
        if (isNaN(n) || n < 0 || n > 255 || octets[i] !== n.toString()) {
            result.textContent = `❌ Ошибка: октет ${i + 1} («${octets[i]}») — некорректное число. Каждый октет должен быть числом от 0 до 255.`;
            return;
        }
        nums.push(n);
    }

    // Двоичное представление
    const binary = nums.map(n => n.toString(2).padStart(8, '0')).join('.');

    // Шестнадцатеричное представление
    const hex = nums.map(n => n.toString(16).toUpperCase().padStart(2, '0')).join('.');

    // Целочисленное представление (32-битное число)
    const decimalInt = nums.reduce((acc, n) => acc * 256 + n, 0);

    // Класс адреса (A, B, C, D, E)
    let addressClass = '';
    if (nums[0] >= 1 && nums[0] <= 126) addressClass = 'A (большие сети)';
    else if (nums[0] >= 128 && nums[0] <= 191) addressClass = 'B (средние сети)';
    else if (nums[0] >= 192 && nums[0] <= 223) addressClass = 'C (малые сети)';
    else if (nums[0] >= 224 && nums[0] <= 239) addressClass = 'D (многоадресная рассылка)';
    else if (nums[0] >= 240 && nums[0] <= 255) addressClass = 'E (резерв)';
    else addressClass = 'Специальный';

    // Определение частного адреса
    let isPrivate = false;
    if (nums[0] === 10) isPrivate = true;
    else if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) isPrivate = true;
    else if (nums[0] === 192 && nums[1] === 168) isPrivate = true;
    else if (nums[0] === 127) isPrivate = true;

    result.innerHTML = `✅ Введённый IP-адрес: <strong>${input}</strong> (IPv4)`;
    result.innerHTML += `<br><br>📊 <strong>Формы представления:</strong>`;

    result.innerHTML += `<br><span style="color:var(--text-light);">Десятично-точечная:</span> <strong>${input}</strong>`;
    result.innerHTML += `<br><span style="color:var(--text-light);">Двоичная:</span> <strong>${binary}</strong>`;
    result.innerHTML += `<br><span style="color:var(--text-light);">Шестнадцатеричная:</span> <strong>${hex}</strong>`;
    result.innerHTML += `<br><span style="color:var(--text-light);">Целочисленная:</span> <strong>${decimalInt}</strong>`;

    result.innerHTML += `<br><br>🏷️ <strong>Информация:</strong>`;
    result.innerHTML += `<br>Класс: ${addressClass}`;
    result.innerHTML += `<br>Тип: ${isPrivate ? '🔒 Частный (внутренний)' : '🌐 Публичный (глобальный)'}`;
    result.innerHTML += `<br>Разрядность: 32 бита (4 октета × 8 бит)`;
}

// ===== Конвертер систем счисления =====
function convertBase() {
    const numStr = document.getElementById('num-input').value.trim();
    const fromBase = parseInt(document.getElementById('base-from').value);
    const toBase = parseInt(document.getElementById('base-to').value);
    const result = document.getElementById('base-result');

    if (!numStr) {
        result.textContent = 'Пожалуйста, введите число.';
        result.className = 'result-box show';
        return;
    }

    try {
        const decimalValue = parseInt(numStr, fromBase);
        if (isNaN(decimalValue)) {
            result.textContent = 'Ошибка: число не соответствует указанной системе счисления.';
            result.className = 'result-box show';
            return;
        }

        const converted = decimalValue.toString(toBase).toUpperCase();
        result.innerHTML = `<strong>${numStr}</strong><sub>${fromBase}</sub> = <strong>${converted}</strong><sub>${toBase}</sub>`;
        result.innerHTML += `<br><br>📊 Десятичное значение: <strong>${decimalValue}</strong>`;
        result.innerHTML += `<br>🔢 Двоичное: <strong>${decimalValue.toString(2)}</strong>`;
        result.innerHTML += `<br>🔢 Восьмеричное: <strong>${decimalValue.toString(8)}</strong>`;
        result.innerHTML += `<br>🔢 Шестнадцатеричное: <strong>${decimalValue.toString(16).toUpperCase()}</strong>`;
        result.className = 'result-box show';
    } catch(e) {
        result.textContent = 'Ошибка при переводе. Проверьте введённые данные.';
        result.className = 'result-box show';
    }
}

// ===== Калькулятор логических выражений =====
function calcLogic() {
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

    result.innerHTML = `<strong>${opName}</strong><br><br>`;
    result.innerHTML += `A = ${a === 1 ? 'Истина (1)' : 'Ложь (0)'}<br>`;
    result.innerHTML += `B = ${b === 1 ? 'Истина (1)' : 'Ложь (0)'}<br><br>`;
    result.innerHTML += `Результат: <strong>${res === 1 ? 'Истина (1)' : 'Ложь (0)'}</strong>`;
    result.className = 'result-box show';
}

// ===== Шифр Цезаря =====
function caesarCipher() {
    const input = document.getElementById('cipher-input').value;
    const shift = parseInt(document.getElementById('cipher-shift').value) || 3;
    const result = document.getElementById('cipher-result');

    if (!input) {
        result.textContent = 'Введите текст для шифрования.';
        result.className = 'result-box show';
        return;
    }

    const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    let output = '';

    for (let char of input) {
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

    result.innerHTML = `🔐 <strong>Исходный текст:</strong> ${input}<br>`;
    result.innerHTML += `🔑 <strong>Ключ (сдвиг):</strong> ${shift}<br><br>`;
    result.innerHTML += `📨 <strong>Зашифрованный текст:</strong> <strong style="color:var(--primary);">${output}</strong>`;
    result.className = 'result-box show';
}

// ===== Симуляция адресации ячеек =====
function simulateAddressing() {
    const formula = document.getElementById('formula-input').value.trim();
    const result = document.getElementById('addressing-result');

    if (!formula) {
        result.textContent = 'Введите формулу (например: A1+B1).';
        result.className = 'result-box show';
        return;
    }

    result.innerHTML = `<strong>Исходная формула:</strong> =${formula}<br><br>`;
    result.innerHTML += `<strong>📋 При копировании на ячейку ниже:</strong><br>`;

    let shiftedFormula = formula;
    shiftedFormula = shiftedFormula.replace(/\b([A-Z]+)(\d+)\b/g, (match, col, row) => {
        const newRow = parseInt(row) + 1;
        return `${col}${newRow}`;
    });

    result.innerHTML += `=<code>${shiftedFormula}</code><br>`;
    result.innerHTML += `<br><span style="color:var(--text-light);font-size:0.85rem;">`;
    result.innerHTML += `💡 Абсолютные адреса ($A$1) не изменяются при копировании.</span>`;
    result.className = 'result-box show';
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', function() {
    // Подсветка активной страницы в меню
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === currentPage) a.classList.add('active');
    });

    // Инициализация RGB-палитр
    if (document.getElementById('rgb-r')) updateRGB();
    if (document.getElementById('rgb-r2')) updateRGB2();

    // Инициализация демонстрации слайдов
    if (document.getElementById('slide-demo')) updateSlide();
});
