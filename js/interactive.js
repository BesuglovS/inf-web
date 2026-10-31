/**
 * Интерактив страниц занятий: карточки терминов и квиз.
 *
 * Без зависимостей и без запросов к серверу: результат квиза хранится
 * в localStorage под ключом inf-web-quiz.
 */
(function () {
    "use strict";

    var STORE_KEY = "inf-web-quiz";

    function readStore() {
        try {
            return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        } catch (error) {
            return {};
        }
    }

    function writeStore(data) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(data));
        } catch (error) {
            /* приватный режим — просто не сохраняем */
        }
    }

    /* ── Карточки терминов ─────────────────────────────────────────────── */

    document.querySelectorAll(".cards").forEach(function (list) {
        list.addEventListener("click", function (event) {
            var card = event.target.closest(".card");
            if (!card) {
                return;
            }
            var open = card.classList.toggle("is-open");
            card.setAttribute("aria-pressed", String(open));
        });

        list.addEventListener("keydown", function (event) {
            if (event.key !== " " && event.key !== "Enter") {
                return;
            }
            var card = event.target.closest(".card");
            if (card) {
                event.preventDefault();
                card.click();
            }
        });
    });

    /* ── Квиз ──────────────────────────────────────────────────────────── */

    function initQuiz(root) {
        var id = root.getAttribute("data-quiz");
        var items = Array.prototype.slice.call(root.querySelectorAll(".quiz__item"));
        var scoreEl = root.querySelector(".quiz__score");
        var barEl = root.querySelector(".quiz__bar span");
        var resetBtn = root.querySelector(".quiz__reset");
        var store = readStore();
        var state = store[id] || {};

        function render() {
            var answered = 0;
            var right = 0;

            items.forEach(function (item, index) {
                var answer = parseInt(item.getAttribute("data-answer"), 10);
                var picked = state[index];
                var why = item.querySelector(".quiz__why");
                var buttons = item.querySelectorAll(".quiz__opt");

                item.classList.remove("is-right", "is-wrong");

                buttons.forEach(function (button) {
                    button.classList.remove("is-picked", "is-correct");
                    button.setAttribute("aria-pressed", "false");
                    button.disabled = picked !== undefined;
                });

                if (picked === undefined) {
                    if (why) {
                        why.hidden = true;
                    }
                    return;
                }

                answered++;

                var pickedBtn = item.querySelector('.quiz__opt[data-opt="' + picked + '"]');
                var rightBtn = item.querySelector('.quiz__opt[data-opt="' + answer + '"]');

                if (pickedBtn) {
                    pickedBtn.classList.add("is-picked");
                    pickedBtn.setAttribute("aria-pressed", "true");
                }
                if (rightBtn) {
                    rightBtn.classList.add("is-correct");
                }

                item.classList.add(picked === answer ? "is-right" : "is-wrong");
                if (picked === answer) {
                    right++;
                }
                if (why) {
                    why.hidden = false;
                }
            });

            if (scoreEl) {
                scoreEl.textContent = right + " из " + items.length;
            }
            if (barEl) {
                barEl.style.width = (items.length ? Math.round(answered / items.length * 100) : 0) + "%";
            }
        }

        root.addEventListener("click", function (event) {
            var button = event.target.closest(".quiz__opt");
            if (!button || button.disabled) {
                return;
            }

            var item = button.closest(".quiz__item");
            var index = items.indexOf(item);
            if (index < 0 || state[index] !== undefined) {
                return;
            }

            state[index] = parseInt(button.getAttribute("data-opt"), 10);

            var saved = readStore();
            saved[id] = state;
            writeStore(saved);

            render();
        });

        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                state = {};
                var saved = readStore();
                delete saved[id];
                writeStore(saved);
                render();
            });
        }

        render();
    }

    /* ── Интерактивные модели ──────────────────────────────────────────── */

    /* Восемь бит: десятичное и шестнадцатеричное значение. */
    document.querySelectorAll('[data-widget="bits"]').forEach(function (root) {
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".bit"));
        var bits = buttons.map(function () { return 0; });

        function update() {
            var value = 0;
            buttons.forEach(function (button, index) {
                var weight = Math.pow(2, buttons.length - 1 - index);
                value += bits[index] * weight;
                button.textContent = bits[index];
                button.setAttribute("aria-pressed", String(Boolean(bits[index])));
                button.classList.toggle("is-on", Boolean(bits[index]));
            });
            root.querySelector('[data-out="dec"]').textContent = value;
            root.querySelector('[data-out="hex"]').textContent = value.toString(16).toUpperCase().padStart(2, "0");
        }

        root.addEventListener("click", function (event) {
            var button = event.target.closest(".bit");
            if (!button) {
                return;
            }
            var index = buttons.indexOf(button);
            if (index >= 0) {
                bits[index] = bits[index] ? 0 : 1;
                update();
            }
        });

        update();
    });

    /* Четырёхбитный сумматор: два числа, сумма и переполнение. */
    document.querySelectorAll('[data-widget="adder"]').forEach(function (root) {
        var rows = { a: [0, 0, 0, 0], b: [0, 0, 0, 0] };
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".bit"));

        function value(list) {
            return list.reduce(function (acc, bit) { return acc * 2 + bit; }, 0);
        }

        function update() {
            buttons.forEach(function (button) {
                var row = button.getAttribute("data-row");
                var index = parseInt(button.getAttribute("data-idx"), 10);
                var bit = rows[row][index];
                button.textContent = bit;
                button.setAttribute("aria-pressed", String(Boolean(bit)));
                button.classList.toggle("is-on", Boolean(bit));
            });

            var sum = value(rows.a) + value(rows.b);
            root.querySelector('[data-out="sum"]').textContent = sum;
            root.querySelector('[data-out="bin"]').textContent = sum.toString(2).padStart(5, "0");
            root.querySelector('[data-out="flags"]').textContent = sum > 15 ? "· переполнение четырёх бит" : "";
        }

        root.addEventListener("click", function (event) {
            var button = event.target.closest(".bit");
            if (!button) {
                return;
            }
            var row = button.getAttribute("data-row");
            var index = parseInt(button.getAttribute("data-idx"), 10);
            rows[row][index] = rows[row][index] ? 0 : 1;
            update();
        });

        update();
    });

    /* Групповое кодирование строки. */
    document.querySelectorAll('[data-widget="rle"]').forEach(function (root) {
        var input = root.querySelector("input");

        function compress() {
            var text = (input.value || "").toUpperCase().replace(/[^0-9A-ZА-ЯЁ ]/g, "").slice(0, 40);
            var result = "";
            var i = 0;

            while (i < text.length) {
                var symbol = text[i];
                var count = 1;
                while (i + count < text.length && text[i + count] === symbol) {
                    count++;
                }
                result += count + symbol;
                i += count;
            }

            root.querySelector('[data-out="rle"]').textContent = result || "—";
            root.querySelector('[data-out="ratio"]').textContent = text.length
                ? "· " + Math.round(result.length / text.length * 100) + " % от исходной длины"
                : "";
        }

        input.addEventListener("input", compress);
        var button = root.querySelector(".widget__btn");
        if (button) {
            button.addEventListener("click", compress);
        }

        compress();
    });

    /* Интерактивные схемы: лампа и транзистор. */
    document.querySelectorAll('[data-widget="lamp"], [data-widget="transistor"]').forEach(function (root) {
        var widget = root.getAttribute("data-widget");
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".switch"));
        var out = root.querySelector("[data-out]");
        var messages = {
            lamp: {
                open: "Сетка открыта: электроны летят от катода к аноду.",
                closed: "Сетка закрыта: отрицательное напряжение перекрывает поток электронов."
            },
            transistor: {
                closed: "Тока базы нет: транзистор закрыт, ток коллектор — эмиттер не идёт.",
                open: "Ток базы открывает транзистор: через коллектор и эмиттер идёт большой ток."
            }
        };
        var state = root.getAttribute("data-state") || "open";

        function setState(next) {
            state = next;
            root.setAttribute("data-state", state);
            buttons.forEach(function (button) {
                var active = button.getAttribute("data-state") === state;
                button.classList.toggle("is-on", active);
                button.setAttribute("aria-pressed", String(active));
            });
            if (out && messages[widget] && messages[widget][state]) {
                out.textContent = messages[widget][state];
            }
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                setState(button.getAttribute("data-state"));
            });
        });

        setState(state);
    });

    /* Логические элементы на транзисторах. */
    document.querySelectorAll(".logic-circuit").forEach(function (root) {
        var op = root.getAttribute("data-logic");
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".switch, .xor-switch"));
        var out = root.querySelector("[data-out]");
        var rows = Array.prototype.slice.call(root.querySelectorAll("tr[data-row]"));
        var state = { a: 0, b: 0 };

        function result() {
            if (op === "not") {
                return state.a ? 0 : 1;
            }
            if (op === "or") {
                return state.a || state.b ? 1 : 0;
            }
            if (op === "xor") {
                return state.a !== state.b ? 1 : 0;
            }
            return state.a && state.b ? 1 : 0;
        }

        function update() {
            var value = result();
            root.setAttribute("data-a", state.a);
            root.setAttribute("data-b", state.b);
            root.setAttribute("data-out", value);
            if (out) {
                out.textContent = value;
            }

            if (op === "xor") {
                var orValue = state.a || state.b ? 1 : 0;
                var andValue = state.a && state.b ? 1 : 0;
                var notValue = andValue ? 0 : 1;
                root.setAttribute("data-or", orValue);
                root.setAttribute("data-and", andValue);
                root.setAttribute("data-not", notValue);
                root.querySelectorAll('[data-signal="or"]').forEach(function (node) {
                    node.textContent = orValue;
                });
                root.querySelectorAll('[data-signal="and"]').forEach(function (node) {
                    node.textContent = andValue;
                });
                root.querySelectorAll('[data-signal="not"]').forEach(function (node) {
                    node.textContent = notValue;
                });
            }

            buttons.forEach(function (button) {
                var key = button.getAttribute("data-input");
                var active = state[key] === 1;
                button.classList.toggle("is-on", active);
                button.setAttribute("aria-pressed", String(active));
                var label = button.querySelector(".xor-switch__label");
                if (label) {
                    label.textContent = key.toUpperCase() + " = " + state[key];
                } else {
                    button.textContent = key.toUpperCase() + " = " + state[key];
                }
            });

            var combo = op === "not" ? String(state.a) : String(state.a) + String(state.b);
            rows.forEach(function (row) {
                row.classList.toggle("is-active", row.getAttribute("data-row") === combo);
            });
        }

        function toggle(button) {
            var key = button.getAttribute("data-input");
            state[key] = state[key] ? 0 : 1;
            update();
        }

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                toggle(button);
            });

            if (button.classList.contains("xor-switch")) {
                button.addEventListener("keydown", function (event) {
                    if (event.key === " " || event.key === "Enter") {
                        event.preventDefault();
                        toggle(button);
                    }
                });
            }
        });

        rows.forEach(function (row) {
            var combo = row.getAttribute("data-row");
            if (combo === null) {
                return;
            }
            row.setAttribute("tabindex", "0");
            row.setAttribute("title", "Переключить схему в это состояние");

            function applyRow() {
                if (op === "not") {
                    state.a = combo === "1" ? 1 : 0;
                    state.b = 0;
                } else {
                    state.a = combo.charAt(0) === "1" ? 1 : 0;
                    state.b = combo.charAt(1) === "1" ? 1 : 0;
                }
                update();
            }

            row.addEventListener("click", applyRow);
            row.addEventListener("keydown", function (event) {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    applyRow();
                }
            });
        });

        update();
    });

    document.querySelectorAll(".quiz").forEach(initQuiz);
})();
