# AGENTS.md — Инструкции для ИИ-ассистентов

Статический образовательный PWA-сайт по информатике для 7–9 классов (русский язык, ФРП базовый уровень).
Без сборки и бандлеров: HTML с контентом, CSS, vanilla JS (ES-модули + легаси-скрипты), Service Worker,
тесты на Vitest. Прод: `https://inf.nayanovaacademy.ru`.

## ⚠️ Критические правила

1. **Проект в промежуточном (поломанном) состоянии рефакторинга.** Легаси `js/scripts.js` и `js/quiz.js`
   больше не подключаются ни одной страницей, НО HTML-страницы всё ещё используют:
   - inline-обработчики `onclick="globalFn()"` → `ReferenceError` (глобальных функций нет);
   - контейнеры квизов `.quiz-block.dynamic-quiz`, а модуль `js/lib/quiz.js` ищет `.quiz-container` → квизы не рендерятся;
   - `.progress-btn` и прогресс-бары, которыми управлял легаси `updateProgressUI()` → мёртвые.
   Рабочие интерактивы сейчас: только `.theme-toggle` и `.back-to-top`. Не заявляйте работоспособность
   калькуляторов/квизов, не проверив фактический код.
2. **`js/lib/quiz.js` грузит `/data/quizzes.json` по абсолютному пути** — локально тестировать из корня сайта, не через `file://`.
3. **`data/quizzes.json` покрывает только 8 из 24 тем** (6-1, 6-2, 7-1, 7-2, 8-1, 8-2, 9-1, 9-2).
   Данные квизов раздроблены по трём местам: встроенный `QUIZ_DATA` в легаси `js/quiz.js`,
   `data/quizzes.json` и fetch-логика в `js/lib/quiz.js` — ни одно не связано с текущей разметкой полностью.
4. **`sw.js` предкэширует легаси-файлы и не содержит новых** (`main.js`, `js/lib/*`, `data/*.json`).
   При добавлении/переименовании файлов **обязательно поднять `CACHE_NAME`** (сейчас `inf-web-v2`).
5. **`css/design-tokens.css` не подключён** ни на одной странице; работает только `css/styles.css`.
6. **Синхронизация с экосистемой**: `js/progress-client.js`, `js/progress-sync.js`, `js/tracking-client.js`
   — канонические копии (`shared/js/...`, `auth-web/assets/js/tracking-client.js`), грузятся только на `index.html`.
   Правьте через канонический источник и синк, а не только локально.
7. **`.env` закоммичен в git** (содержит SSH-параметры деплоя). Не печатать его значения, не добавлять в него секреты. Из tar-архива деплоя он исключён.
8. **Не перекоммичивать/не «чинить» легаси без учёта SW**: удаление `js/scripts.js`/`js/quiz.js` требует правки `sw.js`.

## 🔧 Команды

```bash
python -m http.server 8000   # локальный dev-сервер (обязательно, т.к. fetch/по абсолютному пути)
npx vitest run               # тесты (vitest не установлен локально — npx скачает; package.json НЕТ)
npx vitest run tests/calculators.test.js
.\deploy.ps1 -DryRun         # сухой прогон
.\deploy.ps1                 # деплой
```

⚠️ `npm install` ничего не делает — в проекте нет `package.json`.

## 🏗 Структура

```
index.html               # лендинг; единственная страница с progress-client/sync + tracking-client
7-klass.html / 8-klass.html / 9-klass.html   # обзоры классов (7→темы 1–3, 8→4–5, 9→6–9)
tema-{1-9}-{n}.html      # 24 урока: X — глобальный номер темы (1–9), Y — урок внутри темы
css/styles.css           # единственный живой стиль; css/design-tokens.css НЕ подключён
js/main.js               # entry ES-модуля: theme-toggle, back-to-top, квизы, калькуляторы, SW
js/lib/{utils,calculators,conversion,quiz}.js   # модули
js/{scripts,quiz}.js     # ЛЕГАСИ (не подключаются), JS/scripts.js держит все глобальные функции
js/progress-client.js, progress-sync.js, tracking-client.js  # экосистемные копии (index.html)
data/topics.json         # структура курса (24 темы), согласован с progress-sync.js TOTAL_TOPICS=24
data/quizzes.json        # банк вопросов (8/24 тем)
tests/                   # Vitest + jsdom
docs/                    # официальные ФРП-документы (не линкуются со страниц)
sw.js, manifest.json, sitemap.xml, robots.txt, 404.html
deploy.ps1, inf.nayanovaacademy.ru (nginx, untracked)
```

## 📝 Редактирование контента

- Каждая `tema-X-Y.html` имеет жёсткий скелет: skip-link → header (`.site-title`, `.theme-toggle`) →
  nav (3 класса) → breadcrumbs → `.progress-text`/`.progress-bar` → `.page-title` → опц. `.toc` →
  `.card`-блоки → `.quiz-block.dynamic-quiz` → `.btn.progress-btn` → `.topic-nav`.
- При добавлении темы держать в синхроне: `data/topics.json`, `progress-sync.js` (TOTAL_TOPICS),
  `sitemap.xml`, `sw.js` (`CACHE_NAME`).
- Формат вопроса (CONTRIBUTING.md): `{ "q", "options": [3 шт], "answer": 0|1|2, "explanation" }`.

## 💻 Конвенции кода

- **JS**: ES6+ в модулях; camelCase для переменных/функций, kebab-case для файлов; русские комментарии/строки.
- **HTML**: семантика + a11y (`.skip-link`, `aria-*`, `:focus-visible`), 4-space indent, `lang="ru"`.
- **CSS**: переменные в `:root`, тёмная тема через `html[data-theme="dark"]`, BEM-подобные классы, `@media` 768/480px, print, reduced-motion.
- **localStorage**: `inf_progress`, `inf-web-topic-progress`, `inf_theme`, `nayanova-progress`.
- Контент и UI — **русский**.

## 🧪 Тестирование

- Vitest, env `jsdom` (`vitest.config.mjs`), паттерн `tests/**/*.test.js`.
- **Важный нюанс**: тесты дублируют бизнес-логику инлайн и НЕ импортируют `js/lib/*` — рефакторинг
  модулей тестами не ловится, а покрытие `js/lib/**` фактически 0%. Не считайте тесты защитой от поломки модулей.

## 🚀 Деплой (`deploy.ps1`)

1. `.env` → SSH-переменные; `icacls` ключа.
2. `tar` проекта (без `.git`, `.env`, `deploy.ps1`, `inf.nayanovaacademy.ru`, IDE-файлов) → SSH.
3. Удалённо: `rm -rf {remote}/*` → распаковка.
4. Деплой nginx-конфига + `nginx -t && systemctl reload nginx`.

Требования сервера: nginx + PHP 8.1-FPM (для `.php`), SSL, root `/var/www/inf.nayanovaacademy.ru/public/`.
Nginx: `try_files ... /index.html`, static `immutable 30d`, `no-cache` для `/sw.js` и `/js/tracking-client.js`.

## 🔒 Безопасность

- `.env` и `G:\WebSites\na\ssh-private.key` — никогда не печатать и не коммитить.
- `robots.txt` запрещает `/docs/` и `/data/`.
- Деплой уничтожает удалённую директорию — перед деплоем фиксировать чистое состояние.