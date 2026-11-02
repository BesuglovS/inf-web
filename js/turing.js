/**
 * Интерактивный исполнитель МТ для страницы turing.html.
 *
 * Программа хранится в модели и редактируется прямо в таблице:
 * состояния — строки, символы — столбцы, клетки — команды вида «символ, сдвиг, состояние».
 */
(function () {
    "use strict";

    var BLANK = "λ";
    var MAX_STEPS = 500;
    var DEFAULT_DELAY = 500;
    var MOVES = ["L", "R", "N", "S"];
    var PRESETS = {
        "2026": {
            states: ["q0", "q1"],
            symbols: [BLANK, "1", "0"],
            commands: {
                "q0:λ": "λ, L, q1",
                "q1:λ": "λ, S, q1",
                "q1:1": "0, S, q1",
                "q1:0": "1, L, q1"
            },
            tape: "101",
            message: "Демоверсия 2026: программа загружена. Условие допускает любую последовательность из 1000 символов; здесь показан короткий пример 101, головка справа."
        },
        "2027": {
            states: ["q0", "q1", "q2"],
            symbols: [BLANK, "0", "1"],
            commands: {
                "q0:λ": "λ, L, q1",
                "q1:λ": "1, L, q2",
                "q1:0": "0, L, q1",
                "q1:1": "1, L, q1",
                "q2:λ": "λ, S, q2"
            },
            tape: "11111101001",
            message: "Демоверсия 2027: на ленте двоичная запись 2025, головка справа. Запустите программу — в конце должно получиться 4073."
        }
    };

    function pluralSteps(n) {
        var mod10 = n % 10;
        var mod100 = n % 100;

        if (mod10 === 1 && mod100 !== 11) {
            return n + " шаг";
        }
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
            return n + " шага";
        }
        return n + " шагов";
    }

    function trim(value) {
        return value.replace(/^\s+|\s+$/g, "");
    }

    function copyObject(source) {
        var result = {};
        Object.keys(source).forEach(function (key) {
            result[key] = source[key];
        });
        return result;
    }

    function parseCommand(value, model) {
        if (!value) {
            return null;
        }

        var parts = value.split(",").map(trim);
        if (parts.length !== 3) {
            return null;
        }

        var write = parts[0];
        var move = parts[1];
        var next = parts[2];

        if (model.symbols.indexOf(write) === -1) {
            return null;
        }
        if (MOVES.indexOf(move) === -1) {
            return null;
        }
        if (model.states.indexOf(next) === -1) {
            return null;
        }

        return {
            write: write,
            move: move,
            next: next
        };
    }

    function formatCommand(command) {
        return command.write + ", " + command.move + ", " + command.next;
    }

    function moveLabel(move) {
        var labels = {
            L: "сдвиг влево",
            R: "сдвиг вправо",
            N: "без сдвига",
            S: "остановка"
        };
        return labels[move] || move;
    }

    function randomTape(model) {
        var symbols = model.symbols.filter(function (symbol) {
            return symbol !== BLANK;
        });
        var length = 4 + Math.floor(Math.random() * 5);
        var result = "";

        if (!symbols.length) {
            return "";
        }

        for (var i = 0; i < length; i += 1) {
            result += symbols[Math.floor(Math.random() * symbols.length)];
        }

        return result;
    }

    function init(root) {
        var input = root.querySelector("[data-mt-input]");
        var inputHint = root.querySelector("[data-mt-input-hint]");
        var loadBtn = root.querySelector("[data-mt-load]");
        var resetBtn = root.querySelector("[data-mt-reset]");
        var randomBtn = root.querySelector("[data-mt-random]");
        var stepBtn = root.querySelector("[data-mt-step]");
        var playBtn = root.querySelector("[data-mt-play]");
        var delaySelect = root.querySelector("[data-mt-delay]");
        var phaseEl = root.querySelector("[data-mt-phase]");
        var counterEl = root.querySelector("[data-mt-counter]");
        var msgEl = root.querySelector("[data-mt-msg]");
        var decimalEl = root.querySelector("[data-mt-decimal]");
        var binaryEl = root.querySelector("[data-mt-binary]");
        var countsEl = root.querySelector("[data-mt-counts]");
        var sumsEl = root.querySelector("[data-mt-sums]");
        var tapeWrap = root.querySelector("[data-mt-tape-wrap]");
        var tapeEl = root.querySelector("[data-mt-tape]");
        var table = root.querySelector("[data-mt-program]");
        var newStateInput = root.querySelector("[data-mt-new-state]");
        var newSymbolInput = root.querySelector("[data-mt-new-symbol]");
        var addStateBtn = root.querySelector("[data-mt-add-state]");
        var addSymbolBtn = root.querySelector("[data-mt-add-symbol]");

        if (!input || !stepBtn || !playBtn || !tapeWrap || !tapeEl || !table) {
            return;
        }

        var model = {
            states: [],
            symbols: [BLANK],
            commands: {}
        };
        var initialTape = {};
        var tape = {};
        var startPos = 0;
        var head = 0;
        var state = "q0";
        var steps = 0;
        var halted = false;
        var lastKey = null;
        var minPos = -2;
        var maxPos = 2;
        var timer = null;

        function sanitize(value) {
            var result = "";

            for (var i = 0; i < value.length; i += 1) {
                var symbol = value.charAt(i);
                if (symbol !== BLANK && model.symbols.indexOf(symbol) !== -1) {
                    result += symbol;
                }
            }

            return result.slice(0, 24);
        }

        function readCell(pos) {
            return tape[pos] || BLANK;
        }

        function writeCell(pos, symbol) {
            if (symbol === BLANK) {
                delete tape[pos];
            } else {
                tape[pos] = symbol;
            }
        }

        function touch(pos) {
            if (pos < minPos) {
                minPos = pos;
            }
            if (pos > maxPos) {
                maxPos = pos;
            }
        }

        function stopAuto() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            playBtn.classList.remove("is-on");
            playBtn.setAttribute("aria-pressed", "false");
            playBtn.textContent = "Авто";
        }

        function getDelay() {
            var value = delaySelect ? parseInt(delaySelect.value, 10) : DEFAULT_DELAY;
            return isNaN(value) || value < 50 ? DEFAULT_DELAY : value;
        }

        function setMessage(text) {
            msgEl.textContent = text;
        }

        function updateControls() {
            stepBtn.disabled = halted;
            playBtn.disabled = halted;
        }

        function updateInputHint() {
            if (!inputHint) {
                return;
            }

            var symbols = model.symbols.filter(function (symbol) {
                return symbol !== BLANK;
            });

            inputHint.textContent = symbols.length
                ? "только " + symbols.join(", ") + "; до 24 символов"
                : "пустая лента; до 24 символов";
        }

        function setInitialTape(raw) {
            initialTape = {};
            for (var i = 0; i < raw.length; i += 1) {
                initialTape[i] = raw.charAt(i);
            }
            input.value = raw;
            updateInputHint();
        }

        function buildTable() {
            var thead = table.querySelector("thead");
            var tbody = table.querySelector("tbody");

            thead.innerHTML = "";
            tbody.innerHTML = "";

            var headRow = document.createElement("tr");
            var corner = document.createElement("th");
            corner.scope = "col";
            headRow.appendChild(corner);

            model.symbols.forEach(function (symbol) {
                var th = document.createElement("th");
                var wrap = document.createElement("span");
                var name = document.createElement("span");

                th.scope = "col";
                th.setAttribute("data-mt-symbol", symbol);
                wrap.className = "mt-head";
                name.textContent = symbol;
                wrap.appendChild(name);

                if (symbol !== BLANK) {
                    var remove = document.createElement("button");
                    remove.type = "button";
                    remove.className = "mt-head-btn";
                    remove.textContent = "×";
                    remove.setAttribute("data-mt-remove-symbol", symbol);
                    remove.setAttribute("aria-label", "Удалить символ " + symbol);
                    remove.title = "Удалить символ";
                    wrap.appendChild(remove);
                }

                th.appendChild(wrap);
                headRow.appendChild(th);
            });

            thead.appendChild(headRow);

            model.states.forEach(function (stateName) {
                var row = document.createElement("tr");
                var rowHead = document.createElement("th");
                var wrap = document.createElement("span");
                var name = document.createElement("span");

                row.setAttribute("data-mt-row", stateName);
                rowHead.scope = "row";
                wrap.className = "mt-head";
                name.textContent = stateName;
                wrap.appendChild(name);

                if (stateName !== model.states[0]) {
                    var remove = document.createElement("button");
                    remove.type = "button";
                    remove.className = "mt-head-btn";
                    remove.textContent = "×";
                    remove.setAttribute("data-mt-remove-state", stateName);
                    remove.setAttribute("aria-label", "Удалить состояние " + stateName);
                    remove.title = "Удалить состояние";
                    wrap.appendChild(remove);
                }

                rowHead.appendChild(wrap);
                row.appendChild(rowHead);

                model.symbols.forEach(function (symbol) {
                    var cell = document.createElement("td");
                    var field = document.createElement("input");
                    var key = stateName + ":" + symbol;

                    cell.setAttribute("data-mt-cell", key);
                    field.type = "text";
                    field.className = "mt-cmd-input";
                    field.value = model.commands[key] || "";
                    field.placeholder = "—";
                    field.autocomplete = "off";
                    field.spellcheck = false;
                    field.setAttribute("aria-label", "Команда: состояние " + stateName + ", символ " + symbol);
                    cell.appendChild(field);
                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            });
        }

        function readTable() {
            var valid = true;

            Array.prototype.forEach.call(table.querySelectorAll(".mt-cmd-input"), function (field) {
                var cell = field.closest("td");
                var key = cell.getAttribute("data-mt-cell");
                var raw = trim(field.value);
                var parsed = raw ? parseCommand(raw, model) : null;
                var invalid = Boolean(raw) && !parsed;

                model.commands[key] = raw;
                field.classList.toggle("is-invalid", invalid);
                if (invalid) {
                    field.setAttribute("aria-invalid", "true");
                    valid = false;
                } else {
                    field.removeAttribute("aria-invalid");
                }
            });

            return valid;
        }

        function renderTape() {
            var from = minPos - 2;
            var to = maxPos + 2;

            if (to - from > 40) {
                from = Math.max(from, head - 20);
                to = Math.min(to, head + 20);
            }

            while (to - from + 1 < 11) {
                from -= 1;
                to += 1;
            }

            tapeEl.innerHTML = "";

            for (var pos = from; pos <= to; pos += 1) {
                var isHead = pos === head;
                var isStart = pos === startPos;
                var symbol = readCell(pos);
                var cell = document.createElement("button");
                var stateLabel = document.createElement("span");
                var symbolLabel = document.createElement("span");
                var aria = "Позиция " + pos + ", символ " + symbol;

                cell.type = "button";
                cell.className = "mt-cell" +
                    (isHead ? " is-head" : "") +
                    (isStart ? " is-start" : "");
                cell.setAttribute("data-pos", pos);
                if (isHead) {
                    cell.setAttribute("aria-current", "true");
                }

                if (isHead) {
                    aria += ", текущая ячейка";
                }
                if (isStart) {
                    aria += ", начальная ячейка";
                }
                aria += ". Выбрать начальную ячейку";
                cell.setAttribute("aria-label", aria);

                stateLabel.className = "mt-cell__state";
                stateLabel.textContent = isHead ? state : "";
                symbolLabel.className = "mt-cell__sym";
                symbolLabel.textContent = symbol;

                cell.appendChild(stateLabel);
                cell.appendChild(symbolLabel);
                tapeEl.appendChild(cell);
            }

            var current = tapeEl.querySelector(".mt-cell.is-head");
            if (current) {
                tapeWrap.scrollLeft = Math.max(
                    0,
                    current.offsetLeft - tapeWrap.clientWidth / 2 + current.offsetWidth / 2
                );
            }
        }

        function tapeBounds() {
            var keys = Object.keys(tape);

            if (!keys.length) {
                return null;
            }

            var min = Infinity;
            var max = -Infinity;

            keys.forEach(function (key) {
                var pos = Number(key);
                if (pos < min) {
                    min = pos;
                }
                if (pos > max) {
                    max = pos;
                }
            });

            return { min: min, max: max };
        }

        function renderStats() {
            if (!decimalEl || !countsEl || !sumsEl) {
                return;
            }

            var bounds = tapeBounds();
            var counts = {};
            var binary = null;

            model.symbols.forEach(function (symbol) {
                counts[symbol] = 0;
            });

            if (bounds) {
                var parts = [];
                var onlyBinary = true;

                for (var pos = bounds.min; pos <= bounds.max; pos += 1) {
                    var symbol = readCell(pos);
                    counts[symbol] = (counts[symbol] || 0) + 1;

                    if (symbol === "0" || symbol === "1") {
                        parts.push(symbol);
                    } else {
                        onlyBinary = false;
                    }
                }

                if (onlyBinary && parts.length) {
                    binary = parts.join("");
                }
            }

            if (binary) {
                decimalEl.textContent = parseInt(binary, 2).toString();
                if (binaryEl) {
                    binaryEl.textContent = "из " + binary + "₂";
                }
            } else {
                decimalEl.textContent = "—";
                if (binaryEl) {
                    binaryEl.textContent = bounds
                        ? "на ленте есть другие символы"
                        : "лента пуста";
                }
            }

            countsEl.innerHTML = "";

            model.symbols.forEach(function (symbol) {
                var chip = document.createElement("span");
                var name = document.createElement("span");
                var value = document.createElement("b");

                chip.className = "mt-count";
                name.className = "mt-count__sym";
                name.textContent = symbol + ":";
                value.textContent = symbol === BLANK ? "∞" : String(counts[symbol] || 0);

                if (symbol === BLANK) {
                    chip.title = "Пустых ячеек на бесконечной ленте бесконечно много";
                }

                chip.appendChild(name);
                chip.appendChild(value);
                countsEl.appendChild(chip);
            });

            var total = 0;
            model.symbols.forEach(function (symbol) {
                if (symbol !== BLANK) {
                    total += counts[symbol] || 0;
                }
            });

            var totalChip = document.createElement("span");
            totalChip.className = "mt-count mt-count--total";
            totalChip.textContent = "всего: " + total;
            countsEl.appendChild(totalChip);

            var digitSymbols = model.symbols.filter(function (symbol) {
                return /^[0-9]$/.test(symbol);
            });

            sumsEl.innerHTML = "";

            if (!digitSymbols.length) {
                sumsEl.textContent = "нет цифр";
                return;
            }

            var digitTotal = 0;

            digitSymbols.forEach(function (symbol) {
                var count = counts[symbol] || 0;
                var sum = Number(symbol) * count;
                var chip = document.createElement("span");
                var name = document.createElement("span");
                var value = document.createElement("b");

                digitTotal += sum;
                chip.className = "mt-count mt-count--sum";
                chip.title = symbol + " × " + count + " = " + sum;
                name.className = "mt-count__sym";
                name.textContent = symbol + " × " + count + " =";
                value.textContent = String(sum);
                chip.appendChild(name);
                chip.appendChild(value);
                sumsEl.appendChild(chip);
            });

            var sumChip = document.createElement("span");
            sumChip.className = "mt-count mt-count--total";
            sumChip.textContent = "сумма: " + digitTotal;
            sumsEl.appendChild(sumChip);
        }

        function renderTable() {
            var key = halted && lastKey ? lastKey : state + ":" + readCell(head);
            var colon = key.indexOf(":");
            var currentState = key.slice(0, colon);
            var currentSymbol = key.slice(colon + 1);

            Array.prototype.forEach.call(table.querySelectorAll("[data-mt-row]"), function (row) {
                row.classList.toggle("is-current", row.getAttribute("data-mt-row") === currentState);
            });

            Array.prototype.forEach.call(table.querySelectorAll("[data-mt-symbol]"), function (column) {
                column.classList.toggle("is-current", column.getAttribute("data-mt-symbol") === currentSymbol);
            });

            Array.prototype.forEach.call(table.querySelectorAll("[data-mt-cell]"), function (cell) {
                var isCurrent = cell.getAttribute("data-mt-cell") === key;
                cell.classList.toggle("is-current", isCurrent);
                if (isCurrent) {
                    cell.setAttribute("aria-current", "true");
                } else {
                    cell.removeAttribute("aria-current");
                }
            });
        }

        function render() {
            phaseEl.textContent = halted ? "остановка" : "состояние " + state;
            counterEl.textContent = pluralSteps(steps);
            renderTable();
            renderTape();
            renderStats();
            updateControls();
        }

        function initialMessage() {
            return "Головка в состоянии " + state + ", под ней " + readCell(head) +
                ". Нажмите «Шаг» или выберите начальную ячейку на ленте.";
        }

        function reset(message) {
            stopAuto();
            readTable();

            tape = copyObject(initialTape);
            head = startPos;
            state = model.states[0] || "q0";
            steps = 0;
            halted = false;
            lastKey = null;
            minPos = -2;
            maxPos = 2;

            Object.keys(initialTape).forEach(function (pos) {
                touch(Number(pos));
            });
            touch(head);

            setMessage(message || initialMessage());
            render();
        }

        function loadFromInput() {
            var raw = sanitize(input.value);
            setInitialTape(raw);
            startPos = raw.length;
            reset();
        }

        function chooseStart(pos) {
            if (pos === startPos && steps === 0 && !halted) {
                return;
            }

            startPos = pos;
            reset();
            setMessage("Начальная ячейка выбрана, лента сброшена: головка смотрит на «" + readCell(head) + "».");
        }

        function step() {
            if (halted) {
                return;
            }

            if (!readTable()) {
                stopAuto();
                setMessage("Исправьте команды, выделенные красным: формат «символ, сдвиг, состояние», например 0, L, q1.");
                return;
            }

            var symbol = readCell(head);
            var key = state + ":" + symbol;
            var raw = model.commands[key] || "";
            var command = raw ? parseCommand(raw, model) : null;

            lastKey = key;

            if (!command) {
                halted = true;
                stopAuto();
                setMessage(
                    "Для пары «" + state + ", " + symbol + "» команда не задана — " +
                    "клетка таблицы пустая, машина останавливается."
                );
                render();
                return;
            }

            var previousState = state;
            writeCell(head, command.write);
            touch(head);
            state = command.next;

            if (command.move === "L") {
                head -= 1;
            } else if (command.move === "R") {
                head += 1;
            }
            touch(head);

            steps += 1;

            if (command.move === "S") {
                halted = true;
                stopAuto();
                setMessage(
                    previousState + " видит " + symbol + " → " + formatCommand(command) +
                    ". Записан символ " + command.write + ", работа остановлена командой S."
                );
            } else {
                setMessage(
                    previousState + " видит " + symbol + " → " + formatCommand(command) +
                    ". Записан символ " + command.write + ", " + moveLabel(command.move) +
                    ", новое состояние " + command.next + "."
                );
            }

            if (!halted && steps >= MAX_STEPS) {
                halted = true;
                stopAuto();
                setMessage(
                    "Выполнено " + MAX_STEPS + " шагов — остановка для безопасности. " +
                    "Возможно, программа зациклилась."
                );
            }

            render();
        }

        function toggleAuto() {
            if (halted) {
                return;
            }

            if (timer) {
                stopAuto();
                return;
            }

            if (!readTable()) {
                setMessage("Исправьте команды, выделенные красным, перед запуском.");
                return;
            }

            playBtn.classList.add("is-on");
            playBtn.setAttribute("aria-pressed", "true");
            playBtn.textContent = "Пауза";
            timer = setInterval(step, getDelay());
        }

        function nextStateName() {
            var index = 0;
            while (model.states.indexOf("q" + index) !== -1) {
                index += 1;
            }
            return "q" + index;
        }

        function nextSymbolName() {
            var candidates = ["2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d"];
            for (var i = 0; i < candidates.length; i += 1) {
                if (model.symbols.indexOf(candidates[i]) === -1) {
                    return candidates[i];
                }
            }
            return "";
        }

        function updateNewInputs() {
            if (newStateInput) {
                newStateInput.value = nextStateName();
            }
            if (newSymbolInput) {
                newSymbolInput.value = nextSymbolName();
            }
        }

        function addState() {
            readTable();
            var name = trim(newStateInput.value);

            if (!name) {
                setMessage("Введите имя нового состояния, например q2.");
                return;
            }
            if (!/^[A-Za-zА-Яа-яЁё0-9_]+$/.test(name)) {
                setMessage("Имя состояния может содержать только буквы, цифры и подчёркивание.");
                return;
            }
            if (model.states.indexOf(name) !== -1) {
                setMessage("Состояние " + name + " уже есть в программе.");
                return;
            }

            model.states.push(name);
            buildTable();
            updateNewInputs();
            reset("Состояние " + name + " добавлено. Заполните его команды в таблице.");
        }

        function addSymbol() {
            readTable();
            var symbol = trim(newSymbolInput.value);

            if (!symbol || symbol.length !== 1) {
                setMessage("Введите один символ, например 2 или a.");
                return;
            }
            if (symbol === BLANK || /[,:\s]/.test(symbol)) {
                setMessage("Символом не могут быть λ, запятая, двоеточие или пробел.");
                return;
            }
            if (model.symbols.indexOf(symbol) !== -1) {
                setMessage("Символ " + symbol + " уже есть в алфавите.");
                return;
            }

            model.symbols.push(symbol);
            buildTable();
            updateInputHint();
            updateNewInputs();
            reset("Символ " + symbol + " добавлен. Заполните его столбец в таблице.");
        }

        function removeState(name) {
            readTable();

            if (name === model.states[0]) {
                return;
            }

            model.states = model.states.filter(function (stateName) {
                return stateName !== name;
            });

            Object.keys(model.commands).forEach(function (key) {
                var colon = key.indexOf(":");
                var raw = model.commands[key];

                if (key.slice(0, colon) === name) {
                    delete model.commands[key];
                    return;
                }
                if (!raw) {
                    return;
                }

                var parts = raw.split(",").map(trim);
                if (parts[2] === name) {
                    delete model.commands[key];
                }
            });

            buildTable();
            updateNewInputs();
            reset("Состояние " + name + " удалено вместе с командами, которые на него ссылались.");
        }

        function removeSymbol(symbol) {
            readTable();

            if (symbol === BLANK) {
                return;
            }

            model.symbols = model.symbols.filter(function (item) {
                return item !== symbol;
            });

            Object.keys(model.commands).forEach(function (key) {
                var colon = key.indexOf(":");
                var raw = model.commands[key];

                if (key.slice(colon + 1) === symbol) {
                    delete model.commands[key];
                    return;
                }
                if (!raw) {
                    return;
                }

                var parts = raw.split(",").map(trim);
                if (parts[0] === symbol) {
                    delete model.commands[key];
                }
            });

            var rawTape = sanitize(input.value);
            setInitialTape(rawTape);
            startPos = rawTape.length;
            buildTable();
            updateNewInputs();
            reset("Символ " + symbol + " удалён. Лента и команды с этим символом очищены.");
        }

        function applyPreset(name) {
            var preset = PRESETS[name];
            if (!preset) {
                return;
            }

            stopAuto();
            model.states = preset.states.slice();
            model.symbols = preset.symbols.slice();
            model.commands = copyObject(preset.commands);
            setInitialTape(preset.tape);
            startPos = preset.tape.length;
            buildTable();
            updateNewInputs();
            reset(preset.message);
        }

        function handleCommandChange(event) {
            var field = event.target.closest(".mt-cmd-input");
            if (!field) {
                return;
            }

            stopAuto();
            readTable();

            var raw = trim(field.value);
            var parsed = raw ? parseCommand(raw, model) : null;

            if (raw && parsed) {
                field.value = formatCommand(parsed);
            }

            if (!readTable()) {
                setMessage("Формат команды: «символ, сдвиг, состояние», например 0, L, q1. Выделенные клетки нужно исправить.");
                return;
            }

            reset("Программа изменена. Машина сброшена в начальное состояние.");
        }

        loadBtn.addEventListener("click", loadFromInput);
        resetBtn.addEventListener("click", function () {
            reset();
        });
        randomBtn.addEventListener("click", function () {
            input.value = randomTape(model);
            loadFromInput();
        });

        stepBtn.addEventListener("click", function () {
            stopAuto();
            step();
        });
        playBtn.addEventListener("click", toggleAuto);

        if (delaySelect) {
            delaySelect.addEventListener("change", function () {
                if (timer) {
                    clearInterval(timer);
                    timer = setInterval(step, getDelay());
                }
            });
        }

        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                loadFromInput();
            }
        });

        tapeEl.addEventListener("click", function (event) {
            var cell = event.target.closest(".mt-cell");
            if (cell) {
                chooseStart(parseInt(cell.getAttribute("data-pos"), 10));
            }
        });

        table.addEventListener("click", function (event) {
            var removeStateBtn = event.target.closest("[data-mt-remove-state]");
            var removeSymbolBtn = event.target.closest("[data-mt-remove-symbol]");

            if (removeStateBtn) {
                removeState(removeStateBtn.getAttribute("data-mt-remove-state"));
            } else if (removeSymbolBtn) {
                removeSymbol(removeSymbolBtn.getAttribute("data-mt-remove-symbol"));
            }
        });

        table.addEventListener("change", handleCommandChange);

        table.addEventListener("input", function (event) {
            var field = event.target.closest(".mt-cmd-input");
            if (field) {
                field.classList.remove("is-invalid");
                field.removeAttribute("aria-invalid");
            }
        });

        table.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && event.target.closest(".mt-cmd-input")) {
                event.preventDefault();
                event.target.blur();
            }
        });

        if (addStateBtn) {
            addStateBtn.addEventListener("click", addState);
        }
        if (addSymbolBtn) {
            addSymbolBtn.addEventListener("click", addSymbol);
        }
        if (newStateInput) {
            newStateInput.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    addState();
                }
            });
        }
        if (newSymbolInput) {
            newSymbolInput.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    addSymbol();
                }
            });
        }

        Array.prototype.forEach.call(root.querySelectorAll("[data-mt-preset]"), function (button) {
            button.addEventListener("click", function () {
                applyPreset(button.getAttribute("data-mt-preset"));
            });
        });

        applyPreset("2026");
    }

    document.querySelectorAll('[data-widget="turing"]').forEach(init);
})();
