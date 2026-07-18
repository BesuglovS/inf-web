// ===== Утилиты =====
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function setResultText(el, text) {
    el.textContent = text;
    el.className = 'result-box show';
}

function setResultHTML(el, html) {
    el.innerHTML = html;
    el.className = 'result-box show';
}

// ===== Конвертер единиц измерения информации =====
function convertInfoUnits() {
    const value = parseFloat(document.getElementById('convert-value').value);
    const from = document.getElementById('convert-from').value;
    const to = document.getElementById('convert-to').value;
    const result = document.getElementById('convert-result');

    if (isNaN(value) || value < 0) {
        setResultText(result, 'Пожалуйста, введите положительное число.');
        return;
    }

    const units = { bit: 1, byte: 8, kb: 8 * 1024, mb: 8 * 1024 * 1024, gb: 8 * 1024 * 1024 * 1024 };
    const bits = value * units[from];
    const resultValue = bits / units[to];

    const unitNames = { bit: 'бит', byte: 'байт', kb: 'Кбайт', mb: 'Мбайт', gb: 'Гбайт' };
    setResultText(result, value + ' ' + unitNames[from] + ' = ' + resultValue + ' ' + unitNames[to]);
}

// ===== Калькулятор информационного объёма текста =====
function calcTextVolume() {
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

// ===== RGB Калькулятор (общая функция) =====
function updateRGBGeneric(rId, gId, bId, previewId, infoId, showDepth) {
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

function updateRGB() {
    updateRGBGeneric('rgb-r', 'rgb-g', 'rgb-b', 'rgb-preview', 'rgb-info', true);
}

function updateRGB2() {
    updateRGBGeneric('rgb-r2', 'rgb-g2', 'rgb-b2', 'rgb-preview2', 'rgb-info2', false);
}

// ===== Калькулятор объёма изображения =====
function calcImageVolume() {
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

// ===== Калькулятор объёма звука =====
function calcAudioVolume() {
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

// ===== Скорость передачи данных =====
function calcSpeed() {
    const volume = parseFloat(document.getElementById('speed-volume').value);
    const unit = document.getElementById('speed-unit').value;
    const time = parseFloat(document.getElementById('speed-time').value);
    const result = document.getElementById('speed-result');

    if (isNaN(volume) || isNaN(time) || volume <= 0 || time <= 0) {
        setResultText(result, 'Введите положительные числа.');
        return;
    }

    const unitNames = { bit: 'бит', byte: 'байт', kb: 'Кбайт', mb: 'Мбайт' };
    const toBits = { bit: 1, byte: 8, kb: 8 * 1024, mb: 8 * 1024 * 1024 };
    const bits = volume * toBits[unit];
    const speedBps = bits / time;
    const speedKbps = speedBps / 1024;
    const speedMbps = speedKbps / 1024;

    result.innerHTML = 'Передано: ' + escapeHTML(String(volume)) + ' ' + unitNames[unit] + ' за ' + escapeHTML(String(time)) + ' с';
    result.innerHTML += '<br>Скорость: ' + speedBps.toFixed(1) + ' бит/с = ' + speedKbps.toFixed(2) + ' Кбит/с = ' + speedMbps.toFixed(2) + ' Мбит/с';
    result.className = 'result-box show';
}

// ===== Проверка знаний (тест) =====
function checkQuiz(formId, answers) {
    const form = document.getElementById(formId);
    if (!form) return;
    const formData = new FormData(form);
    let score = 0;
    const total = Object.keys(answers).length;
    const resultEl = form.querySelector('.quiz-result');

    const wrongQuestions = [];
    for (const q in answers) {
        if (!answers.hasOwnProperty(q)) continue;
        const correct = answers[q];
        const selected = formData.get(q);
        if (selected === correct) {
            score++;
        } else {
            const qLabel = form.querySelector('input[name="' + q + '"]');
            if (qLabel) {
                const fieldset = qLabel.closest('.quiz-question');
                if (fieldset) {
                    const questionText = fieldset.querySelector('p');
                    const correctLabel = fieldset.querySelector('input[value="' + correct + '"]');
                    if (questionText && correctLabel) {
                        const labelText = correctLabel.closest('label');
                        wrongQuestions.push({
                            question: questionText.textContent,
                            correctAnswer: labelText ? labelText.textContent.trim() : correct
                        });
                    }
                }
            }
        }
    }

    let resultHTML = 'Вы ответили правильно на ' + score + ' из ' + total + ' вопросов.';
    if (score === total) {
        resultEl.style.color = 'var(--success)';
        resultEl.style.borderColor = 'var(--success)';
        resultHTML += ' Отлично!';
    } else if (score >= total / 2) {
        resultEl.style.color = 'var(--accent)';
        resultEl.style.borderColor = 'var(--accent)';
        resultHTML += ' Хорошо, но есть над чем поработать.';
    } else {
        resultEl.style.color = 'var(--warning)';
        resultEl.style.borderColor = 'var(--warning)';
        resultHTML += ' Рекомендуется повторить материал.';
    }

    if (wrongQuestions.length > 0) {
        resultHTML += '<br><br><strong>Правильные ответы:</strong>';
        wrongQuestions.forEach(function(item) {
            resultHTML += '<br><span style="font-weight:400;font-size:0.9rem;">' +
                escapeHTML(item.question) + ' &mdash; ' +
                escapeHTML(item.correctAnswer) + '</span>';
        });
    }

    resultEl.innerHTML = resultHTML;
    resultEl.className = 'quiz-result show';
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

    result.textContent = 'Надёжность пароля: ' + levels[strength];
    result.style.borderColor = colors[strength];
    result.style.color = colors[strength];
    result.className = 'result-box show';
}

// ===== Расчёт объёма цифрового фото =====
function calcPhotoVolume() {
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

// ===== Проверка читаемости текста (индекс Флеша-Кинкейда) =====
function checkReadability() {
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

// ===== Интерактивная демонстрация слайдов =====
const slideData = [
    '<h4>Слайд 1: Титульный слайд</h4><p style="font-size:0.9rem;">&laquo;Мультимедийные презентации&raquo;<br>Автор: Ученик 7 класса</p>',
    '<h4>Слайд 2: Содержание</h4><ul style="font-size:0.85rem; text-align:left;"><li>Введение</li><li>Основная часть</li><li>Примеры</li><li>Заключение</li></ul>',
    '<h4>Слайд 3: Основные данные</h4><p style="font-size:0.85rem;">Используйте таблицы, графики и схемы для наглядности.</p><div style="background:#eef; padding:8px; border-radius:6px; font-size:0.8rem;">График успеваемости</div>',
    '<h4>Слайд 4: Заключительный слайд</h4><p style="font-size:0.9rem;">Спасибо за внимание!<br>Вопросы?</p>'
];

let currentSlide = 0;

function updateSlide() {
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

    const octets = input.split('.');
    if (octets.length !== 4) {
        setResultText(result, 'Ошибка: IP-адрес должен содержать 4 октета, разделённых точками (например, 192.168.1.1).');
        result.style.display = 'block';
        return;
    }

    const nums = [];
    for (let i = 0; i < 4; i++) {
        const n = parseInt(octets[i], 10);
        if (isNaN(n) || n < 0 || n > 255 || octets[i] !== n.toString()) {
            setResultText(result, 'Ошибка: октет ' + (i + 1) + ' (\u00AB' + escapeHTML(octets[i]) + '\u00BB) \u2014 некорректное число. Каждый октет должен быть числом от 0 до 255.');
            result.style.display = 'block';
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

    const safeInput = escapeHTML(input);
    let html = 'Введённый IP-адрес: <strong>' + safeInput + '</strong> (IPv4)';
    html += '<br><br><strong>Формы представления:</strong>';
    html += '<br><span class="text-light">Десятично-точечная:</span> <strong>' + safeInput + '</strong>';
    html += '<br><span class="text-light">Двоичная:</span> <strong>' + binary + '</strong>';
    html += '<br><span class="text-light">Шестнадцатеричная:</span> <strong>' + hex + '</strong>';
    html += '<br><span class="text-light">Целочисленная:</span> <strong>' + decimalInt + '</strong>';
    html += '<br><br><strong>Информация:</strong>';
    html += '<br>Класс: ' + addressClass;
    html += '<br>Тип: ' + (isPrivate ? 'Частный (внутренний)' : 'Публичный (глобальный)');
    html += '<br>Разрядность: 32 бита (4 октета \u00D7 8 бит)';

    result.innerHTML = html;
    result.className = 'result-box show';
}

// ===== Конвертер систем счисления =====
function convertBase() {
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

    let html = '<strong>' + opName + '</strong><br><br>';
    html += 'A = ' + (a === 1 ? 'Истина (1)' : 'Ложь (0)') + '<br>';
    html += 'B = ' + (b === 1 ? 'Истина (1)' : 'Ложь (0)') + '<br><br>';
    html += 'Результат: <strong>' + (res === 1 ? 'Истина (1)' : 'Ложь (0)') + '</strong>';
    setResultHTML(result, html);
}

// ===== Шифр Цезаря =====
function caesarCipher() {
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

    let html = '<strong>\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442:</strong> ' + escapeHTML(input) + '<br>';
    html += '<strong>\u041A\u043B\u044E\u0447 (\u0441\u0434\u0432\u0438\u0433):</strong> ' + shift + '<br><br>';
    html += '<strong>\u0417\u0430\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442:</strong> <strong style="color:var(--primary);">' + escapeHTML(output) + '</strong>';
    setResultHTML(result, html);
}

// ===== Симуляция адресации ячеек =====
function simulateAddressing() {
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

    let html = '<strong>\u0418\u0441\u0445\u043E\u0434\u043D\u0430\u044F \u0444\u043E\u0440\u043C\u0443\u043B\u0430:</strong> =' + escapeHTML(formula) + '<br><br>';
    html += '<strong>\u041F\u0440\u0438 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438 \u043D\u0430 \u044F\u0447\u0435\u0439\u043A\u0443 \u043D\u0438\u0436\u0435:</strong><br>';
    html += '=<code>' + escapeHTML(shiftedFormula) + '</code><br>';
    html += '<br><span class="text-light" style="font-size:0.85rem;">';
    html += '\u0410\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u044B\u0435 \u0430\u0434\u0440\u0435\u0441\u0430 ($A$1) \u043D\u0435 \u0438\u0437\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u043F\u0440\u0438 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0438.</span>';
    setResultHTML(result, html);
}

// ===== Конвертер двоичного в десятичное =====
function binToDec() {
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

function superscript(n) {
    const sup = '\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079';
    return String(n).split('').map(function(d) { return sup[parseInt(d)]; }).join('');
}

// ===== Конвертер десятичного в двоичное =====
function decToBin() {
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

// ===== Калькулятор объёма видео =====
function calcVideoVolume() {
    const width = parseInt(document.getElementById('vid-width').value);
    const height = parseInt(document.getElementById('vid-height').value);
    const depth = parseInt(document.getElementById('vid-depth').value);
    const fps = parseInt(document.getElementById('vid-fps').value);
    const duration = parseInt(document.getElementById('vid-duration').value);
    const result = document.getElementById('video-volume-result');

    if (!width || !height || !depth || !fps || !duration || width < 1 || height < 1) {
        setResultText(result, 'Пожалуйста, заполните все поля корректными значениями.');
        return;
    }

    const bitsPerFrame = width * height * depth;
    const bitsPerSec = bitsPerFrame * fps;
    const totalBits = bitsPerSec * duration;
    const totalBytes = totalBits / 8;
    const kb = totalBytes / 1024;
    const mb = kb / 1024;
    const gb = mb / 1024;

    let html = 'Разрешение: ' + width + '\u00D7' + height + ' пикселей';
    html += '<br>Глубина цвета: ' + depth + ' бит | Кадров в секунду: ' + fps;
    html += '<br>Длительность: ' + duration + ' с (' + (duration / 60).toFixed(1) + ' мин)';
    html += '<br><br>Объём в uncompressed:';
    html += '<br>' + totalBits + ' бит';
    html += '<br>' + totalBytes + ' байт';
    html += '<br>' + kb.toFixed(2) + ' Кбайт';
    html += '<br>' + mb.toFixed(2) + ' Мбайт';
    if (gb >= 1) html += '<br>' + gb.toFixed(2) + ' Гбайт';
    result.innerHTML = html;
    result.className = 'result-box show';
}

// ===== Калькулятор объёма звука для презентации =====
function calcPresSound() {
    const freq = parseInt(document.getElementById('pres-sound-freq').value);
    const depth = parseInt(document.getElementById('pres-sound-depth').value);
    const channels = parseInt(document.getElementById('pres-sound-ch').value);
    const duration = parseInt(document.getElementById('pres-sound-dur').value);
    const result = document.getElementById('pres-sound-result');

    if (!freq || !depth || !channels || !duration || duration < 1) {
        setResultText(result, 'Пожалуйста, заполните все поля корректными значениями.');
        return;
    }

    const bitsPerSec = freq * depth * channels;
    const totalBytes = (bitsPerSec / 8) * duration;
    const kb = totalBytes / 1024;
    const mb = kb / 1024;

    let html = 'Параметры: ' + freq + ' Гц, ' + depth + ' бит, ' + channels + ' канал(ов), ' + duration + ' с';
    html += '<br>Объём: ' + totalBytes + ' байт = ' + kb.toFixed(2) + ' Кбайт = ' + mb.toFixed(2) + ' Мбайт';
    result.innerHTML = html;
    result.className = 'result-box show';
}

// ===== Система прогресса (localStorage) =====
const STORAGE_KEY = 'inf_progress';

function getProgress() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch(e) {
        return {};
    }
}

function saveProgress(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) { /* localStorage недоступен */ }
}

function markTopicComplete(topicId) {
    const progress = getProgress();
    progress[topicId] = { completed: true, date: new Date().toISOString() };
    saveProgress(progress);
    updateProgressUI();
}

function markTopicIncomplete(topicId) {
    const progress = getProgress();
    delete progress[topicId];
    saveProgress(progress);
    updateProgressUI();
}

function isTopicComplete(topicId) {
    const progress = getProgress();
    return progress[topicId] && progress[topicId].completed;
}

const allTopics = [
    '1-1', '1-2', '1-3',
    '2-1', '2-2',
    '3-1', '3-2', '3-3',
    '4-1', '4-2',
    '5-1', '5-2', '5-3', '5-4',
    '6-1', '6-2',
    '7-1', '7-2',
    '8-1', '8-2',
    '9-1', '9-2'
];

function updateProgressUI() {
    const progressBars = document.querySelectorAll('.progress-bar');
    const progressTexts = document.querySelectorAll('.progress-text');
    const progress = getProgress();
    let completed = 0;
    for (const key in progress) {
        if (progress[key] && progress[key].completed) completed++;
    }
    const percent = Math.round((completed / allTopics.length) * 100);

    progressBars.forEach(function(bar) {
        bar.style.width = percent + '%';
    });
    progressTexts.forEach(function(txt) {
        txt.textContent = '\u0418\u0437\u0443\u0447\u0435\u043D\u043E: ' + completed + ' \u0438\u0437 ' + allTopics.length + ' \u0442\u0435\u043C (' + percent + '%)';
    });
}

function toggleProgressButton(topicId) {
    const btn = document.getElementById('progress-btn-' + topicId);
    if (!btn) return;
    if (isTopicComplete(topicId)) {
        btn.textContent = '\u0418\u0437\u0443\u0447\u0435\u043D\u043E \u2713';
        btn.classList.add('btn-completed');
    } else {
        btn.textContent = '\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043A\u0430\u043A \u0438\u0437\u0443\u0447\u0435\u043D\u043D\u043E\u0435';
        btn.classList.remove('btn-completed');
    }
}

function handleProgressToggle(topicId) {
    if (isTopicComplete(topicId)) {
        markTopicIncomplete(topicId);
    } else {
        markTopicComplete(topicId);
    }
    toggleProgressButton(topicId);
}

// ===== Боковое оглавление (sidebar TOC) =====
function initSidebarToc() {
    var toc = document.querySelector('.toc');
    var main = document.querySelector('main#main-content');
    if (!toc || !main) return;

    // Создаём обёртку content-layout
    var layout = document.createElement('div');
    layout.className = 'content-layout';

    // Создаём контейнер для основного контента
    var contentMain = document.createElement('div');
    contentMain.className = 'toc-main';

    // Перемещаем .toc в layout
    main.insertBefore(layout, toc);
    layout.appendChild(toc);
    layout.appendChild(contentMain);

    // Перемещаем все элементы после .toc в contentMain
    var siblings = [];
    var node = layout.nextSibling;
    while (node) {
        var next = node.nextSibling;
        siblings.push(node);
        node = next;
    }
    siblings.forEach(function(el) {
        contentMain.appendChild(el);
    });
}

// ===== Scroll-spy для оглавления =====
function initTocScrollSpy() {
    var toc = document.querySelector('.toc');
    if (!toc) return;

    var links = toc.querySelectorAll('ol li a');
    if (links.length < 2) return;

    // Собираем id секций из ссылок оглавления
    var sections = [];
    links.forEach(function(link) {
        var href = link.getAttribute('href');
        if (href && href.charAt(0) === '#') {
            var target = document.getElementById(href.substring(1));
            if (target) {
                sections.push({ id: href.substring(1), el: target, link: link });
            }
        }
    });

    if (sections.length < 2) return;

    function updateActive() {
        var scrollPos = window.scrollY + 120;
        var current = sections[0];

        for (var i = 0; i < sections.length; i++) {
            if (sections[i].el.offsetTop <= scrollPos) {
                current = sections[i];
            }
        }

        links.forEach(function(l) { l.classList.remove('toc-active'); });
        if (current) current.link.classList.add('toc-active');
    }

    var ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                updateActive();
                ticking = false;
            });
            ticking = true;
        }
    });

    updateActive();
}

// ===== Back to Top =====
function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function() {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', function() {
    // Подсветка активного пункта навигации
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(function(a) {
        const href = a.getAttribute('href');
        if (href === currentPage) {
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        }
    });

    // Инициализация интерактивных элементов
    if (document.getElementById('rgb-r')) updateRGB();
    if (document.getElementById('rgb-r2')) updateRGB2();
    if (document.getElementById('slide-demo')) updateSlide();

    // Кнопки прогресса
    document.querySelectorAll('.progress-btn').forEach(function(btn) {
        const topicId = btn.getAttribute('data-topic');
        if (topicId) {
            toggleProgressButton(topicId);
            btn.addEventListener('click', function() {
                handleProgressToggle(topicId);
            });
        }
    });

    updateProgressUI();
    initBackToTop();
    initSidebarToc();
    initTocScrollSpy();
});
