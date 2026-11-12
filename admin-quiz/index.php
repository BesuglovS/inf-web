<?php
require_once __DIR__ . '/../sandbox/config.php';
require_once __DIR__ . '/../sandbox/AuthClient.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store, no-cache, must-revalidate');

$status = AuthClient::checkStatus();

if ($status['status'] === 'unavailable') {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Авторизация недоступна</title></head><body><h1>Сервис авторизации недоступен</h1><p>Попробуйте обновить страницу позже.</p></body></html>';
    exit;
}

if ($status['user'] === null) {
    header('Location: ' . AuthClient::getLoginUrl(INF_BASE_URL . '/admin-quiz/'), true, 302);
    exit;
}

if (empty($status['user']['is_admin'])) {
    http_response_code(403);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Доступ запрещён</title></head><body><h1>Доступ запрещён</h1><p>Страница доступна только администраторам.</p><p><a href="/">Вернуться на главную</a></p></body></html>';
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Результаты квизов — Основы информационных технологий</title>
    <link rel="icon" href="../favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="admin-quiz.css?v=1">
</head>
<body>
    <header class="admin-head">
        <div>
            <h1>Результаты квизов</h1>
            <p class="admin-sub">Основы информационных технологий · 40 занятий</p>
        </div>
        <div id="auth-status" class="admin-auth">Проверка авторизации…</div>
    </header>

    <main>
        <section class="panel controls">
            <div class="control-group">
                <label for="group-select">Класс</label>
                <select id="group-select"><option value="">Загрузка…</option></select>
            </div>
            <div class="control-group">
                <label for="lesson-from">Занятия с</label>
                <select id="lesson-from"></select>
            </div>
            <div class="control-group">
                <label for="lesson-to">по</label>
                <select id="lesson-to"></select>
            </div>
            <div class="control-group">
                <label>&nbsp;</label>
                <button id="load-btn" type="button">Загрузить</button>
            </div>
            <div class="control-group">
                <label>&nbsp;</label>
                <label class="check" for="only-quizzes" title="Показывать занятия по последнее, где есть результаты">
                    <input type="checkbox" id="only-quizzes" checked> Только с результатами
                </label>
            </div>
            <div class="control-group">
                <label>&nbsp;</label>
                <label class="check" for="quick-mode" title="Клик по ячейке записывает 100% и отметку «пройдено»">
                    <input type="checkbox" id="quick-mode"> Быстрый ввод
                </label>
            </div>
            <div class="control-group">
                <label>&nbsp;</label>
                <label class="check" for="clear-mode" title="Клик по ячейке снимает результат">
                    <input type="checkbox" id="clear-mode"> Убирать результаты
                </label>
            </div>
        </section>

        <p id="quick-hint" class="status">Клик по ячейке квиза — попытки. «Быстрый ввод» ставит 100%, «Убирать результаты» снимает результат.</p>

        <div class="legend">
            <span class="legend-item"><span class="legend-swatch swatch-100"></span>100%</span>
            <span class="legend-item"><span class="legend-swatch swatch-high"></span>1–99%</span>
            <span class="legend-item"><span class="legend-swatch swatch-zero"></span>0%</span>
            <span class="legend-item"><span class="legend-swatch swatch-none"></span>нет данных</span>
        </div>

        <div id="status" class="status" role="status" aria-live="polite"></div>
        <div id="table-container" class="table-wrapper" style="display:none"></div>

        <section id="mark-section" class="panel" style="display:none">
            <h2>Записать результат</h2>
            <div class="form-row">
                <div class="control-group">
                    <label for="mark-student">Ученик</label>
                    <select id="mark-student"></select>
                </div>
                <div class="control-group">
                    <label for="mark-lesson">Занятие</label>
                    <select id="mark-lesson"></select>
                </div>
                <div class="control-group">
                    <label for="mark-score">Балл, %</label>
                    <input type="number" id="mark-score" min="0" max="100" value="100">
                </div>
                <div class="control-group">
                    <label>&nbsp;</label>
                    <label class="check"><input type="checkbox" id="mark-completed" checked> Пройдено</label>
                </div>
                <div class="control-group">
                    <label>&nbsp;</label>
                    <button id="mark-btn" type="button">Записать</button>
                </div>
            </div>
            <div id="mark-status" class="status" role="status" aria-live="polite"></div>
        </section>

        <section class="panel">
            <h2>Последние пройденные квизы</h2>
            <div class="form-row">
                <div class="control-group">
                    <label for="recent-limit">Количество</label>
                    <select id="recent-limit">
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100" selected>100</option>
                        <option value="200">200</option>
                        <option value="500">500</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>&nbsp;</label>
                    <button id="recent-btn" type="button">Загрузить</button>
                </div>
                <div class="control-group">
                    <label>&nbsp;</label>
                    <button id="recent-csv-btn" type="button" class="btn-secondary" disabled>Скачать CSV</button>
                </div>
            </div>
            <div id="recent-status" class="status" role="status" aria-live="polite"></div>
            <div id="recent-table-container" class="table-wrapper" style="display:none"></div>
        </section>
    </main>

    <script src="admin-quiz.js?v=1" defer></script>
</body>
</html>
