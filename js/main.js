// Главная точка входа — модульная архитектура inf-web
// Подключает все модули и инициализирует обработчики событий

import { initAllQuizzes } from './lib/quiz.js';

// ===== Инициализация при загрузке DOM =====
document.addEventListener('DOMContentLoaded', function () {
    // Переключатель темы (должен быть первым)
    initThemeToggle();

    // Прогресс-бар прокрутки
    initScrollProgress();

    // Кнопка "наверх"
    initBackToTop();

    // Квизы
    initAllQuizzes();

    // Калькуляторы и конвертеры
    initCalculators();
    initConverters();
    initTools();
});

// ===== Переключатель темы =====
function initThemeToggle() {
    var toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    var STORAGE_KEY_THEME = 'inf_theme';

    function getPreferredTheme() {
        var stored = localStorage.getItem(STORAGE_KEY_THEME);
        if (stored === 'dark' || stored === 'light') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        toggle.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
        toggle.setAttribute('aria-label', theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему');
    }

    applyTheme(getPreferredTheme());

    toggle.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY_THEME, next);
        applyTheme(next);
    });

    // Слушаем системные изменения
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem(STORAGE_KEY_THEME)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// ===== Прогресс-бар прокрутки =====
function initScrollProgress() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;

    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        bar.style.width = progress + '%';
        bar.setAttribute('aria-valuenow', Math.round(progress));
    });

    // Начальное значение
    const initialProgress = (window.pageYOffset || document.documentElement.scrollTop) /
        (document.documentElement.scrollHeight - document.documentElement.clientHeight) * 100;
    bar.style.width = (initialProgress || 0) + '%';
}

// ===== Кнопка "наверх" =====
function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
        if ((window.pageYOffset || document.documentElement.scrollTop) > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== Калькуляторы (calculators.js) =====
// Функции из calculators.js подключаются напрямую через DOM-обработчики,
// так как они используют глобальные элементы формы.
// Подключаем их как inline обработчики.

function initCalculators() {
    // Калькулятор объёма изображения
    const imgVolumeBtn = document.getElementById('calc-img-volume');
    if (imgVolumeBtn) {
        import('./lib/calculators.js').then(function (mod) {
            imgVolumeBtn.addEventListener('click', mod.calcImageVolume);
        });
    }

    // Калькулятор объёма звука
    const audioVolumeBtn = document.getElementById('calc-audio-volume');
    if (audioVolumeBtn) {
        import('./lib/calculators.js').then(function (mod) {
            audioVolumeBtn.addEventListener('click', mod.calcAudioVolume);
        });
    }

    // Калькулятор объёма текста
    const textVolumeBtn = document.getElementById('calc-text-volume');
    if (textVolumeBtn) {
        import('./lib/calculators.js').then(function (mod) {
            textVolumeBtn.addEventListener('click', mod.calcTextVolume);
        });
    }

    // Проверка надёжности пароля
    const passwordBtn = document.getElementById('check-password');
    if (passwordBtn) {
        import('./lib/calculators.js').then(function (mod) {
            passwordBtn.addEventListener('click', mod.checkPassword);
        });
    }

    // RGB конвертер
    const rgbBtn = document.getElementById('calc-rgb');
    if (rgbBtn) {
        import('./lib/calculators.js').then(function (mod) {
            rgbBtn.addEventListener('click', mod.calcRGB);
        });
    }
}

// ===== Конвертеры (conversion.js) =====
function initConverters() {
    // Конвертер систем счисления
    const baseBtn = document.getElementById('convert-base-btn');
    if (baseBtn) {
        import('./lib/conversion.js').then(function (mod) {
            baseBtn.addEventListener('click', mod.convertBase);
        });
    }

    // Калькулятор логических выражений
    const logicBtn = document.getElementById('calc-logic-btn');
    if (logicBtn) {
        import('./lib/conversion.js').then(function (mod) {
            logicBtn.addEventListener('click', mod.calcLogic);
        });
    }

    // Шифр Цезаря
    const cipherBtn = document.getElementById('cipher-btn');
    if (cipherBtn) {
        import('./lib/conversion.js').then(function (mod) {
            cipherBtn.addEventListener('click', mod.caesarCipher);
        });
    }

    // Симуляция адресации
    const addressingBtn = document.getElementById('addressing-btn');
    if (addressingBtn) {
        import('./lib/conversion.js').then(function (mod) {
            addressingBtn.addEventListener('click', mod.simulateAddressing);
        });
    }

    // Двоичное -> Десятичное
    const binToDecBtn = document.getElementById('bin-to-dec-btn');
    if (binToDecBtn) {
        import('./lib/conversion.js').then(function (mod) {
            binToDecBtn.addEventListener('click', mod.binToDec);
        });
    }

    // Десятичное -> Двоичное
    const decToBinBtn = document.getElementById('dec-to-bin-btn');
    if (decToBinBtn) {
        import('./lib/conversion.js').then(function (mod) {
            decToBinBtn.addEventListener('click', mod.decToBin);
        });
    }

    // Калькулятор объёма видео
    const videoBtn = document.getElementById('calc-video-volume');
    if (videoBtn) {
        import('./lib/conversion.js').then(function (mod) {
            videoBtn.addEventListener('click', mod.calcVideoVolume);
        });
    }
}

// ===== Дополнительные инструменты =====
function initTools() {
    // Проверка читабельности текста
    const readabilityBtn = document.getElementById('check-readability');
    if (readabilityBtn) {
        import('./lib/calculators.js').then(function (mod) {
            readabilityBtn.addEventListener('click', mod.checkReadability);
        });
    }

    // Анализатор IP-адреса
    const ipBtn = document.getElementById('analyze-ip');
    if (ipBtn) {
        import('./lib/calculators.js').then(function (mod) {
            ipBtn.addEventListener('click', mod.analyzeIP);
        });
    }

    // Чек-лист прогресса тем (localStorage)
    initTopicProgress();
}

// ===== Сохранение прогресса тем в localStorage =====
function initTopicProgress() {
    const checkboxes = document.querySelectorAll('.topic-progress input[type="checkbox"]');
    if (checkboxes.length === 0) return;

    const storageKey = 'inf-web-topic-progress';

    // Загрузка сохранённого прогресса
    let progress = {};
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            progress = JSON.parse(saved);
        }
    } catch (e) {
        progress = {};
    }

    // Применяем сохранённые значения
    for (let i = 0; i < checkboxes.length; i++) {
        const cb = checkboxes[i];
        const id = cb.getAttribute('data-topic-id');
        if (id && progress[id]) {
            cb.checked = true;
            updateCheckboxStyle(cb);
        }

        cb.addEventListener('change', function () {
            const topicId = this.getAttribute('data-topic-id');
            if (!topicId) return;

            if (this.checked) {
                progress[topicId] = true;
            } else {
                delete progress[topicId];
            }

            try {
                localStorage.setItem(storageKey, JSON.stringify(progress));
            } catch (e) {
                // localStorage может быть полон или недоступен
            }

            updateCheckboxStyle(this);
            updateTopicProgressCounter();
        });
    }

    updateTopicProgressCounter();
}

function updateCheckboxStyle(cb) {
    const label = cb.closest('label');
    if (!label) return;
    if (cb.checked) {
        label.classList.add('completed');
    } else {
        label.classList.remove('completed');
    }
}

function updateTopicProgressCounter() {
    const counters = document.querySelectorAll('.topic-progress-counter');
    if (counters.length === 0) return;

    const checkboxes = document.querySelectorAll('.topic-progress input[type="checkbox"]');
    const total = checkboxes.length;
    const completed = document.querySelectorAll('.topic-progress input[type="checkbox"]:checked').length;

    for (let i = 0; i < counters.length; i++) {
        counters[i].textContent = 'Завершено: ' + completed + ' из ' + total;
    }
}

// ===== Регистрация Service Worker =====
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
}