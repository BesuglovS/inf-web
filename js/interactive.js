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

    /* Восемь бит: десятичное, восьмеричное и шестнадцатеричное значение. */
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

            var octal = value.toString(8).padStart(3, "0");
            var hex = value.toString(16).toUpperCase().padStart(2, "0");
            root.querySelector('[data-out="dec"]').textContent = value;
            root.querySelector('[data-out="oct"]').textContent = octal;
            root.querySelector('[data-out="hex"]').textContent = hex;

            root.querySelectorAll("[data-oct-group]").forEach(function (node, index) {
                node.textContent = octal.charAt(index);
            });
            root.querySelectorAll("[data-hex-group]").forEach(function (node, index) {
                node.textContent = hex.charAt(index);
            });
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
    function readUint32(bits) {
        var value = 0;
        for (var i = 0; i < 32; i += 1) {
            if (bits[i]) {
                value += Math.pow(2, i);
            }
        }
        return value;
    }

    function writeUint32(bits, value) {
        for (var i = 0; i < 32; i += 1) {
            bits[i] = Math.floor(value / Math.pow(2, i)) % 2;
        }
    }

    function paintBitButtons(buttons, bits) {
        buttons.forEach(function (button) {
            var index = parseInt(button.getAttribute("data-bit"), 10);
            var on = bits[index] ? 1 : 0;
            button.textContent = on;
            button.setAttribute("aria-pressed", on ? "true" : "false");
            button.setAttribute("aria-label", "Бит " + index);
            button.classList.toggle("is-on", Boolean(on));
        });
    }

    /* 32-битное целое в дополнительном коде. */
    document.querySelectorAll('[data-widget="int32"]').forEach(function (root) {
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".bit[data-bit]"));
        var bits = [];
        var input = root.querySelector("[data-int32-input]");
        var error = root.querySelector("[data-int32-error]");
        var signedOut = root.querySelector("[data-int32-signed]");
        var unsignedOut = root.querySelector("[data-int32-unsigned]");
        var hexOut = root.querySelector("[data-int32-hex]");

        for (var i = 0; i < 32; i += 1) {
            bits[i] = 0;
        }

        function paint(syncInput) {
            paintBitButtons(buttons, bits);
            var unsigned = readUint32(bits);
            var signed = unsigned >= 2147483648 ? unsigned - 4294967296 : unsigned;
            signedOut.textContent = String(signed);
            unsignedOut.textContent = String(unsigned);
            hexOut.textContent = "0x" + unsigned.toString(16).toUpperCase().padStart(8, "0");
            if (syncInput) {
                input.value = String(signed);
            }
        }

        function setFromNumber(value, syncInput) {
            writeUint32(bits, value >>> 0);
            error.textContent = "";
            paint(syncInput);
        }

        function applyInput(showError, syncInput) {
            var raw = input.value.trim();
            if (!raw) {
                if (showError) {
                    error.textContent = "Введите целое число.";
                }
                return;
            }

            var value = Number(raw);
            if (!Number.isFinite(value) || !Number.isInteger(value) ||
                value < -2147483648 || value > 2147483647) {
                if (showError) {
                    error.textContent = "Нужно целое от −2 147 483 648 до 2 147 483 647.";
                }
                return;
            }

            setFromNumber(value, syncInput);
        }

        root.addEventListener("click", function (event) {
            var bit = event.target.closest(".bit[data-bit]");
            if (bit) {
                var index = parseInt(bit.getAttribute("data-bit"), 10);
                bits[index] = bits[index] ? 0 : 1;
                error.textContent = "";
                paint(true);
                return;
            }

            if (event.target.closest("[data-int32-apply]")) {
                applyInput(true, true);
                return;
            }

            if (event.target.closest("[data-int32-reset]")) {
                input.value = "0";
                setFromNumber(0, true);
            }
        });

        input.addEventListener("input", function () {
            applyInput(false, false);
        });

        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                applyInput(true, true);
            }
        });

        applyInput(true, false);
    });

    /* Число одинарной точности binary32 (IEEE 754). */
    document.querySelectorAll('[data-widget="float32"]').forEach(function (root) {
        var buttons = Array.prototype.slice.call(root.querySelectorAll(".bit[data-bit]"));
        var bits = [];
        var buffer = new ArrayBuffer(4);
        var view = new DataView(buffer);
        var input = root.querySelector("[data-float32-input]");
        var error = root.querySelector("[data-float32-error]");
        var hexOut = root.querySelector("[data-float32-hex]");
        var valueOut = root.querySelector("[data-float32-value]");
        var signOut = root.querySelector("[data-float32-sign]");
        var expOut = root.querySelector("[data-float32-exp]");
        var mantOut = root.querySelector("[data-float32-mant]");
        var formulaOut = root.querySelector("[data-float32-formula]");

        for (var i = 0; i < 32; i += 1) {
            bits[i] = 0;
        }

        function valueFromBits() {
            view.setUint32(0, readUint32(bits), false);
            return view.getFloat32(0, false);
        }

        function setBitsFromValue(value) {
            view.setFloat32(0, value, false);
            writeUint32(bits, view.getUint32(0, false));
        }

        function groupBits(value) {
            return value.replace(/(.{4})(?=.)/g, "$1 ");
        }

        function formatValue(value) {
            if (Number.isNaN(value)) {
                return "NaN";
            }
            if (!Number.isFinite(value)) {
                return value > 0 ? "∞" : "−∞";
            }
            if (value === 0) {
                return Object.is(value, -0) ? "−0" : "0";
            }
            var abs = Math.abs(value);
            if (abs >= 1e7 || abs < 1e-4) {
                return value.toExponential(8);
            }
            return String(Number(value.toPrecision(9)));
        }

        function formatInput(value) {
            if (Number.isNaN(value)) {
                return "NaN";
            }
            if (!Number.isFinite(value)) {
                return value > 0 ? "Infinity" : "-Infinity";
            }
            if (value === 0) {
                return Object.is(value, -0) ? "-0" : "0";
            }
            var abs = Math.abs(value);
            if (abs >= 1e7 || abs < 1e-4) {
                return value.toExponential(8);
            }
            return String(Number(value.toPrecision(9)));
        }

        function paint(syncInput) {
            paintBitButtons(buttons, bits);
            var unsigned = readUint32(bits);
            var sign = bits[31] ? 1 : 0;
            var exponent = (unsigned >>> 23) & 255;
            var mantissa = unsigned & 0x7FFFFF;
            var value = valueFromBits();
            var mantissaBits = "";

            for (var i = 22; i >= 0; i -= 1) {
                mantissaBits += bits[i] ? "1" : "0";
            }

            var groupedMantissa = groupBits(mantissaBits);
            hexOut.textContent = "0x" + unsigned.toString(16).toUpperCase().padStart(8, "0");
            valueOut.textContent = formatValue(value);
            signOut.textContent = sign ? "1 — отрицательное" : "0 — положительное";

            if (exponent === 0) {
                expOut.textContent = mantissa === 0 ? "0 — ноль" : "0 — субнормальное (2^-126)";
                mantOut.textContent = mantissa === 0 ? "0" : "0." + groupedMantissa + "₂";
                formulaOut.textContent = mantissa === 0
                    ? (sign ? "−0" : "+0")
                    : "(−1)^" + sign + " × (0 + 0." + groupedMantissa + "₂) × 2^-126";
            } else if (exponent === 255) {
                expOut.textContent = "255 — специальное значение";
                mantOut.textContent = groupedMantissa + "₂";
                formulaOut.textContent = mantissa === 0 ? (sign ? "−∞" : "+∞") : "NaN";
            } else {
                expOut.textContent = exponent + " − 127 = " + (exponent - 127);
                mantOut.textContent = "1 + 0." + groupedMantissa + "₂ = 1." + groupedMantissa + "₂";
                formulaOut.textContent = "(−1)^" + sign + " × (1 + 0." + groupedMantissa + "₂) × 2^" + (exponent - 127);
            }

            if (syncInput) {
                input.value = formatInput(value);
            }
        }

        function setFromValue(value, syncInput) {
            setBitsFromValue(value);
            error.textContent = "";
            paint(syncInput);
        }

        function applyInput(showError, syncInput) {
            var raw = input.value.replace(/\s+/g, "").replace(/[−–]/g, "-").replace(",", ".");
            if (!raw) {
                if (showError) {
                    error.textContent = "Введите число.";
                }
                return;
            }

            var lower = raw.toLowerCase();
            var value;

            if (lower === "nan") {
                value = NaN;
            } else if (lower === "infinity" || lower === "+infinity" || lower === "∞" || lower === "+∞") {
                value = Infinity;
            } else if (lower === "-infinity" || lower === "-∞") {
                value = -Infinity;
            } else {
                value = Number(raw);
                if (!Number.isFinite(value)) {
                    if (showError) {
                        error.textContent = "Введите число, например 0,1 или -12,5.";
                    }
                    return;
                }
            }

            setFromValue(value, syncInput);
        }

        root.addEventListener("click", function (event) {
            var bit = event.target.closest(".bit[data-bit]");
            if (bit) {
                var index = parseInt(bit.getAttribute("data-bit"), 10);
                bits[index] = bits[index] ? 0 : 1;
                error.textContent = "";
                paint(true);
                return;
            }

            if (event.target.closest("[data-float32-apply]")) {
                applyInput(true, true);
                return;
            }

            if (event.target.closest("[data-float32-reset]")) {
                input.value = "0";
                setFromValue(0, true);
            }
        });

        input.addEventListener("input", function () {
            applyInput(false, false);
        });

        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                applyInput(true, true);
            }
        });

        applyInput(true, false);
    });

    /* Логические схемы хранения бита: дискретные электроны и обратная связь. */
    document.querySelectorAll('[data-widget="bitcell"]').forEach(function (root) {
        var mode = root.getAttribute("data-mode");
        var specs = {
            zero: {
                gates: [{ type: "and", inputs: ["in", "loop"], out: "out" }],
                sources: [{ key: "in", toggle: "r" }],
                forks: [{ input: "out", outputs: ["q", "loop"] }],
                feedback: ["loop"],
                sink: "q"
            },
            one: {
                gates: [{ type: "or", inputs: ["in", "loop"], out: "out" }],
                sources: [{ key: "in", toggle: "s" }],
                forks: [{ input: "out", outputs: ["q", "loop"] }],
                feedback: ["loop"],
                sink: "q"
            },
            latch: {
                gates: [
                    { type: "or", inputs: ["s", "loop"], out: "orOut" },
                    { type: "not", inputs: ["r"], out: "notOut" },
                    { type: "and", inputs: ["orOut", "notOut"], out: "andOut" }
                ],
                sources: [{ key: "s", toggle: "s" }, { key: "r", toggle: "r" }],
                forks: [{ input: "andOut", outputs: ["q", "loop"] }],
                feedback: ["loop"],
                sink: "q"
            },
            gated: {
                gates: [
                    { type: "and", inputs: ["dataTop", "weTop"], out: "sOut" },
                    { type: "not", inputs: ["dataNot"], out: "notData" },
                    { type: "and", inputs: ["notData", "weBottom"], out: "rOut" },
                    { type: "not", inputs: ["rOut"], out: "notR" },
                    { type: "or", inputs: ["sOut", "loop"], out: "orOut" },
                    { type: "and", inputs: ["orOut", "notR"], out: "andOut" }
                ],
                sources: [{ key: "data", toggle: "d" }, { key: "we", toggle: "we" }],
                forks: [
                    { input: "data", outputs: ["dataTop", "dataNot"] },
                    { input: "we", outputs: ["weTop", "weBottom"] },
                    { input: "andOut", outputs: ["q", "loop"] }
                ],
                feedback: ["loop"],
                sink: "q"
            }
        };
        var spec = specs[mode];

        if (!spec) {
            return;
        }

        var seeded = mode === "zero";
        var svg = root.querySelector("svg");
        var layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        layer.setAttribute("class", "bitcell-particle-layer");
        svg.appendChild(layer);

        // Широкие схемы с длинной петлёй: вдвое быстрее, но с тем же шагом.
        var wide = mode === "latch" || mode === "gated";
        var timing = wide
            ? { speed: 65, period: 0.68, activity: 0.9, hold: 0.9 }
            : { speed: 32.5, period: 1.36, activity: 1.8, hold: 1.8 };
        var SPEED = timing.speed;
        var SOURCE_PERIOD = timing.period;
        var GATE_PERIOD = timing.period;
        var ACTIVITY = timing.activity;
        var Q_HOLD = timing.hold;

        var edgeKeys = [];
        var edges = {};
        var feedback = {};
        var destinations = {};

        function useEdge(key) {
            if (edgeKeys.indexOf(key) === -1) {
                edgeKeys.push(key);
            }
        }

        spec.gates.forEach(function (gate, gateIndex) {
            gate.inputs.forEach(function (key, inputIndex) {
                useEdge(key);
                destinations[key] = { gate: gateIndex, input: inputIndex };
            });
            useEdge(gate.out);
        });
        spec.forks.forEach(function (fork, forkIndex) {
            useEdge(fork.input);
            destinations[fork.input] = { fork: forkIndex };
            fork.outputs.forEach(function (key) {
                useEdge(key);
            });
        });
        (spec.feedback || []).forEach(function (key) {
            feedback[key] = true;
        });
        useEdge(spec.sink);
        destinations[spec.sink] = { sink: true };

        edgeKeys.forEach(function (key) {
            var path = root.querySelector('[data-edge="' + key + '"]');
            if (path) {
                edges[key] = { path: path, length: path.getTotalLength() };
            }
        });

        var gateLast = spec.gates.map(function (gate) {
            return gate.inputs.map(function () {
                return -Infinity;
            });
        });
        var gateAcc = spec.gates.map(function () {
            return GATE_PERIOD;
        });

        var electrons = [];
        var clock = 0;
        var sourceAcc = {};
        var qLast = -Infinity;
        var state = { s: 0, r: 0, d: 0, we: 0 };
        var q = seeded ? 1 : 0;

        spec.sources.forEach(function (source) {
            sourceAcc[source.key] = SOURCE_PERIOD;
        });

        if (mode === "zero") {
            state.r = 1;
        }

        var qOut = root.querySelector("[data-bitcell-q]");
        var graphQ = root.querySelector("[data-bitcell-graph-q]");
        var stateOut = root.querySelector("[data-bitcell-state]");
        var toggles = Array.prototype.slice.call(root.querySelectorAll("[data-bitcell-toggle]"));

        function sourceOn(source) {
            return state[source.toggle] === 1;
        }

        function place(electron) {
            var point = edges[electron.key].path.getPointAtLength(electron.dist);
            electron.element.setAttribute("cx", point.x);
            electron.element.setAttribute("cy", point.y);
        }

        function addElectron(key, distance) {
            if (!edges[key]) {
                return null;
            }
            var element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            element.setAttribute("class", "bitcell-particle");
            element.setAttribute("data-path", key);
            element.setAttribute("r", 4);
            layer.appendChild(element);
            var electron = { key: key, dist: distance || 0, element: element };
            place(electron);
            electrons.push(electron);
            return electron;
        }

        function dropElectron(electron) {
            electron.element.remove();
            var index = electrons.indexOf(electron);
            if (index !== -1) {
                electrons.splice(index, 1);
            }
        }

        function countElectrons() {
            var result = {};
            edgeKeys.forEach(function (key) {
                result[key] = 0;
            });
            electrons.forEach(function (electron) {
                result[electron.key] += 1;
            });
            return result;
        }

        function render() {
            var on = spec.sources.some(sourceOn);

            root.setAttribute("data-q", String(q));
            root.setAttribute("data-hold", q === 1 ? "1" : "0");
            root.setAttribute("data-write", (mode === "latch" ? (state.s || state.r)
                : mode === "gated" ? state.we
                    : (on && (mode === "one" || q === 0))) ? "1" : "0");
            root.setAttribute("data-s", String(state.s));
            root.setAttribute("data-r", String(state.r));

            if (qOut) {
                qOut.textContent = q;
            }
            if (graphQ) {
                graphQ.textContent = q;
            }
            if (stateOut) {
                if (mode === "latch") {
                    stateOut.textContent = state.s ? "запись 1" : state.r ? (q ? "хранение 1" : "сброс") : q ? "хранение 1" : "хранение 0";
                } else if (mode === "gated") {
                    stateOut.textContent = state.we ? (q ? "запись 1" : "запись 0") : (q ? "хранение 1" : "хранение 0");
                } else if (mode === "one") {
                    stateOut.textContent = on ? "запись" : q ? "хранение" : "нет потока";
                } else {
                    stateOut.textContent = q ? "хранение" : on ? "вход без выхода" : "нет потока";
                }
            }

            toggles.forEach(function (button) {
                var key = button.getAttribute("data-bitcell-toggle");
                var value = state[key];
                button.textContent = key.toUpperCase() + " = " + value;
                button.classList.toggle("is-on", value === 1);
                button.setAttribute("aria-pressed", String(value === 1));
            });
        }

        function inputActive(gateIndex, inputIndex, key, live) {
            // Обратная связь — это уже накопленный в петле поток: пока в ней есть
            // электроны, вход считается принимающим. Остальные входы ждут прихода.
            if (feedback[key] && live[key] > 0) {
                return true;
            }
            return clock - gateLast[gateIndex][inputIndex] < ACTIVITY;
        }

        function step(dt) {
            clock += dt;

            // Первичные источники: только начала проводов S и R.
            spec.sources.forEach(function (source) {
                if (sourceOn(source)) {
                    sourceAcc[source.key] += dt;
                    if (sourceAcc[source.key] >= SOURCE_PERIOD) {
                        sourceAcc[source.key] -= SOURCE_PERIOD;
                        addElectron(source.key, 0);
                    }
                } else {
                    sourceAcc[source.key] = SOURCE_PERIOD;
                }
            });

            // Движение. На конце провода электрон поглощается входом элемента,
            // делится на развилке или уходит в выходную шину.
            electrons.slice().forEach(function (electron) {
                var edge = edges[electron.key];
                electron.dist += SPEED * dt;

                if (electron.dist < edge.length) {
                    place(electron);
                    return;
                }

                dropElectron(electron);
                var destination = destinations[electron.key];

                if (!destination) {
                    return;
                }
                if (destination.gate !== undefined) {
                    gateLast[destination.gate][destination.input] = clock;
                } else if (destination.fork !== undefined) {
                    spec.forks[destination.fork].outputs.forEach(function (key) {
                        addElectron(key, 0);
                    });
                } else if (destination.sink) {
                    qLast = clock;
                }
            });

            var live = countElectrons();

            // Элементы пропускают электроны, пока выполняется их условие по входам.
            spec.gates.forEach(function (gate, gateIndex) {
                var active = gate.inputs.map(function (key, inputIndex) {
                    return inputActive(gateIndex, inputIndex, key, live);
                });
                var open;

                if (gate.type === "or") {
                    open = active.some(Boolean);
                } else if (gate.type === "and") {
                    open = active.every(Boolean);
                } else {
                    open = !active.some(Boolean);
                }

                if (open) {
                    gateAcc[gateIndex] += dt;
                    if (gateAcc[gateIndex] >= GATE_PERIOD) {
                        gateAcc[gateIndex] -= GATE_PERIOD;
                        addElectron(gate.out, 0);
                    }
                } else {
                    gateAcc[gateIndex] = GATE_PERIOD;
                }
            });

            var nextQ = clock - qLast < Q_HOLD || live[spec.sink] > 0 ? 1 : 0;
            if (nextQ !== q) {
                q = nextQ;
                render();
            }

            live = countElectrons();
            edgeKeys.forEach(function (key) {
                if (edges[key]) {
                    edges[key].path.classList.toggle("is-live", live[key] > 0);
                }
            });
        }

        toggles.forEach(function (button) {
            button.addEventListener("click", function () {
                var key = button.getAttribute("data-bitcell-toggle");
                state[key] = state[key] ? 0 : 1;
                spec.sources.forEach(function (source) {
                    if (source.toggle === key) {
                        sourceAcc[source.key] = SOURCE_PERIOD;
                    }
                });
                render();
            });
        });

        // AND-ячейка стартует заполненной: она уже хранит единицу.
        if (seeded) {
            var stepDistance = SPEED * SOURCE_PERIOD;
            edgeKeys.forEach(function (key) {
                var edge = edges[key];
                if (!edge) {
                    return;
                }
                for (var distance = 0; distance < edge.length; distance += stepDistance) {
                    addElectron(key, distance);
                }
            });
            gateLast = spec.gates.map(function (gate) {
                return gate.inputs.map(function () {
                    return 0;
                });
            });
            qLast = 0;
        }

        var lastFrame = 0;

        function frame(timestamp) {
            if (!lastFrame) {
                lastFrame = timestamp;
            }
            var dt = Math.min((timestamp - lastFrame) / 1000, 0.1);
            lastFrame = timestamp;
            step(dt);
            requestAnimationFrame(frame);
        }

        render();
        requestAnimationFrame(frame);
    });

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

            var aValue = value(rows.a);
            var bValue = value(rows.b);
            var sum = aValue + bValue;
            var bin = sum.toString(2).padStart(5, "0");
            var carry = 0;
            var carries = { 1: 0, 2: 0, 3: 0, 4: 0 };

            for (var i = 3; i >= 0; i -= 1) {
                var total = rows.a[i] + rows.b[i] + carry;
                carry = total > 1 ? 1 : 0;
                if (i === 3) {
                    carries[1] = carry;
                } else if (i === 2) {
                    carries[2] = carry;
                } else if (i === 1) {
                    carries[3] = carry;
                } else {
                    carries[4] = carry;
                }
            }

            root.querySelectorAll("[data-carry]").forEach(function (cell) {
                var position = cell.getAttribute("data-carry");
                var bit = carries[position] || 0;
                cell.textContent = bit;
                cell.classList.toggle("is-one", Boolean(bit));
            });

            root.querySelectorAll("[data-sum]").forEach(function (cell, index) {
                var bit = bin.charAt(index);
                cell.textContent = bit;
                cell.classList.toggle("is-one", bit === "1");
            });

            root.querySelector('[data-dec="a"]').textContent = aValue;
            root.querySelector('[data-dec="b"]').textContent = bValue;
            root.querySelector('[data-dec="sum"]').textContent = sum;
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
        var outCarry = root.querySelector('[data-out="carry"]');
        var rows = Array.prototype.slice.call(root.querySelectorAll("tr[data-row]"));
        var state = { a: 0, b: 0, cin: 0 };

        function result() {
            if (op === "not") {
                return state.a ? 0 : 1;
            }
            if (op === "or") {
                return state.a || state.b ? 1 : 0;
            }
            if (op === "xor" || op === "half") {
                return state.a !== state.b ? 1 : 0;
            }
            if (op === "full") {
                return (state.a !== state.b) !== Boolean(state.cin) ? 1 : 0;
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

            if (op === "half") {
                var carry = state.a && state.b ? 1 : 0;
                root.setAttribute("data-sum", value);
                root.setAttribute("data-carry", carry);
                if (outCarry) {
                    outCarry.textContent = carry;
                }
            }

            if (op === "full") {
                var s1 = state.a !== state.b ? 1 : 0;
                var c1 = state.a && state.b ? 1 : 0;
                var c2 = s1 && state.cin ? 1 : 0;
                var carry = c1 || c2 ? 1 : 0;
                root.setAttribute("data-cin", state.cin);
                root.setAttribute("data-s1", s1);
                root.setAttribute("data-c1", c1);
                root.setAttribute("data-c2", c2);
                root.setAttribute("data-sum", value);
                root.setAttribute("data-carry", carry);
                if (outCarry) {
                    outCarry.textContent = carry;
                }
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
                var keyLabel = key.length > 1 ? key.charAt(0).toUpperCase() + key.slice(1) : key.toUpperCase();
                var active = state[key] === 1;
                button.classList.toggle("is-on", active);
                button.setAttribute("aria-pressed", String(active));
                var label = button.querySelector(".xor-switch__label");
                if (label) {
                    label.textContent = keyLabel + " = " + state[key];
                } else {
                    button.textContent = keyLabel + " = " + state[key];
                }
            });

            var combo = op === "not"
                ? String(state.a)
                : op === "full"
                    ? String(state.a) + String(state.b) + String(state.cin)
                    : String(state.a) + String(state.b);
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
                } else if (op === "full") {
                    state.a = combo.charAt(0) === "1" ? 1 : 0;
                    state.b = combo.charAt(1) === "1" ? 1 : 0;
                    state.cin = combo.charAt(2) === "1" ? 1 : 0;
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

    /* ── Пошаговые алгоритмы: сортировки и Дейкстра ────────────────────── */

    function makeSortCell(value, index) {
        var cell = document.createElement("div");
        cell.className = "sortcell";

        var valueEl = document.createElement("span");
        valueEl.className = "sortcell__val";
        valueEl.textContent = String(value);

        var indexEl = document.createElement("span");
        indexEl.className = "sortcell__idx";
        indexEl.textContent = String(index);

        cell.appendChild(valueEl);
        cell.appendChild(indexEl);
        return cell;
    }

    function makeSortRow(row, values, decorate) {
        row.innerHTML = "";
        values.forEach(function (value, index) {
            var cell = makeSortCell(value, index);
            if (decorate) {
                decorate(cell, index);
            }
            row.appendChild(cell);
        });
    }

    function paintMergeCells(container, values, options) {
        container.innerHTML = "";

        if (!values || !values.length) {
            var empty = document.createElement("span");
            empty.className = "merge-empty";
            empty.textContent = options.empty || "пусто";
            container.appendChild(empty);
            return;
        }

        values.forEach(function (value, index) {
            var cell = document.createElement("span");
            cell.className = "merge-cell" + (options.out ? " merge-cell--out" : "");
            cell.textContent = String(value);

            if (options.head === index) {
                cell.classList.add("is-head");
            }
            if (options.consumed !== undefined && index < options.consumed) {
                cell.classList.add("is-consumed");
            }
            if (options.taken === index) {
                cell.classList.add("is-taken");
                cell.classList.remove("is-consumed");
            }
            if (options.fresh === index) {
                cell.classList.add("is-fresh");
            }

            container.appendChild(cell);
        });
    }

    var activeStepPlayer = null;

    function isTextEntryTarget(target) {
        if (!target || !target.tagName) {
            return false;
        }

        var tag = target.tagName;
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }

    document.addEventListener("keydown", function (event) {
        if (!activeStepPlayer || event.defaultPrevented) {
            return;
        }
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
        }
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
            return;
        }
        if (isTextEntryTarget(event.target)) {
            return;
        }

        event.preventDefault();
        activeStepPlayer.move(event.key === "ArrowLeft" ? -1 : 1);
    });

    document.addEventListener("pointerdown", function (event) {
        if (activeStepPlayer && !activeStepPlayer.root.contains(event.target)) {
            activeStepPlayer = null;
        }
    }, true);

    document.addEventListener("focusin", function (event) {
        if (activeStepPlayer && !activeStepPlayer.root.contains(event.target)) {
            activeStepPlayer = null;
        }
    });

    function createStepPlayer(root, renderStep) {
        var steps = [];
        var index = 0;
        var timer = null;
        var counter = root.querySelector("[data-algo-counter]");
        var prevBtn = root.querySelector("[data-algo-prev]");
        var nextBtn = root.querySelector("[data-algo-next]");
        var playBtn = root.querySelector("[data-algo-play]");
        var resetBtn = root.querySelector("[data-algo-reset]");

        function stop() {
            if (timer !== null) {
                window.clearInterval(timer);
                timer = null;
            }
            if (playBtn) {
                playBtn.classList.remove("is-on");
                playBtn.setAttribute("aria-pressed", "false");
                playBtn.textContent = "Авто";
            }
        }

        function render() {
            if (!steps.length) {
                return;
            }

            if (index < 0) {
                index = 0;
            }
            if (index > steps.length - 1) {
                index = steps.length - 1;
            }

            renderStep(steps[index], index);

            if (counter) {
                counter.textContent = (index + 1) + " / " + steps.length;
            }
            if (prevBtn) {
                prevBtn.disabled = index === 0;
            }
            if (nextBtn) {
                nextBtn.disabled = index === steps.length - 1;
            }
        }

        function move(delta) {
            stop();
            index += delta;
            render();
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", function () {
                move(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", function () {
                move(1);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", function () {
                stop();
                index = 0;
                render();
            });
        }

        if (playBtn) {
            playBtn.addEventListener("click", function () {
                if (timer !== null) {
                    stop();
                    return;
                }

                if (index >= steps.length - 1) {
                    index = 0;
                }

                playBtn.classList.add("is-on");
                playBtn.setAttribute("aria-pressed", "true");
                playBtn.textContent = "Пауза";
                render();

                timer = window.setInterval(function () {
                    if (index >= steps.length - 1) {
                        stop();
                        render();
                        return;
                    }
                    index += 1;
                    render();
                }, 800);
            });
        }

        var api = {
            root: root,
            setSteps: function (nextSteps) {
                stop();
                steps = nextSteps;
                index = 0;
                render();
            },
            move: move
        };

        root.addEventListener("pointerdown", function () {
            activeStepPlayer = api;
        });

        root.addEventListener("focusin", function () {
            activeStepPlayer = api;
        });

        return api;
    }

    function randomSet(count) {
        var pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        var values = [];

        while (values.length < count && pool.length) {
            values.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }

        return values;
    }

    /* Пузырьковая сортировка: сравнение, обмен, граница отсортированной части. */
    function buildBubbleSteps(values) {
        var array = values.slice();
        var count = array.length;
        var steps = [];

        steps.push({
            array: array.slice(),
            sortedFrom: count,
            compare: [],
            message: "Исходный массив. Сравниваем соседние элементы и меняем их, если левый больше.",
            phase: "старт"
        });

        for (var pass = 0; pass < count - 1; pass++) {
            var swaps = 0;

            for (var i = 0; i < count - 1 - pass; i++) {
                var left = array[i];
                var right = array[i + 1];

                steps.push({
                    array: array.slice(),
                    sortedFrom: count - pass,
                    compare: [i, i + 1],
                    message: "Сравниваем " + left + " и " + right + ". " +
                        (left > right ? "Левый больше — нужен обмен." : "Порядок уже верный."),
                    phase: "сравнение"
                });

                if (left > right) {
                    array[i] = right;
                    array[i + 1] = left;
                    swaps += 1;

                    steps.push({
                        array: array.slice(),
                        sortedFrom: count - pass,
                        compare: [i, i + 1],
                        swapped: true,
                        message: "Меняем местами: " + left + " и " + right + " → " + right + ", " + left + ".",
                        phase: "обмен"
                    });
                }
            }

            var sortedFrom = count - 1 - pass;
            var finished = swaps === 0;

            steps.push({
                array: array.slice(),
                sortedFrom: finished ? 0 : sortedFrom,
                compare: [],
                message: finished
                    ? "За проход не было ни одного обмена — массив уже отсортирован."
                    : "Проход " + (pass + 1) + " завершён: " + array[sortedFrom] + " занял своё место.",
                phase: "конец прохода"
            });

            if (finished) {
                break;
            }
        }

        steps.push({
            array: array.slice(),
            sortedFrom: 0,
            compare: [],
            done: true,
            message: "Готово: " + array.join(", ") + ".",
            phase: "готово"
        });

        return steps;
    }

    document.querySelectorAll('[data-widget="bubble-sort"]').forEach(function (root) {
        var row = root.querySelector("[data-sort-row]");
        var phaseOut = root.querySelector("[data-algo-phase]");
        var msgOut = root.querySelector("[data-algo-msg]");

        var player = createStepPlayer(root, function (step) {
            makeSortRow(row, step.array, function (cell, index) {
                if (step.done || index >= step.sortedFrom) {
                    cell.classList.add("is-sorted");
                }
                if (step.compare.indexOf(index) !== -1) {
                    cell.classList.add(step.swapped ? "is-swap" : "is-compare");
                }
            });

            if (phaseOut) {
                phaseOut.textContent = step.phase;
            }
            if (msgOut) {
                msgOut.textContent = step.message;
            }
        });

        var newBtn = root.querySelector("[data-algo-new]");

        player.setSteps(buildBubbleSteps([5, 1, 4, 2, 8, 3]));

        if (newBtn) {
            newBtn.addEventListener("click", function () {
                player.setSteps(buildBubbleSteps(randomSet(6)));
            });
        }
    });

    /* Сортировка слиянием: деление отрезков и слияние двух отсортированных половин. */
    function buildMergeSteps(values) {
        var array = values.slice();
        var steps = [];

        function list(items) {
            return items.join(", ");
        }

        function merge(lo, mid, hi) {
            var left = array.slice(lo, mid + 1);
            var right = array.slice(mid + 1, hi + 1);
            var result = [];
            var i = 0;
            var j = 0;

            steps.push({
                type: "merge-start",
                array: array.slice(),
                lo: lo,
                mid: mid,
                hi: hi,
                left: left.slice(),
                right: right.slice(),
                result: result.slice(),
                i: i,
                j: j,
                message: "Половины " + lo + "…" + mid + " и " + (mid + 1) + "…" + hi +
                    " уже отсортированы. Начинаем слияние.",
                phase: "слияние"
            });

            while (i < left.length && j < right.length) {
                steps.push({
                    type: "compare",
                    array: array.slice(),
                    lo: lo,
                    mid: mid,
                    hi: hi,
                    left: left.slice(),
                    right: right.slice(),
                    result: result.slice(),
                    i: i,
                    j: j,
                    message: "Сравниваем головы: " + left[i] + " и " + right[j] + ".",
                    phase: "сравнение"
                });

                var taken;
                var side;

                if (left[i] <= right[j]) {
                    taken = left[i];
                    result.push(taken);
                    i += 1;
                    side = "left";
                } else {
                    taken = right[j];
                    result.push(taken);
                    j += 1;
                    side = "right";
                }

                steps.push({
                    type: "take",
                    array: array.slice(),
                    lo: lo,
                    mid: mid,
                    hi: hi,
                    left: left.slice(),
                    right: right.slice(),
                    result: result.slice(),
                    i: i,
                    j: j,
                    taken: taken,
                    side: side,
                    message: "Берём " + taken + " из " + (side === "left" ? "левой" : "правой") + " части.",
                    phase: "перенос"
                });
            }

            while (i < left.length) {
                var fromLeft = left[i];
                result.push(fromLeft);
                i += 1;

                steps.push({
                    type: "take",
                    array: array.slice(),
                    lo: lo,
                    mid: mid,
                    hi: hi,
                    left: left.slice(),
                    right: right.slice(),
                    result: result.slice(),
                    i: i,
                    j: j,
                    taken: fromLeft,
                    side: "left",
                    message: "Правая часть закончилась — переносим " + fromLeft + " из левой.",
                    phase: "перенос"
                });
            }

            while (j < right.length) {
                var fromRight = right[j];
                result.push(fromRight);
                j += 1;

                steps.push({
                    type: "take",
                    array: array.slice(),
                    lo: lo,
                    mid: mid,
                    hi: hi,
                    left: left.slice(),
                    right: right.slice(),
                    result: result.slice(),
                    i: i,
                    j: j,
                    taken: fromRight,
                    side: "right",
                    message: "Левая часть закончилась — переносим " + fromRight + " из правой.",
                    phase: "перенос"
                });
            }

            for (var k = 0; k < result.length; k++) {
                array[lo + k] = result[k];
            }

            steps.push({
                type: "merged",
                array: array.slice(),
                lo: lo,
                mid: mid,
                hi: hi,
                left: left.slice(),
                right: right.slice(),
                result: result.slice(),
                i: left.length,
                j: right.length,
                message: "Записываем результат в массив: " + list(result) + ".",
                phase: "слито"
            });
        }

        function sort(lo, hi) {
            if (lo >= hi) {
                return;
            }

            var mid = Math.floor((lo + hi) / 2);

            steps.push({
                type: "split",
                array: array.slice(),
                lo: lo,
                mid: mid,
                hi: hi,
                message: "Делим отрезок " + lo + "…" + hi + " на " + lo + "…" + mid +
                    " и " + (mid + 1) + "…" + hi + ".",
                phase: "деление"
            });

            sort(lo, mid);
            sort(mid + 1, hi);
            merge(lo, mid, hi);
        }

        steps.push({
            type: "start",
            array: array.slice(),
            message: "Исходный массив. Сначала делим его на части, потом сливаем отсортированные половины.",
            phase: "старт"
        });

        sort(0, array.length - 1);

        steps.push({
            type: "done",
            array: array.slice(),
            sortedAll: true,
            message: "Готово: " + list(array) + ".",
            phase: "готово"
        });

        return steps;
    }

    document.querySelectorAll('[data-widget="merge-sort"]').forEach(function (root) {
        var row = root.querySelector("[data-merge-row]");
        var panel = root.querySelector("[data-merge-panel]");
        var leftOut = root.querySelector("[data-merge-left]");
        var rightOut = root.querySelector("[data-merge-right]");
        var resultOut = root.querySelector("[data-merge-out]");
        var rangeOut = root.querySelector("[data-merge-range]");
        var phaseOut = root.querySelector("[data-algo-phase]");
        var msgOut = root.querySelector("[data-algo-msg]");

        var player = createStepPlayer(root, function (step) {
            var inRange = step.lo !== undefined;

            makeSortRow(row, step.array, function (cell, index) {
                if (step.type === "done" || step.sortedAll) {
                    cell.classList.add("is-sorted");
                } else if (inRange && index >= step.lo && index <= step.hi) {
                    if (step.type === "merged") {
                        cell.classList.add("is-sorted");
                    } else if (index <= step.mid) {
                        cell.classList.add("is-range-left");
                    } else {
                        cell.classList.add("is-range-right");
                    }
                }
            });

            if (rangeOut) {
                rangeOut.textContent = step.type === "done"
                    ? "готовый массив"
                    : inRange ? "отрезок " + step.lo + "…" + step.hi : "исходный массив";
            }

            if (panel) {
                panel.hidden = !(step.type === "merge-start" || step.type === "compare" ||
                    step.type === "take" || step.type === "merged");
            }

            if (leftOut && rightOut && resultOut && step.left && step.right) {
                paintMergeCells(leftOut, step.left, {
                    consumed: step.i,
                    head: step.i,
                    taken: step.side === "left" ? step.i - 1 : -1
                });
                paintMergeCells(rightOut, step.right, {
                    consumed: step.j,
                    head: step.j,
                    taken: step.side === "right" ? step.j - 1 : -1
                });
                paintMergeCells(resultOut, step.result || [], {
                    out: true,
                    fresh: step.type === "take" ? step.result.length - 1 : -1,
                    empty: "пока пусто"
                });
            }

            if (phaseOut) {
                phaseOut.textContent = step.phase;
            }
            if (msgOut) {
                msgOut.textContent = step.message;
            }
        });

        var newBtn = root.querySelector("[data-algo-new]");

        player.setSteps(buildMergeSteps([7, 3, 5, 1, 8, 2, 6, 4]));

        if (newBtn) {
            newBtn.addEventListener("click", function () {
                player.setSteps(buildMergeSteps(randomSet(8)));
            });
        }
    });

    /* Алгоритм Дейкстры: выбор вершины и ослабление рёбер. */
    var DIJKSTRA_NODES = ["A", "B", "C", "D", "E", "F"];
    var DIJKSTRA_EDGES = [
        { from: "A", to: "B", weight: 4 },
        { from: "A", to: "C", weight: 2 },
        { from: "B", to: "C", weight: 1 },
        { from: "B", to: "D", weight: 5 },
        { from: "C", to: "D", weight: 4 },
        { from: "C", to: "E", weight: 10 },
        { from: "D", to: "E", weight: 2 },
        { from: "D", to: "F", weight: 6 },
        { from: "E", to: "F", weight: 3 }
    ];

    function edgeKey(a, b) {
        return a < b ? a + "-" + b : b + "-" + a;
    }

    function randomDijkstraEdges() {
        return DIJKSTRA_EDGES.map(function (edge) {
            return {
                from: edge.from,
                to: edge.to,
                weight: Math.floor(Math.random() * 9) + 1
            };
        });
    }

    function buildDijkstraSteps(edges) {
        var adjacency = {};
        var distances = {};
        var previous = {};
        var visited = {};
        var steps = [];
        var graphEdges = edges || DIJKSTRA_EDGES;

        DIJKSTRA_NODES.forEach(function (node) {
            adjacency[node] = [];
            distances[node] = Infinity;
            previous[node] = null;
            visited[node] = false;
        });

        graphEdges.forEach(function (edge) {
            adjacency[edge.from].push({ to: edge.to, weight: edge.weight });
            adjacency[edge.to].push({ to: edge.from, weight: edge.weight });
        });

        distances.A = 0;

        function formatDistance(value) {
            return value === Infinity ? "∞" : String(value);
        }

        function treeEdges() {
            var tree = {};
            DIJKSTRA_NODES.forEach(function (node) {
                if (previous[node]) {
                    tree[edgeKey(node, previous[node])] = true;
                }
            });
            return tree;
        }

        function pathTo(target) {
            var path = [];
            var node = target;

            while (node) {
                path.unshift(node);
                node = previous[node];
            }

            return path.join(" → ");
        }

        function pathEdges(target) {
            var path = {};
            var node = target;

            while (previous[node]) {
                path[edgeKey(node, previous[node])] = true;
                node = previous[node];
            }

            return path;
        }

        function snapshot(extra) {
            var step = {
                distances: {},
                previous: {},
                visited: {},
                tree: treeEdges(),
                current: null,
                edge: null
            };

            DIJKSTRA_NODES.forEach(function (node) {
                step.distances[node] = distances[node];
                step.previous[node] = previous[node];
                step.visited[node] = visited[node];
            });

            Object.keys(extra).forEach(function (key) {
                step[key] = extra[key];
            });

            return step;
        }

        steps.push(snapshot({
            message: "Начинаем с вершины A: расстояние до неё равно 0, до остальных — ∞.",
            phase: "старт"
        }));

        for (var round = 0; round < DIJKSTRA_NODES.length; round++) {
            var current = null;

            DIJKSTRA_NODES.forEach(function (node) {
                if (!visited[node] && distances[node] !== Infinity &&
                    (current === null || distances[node] < distances[current])) {
                    current = node;
                }
            });

            if (current === null) {
                break;
            }

            visited[current] = true;

            steps.push(snapshot({
                current: current,
                message: "Выбираем " + current + ": оценка " + formatDistance(distances[current]) +
                    " — минимальная среди непосещённых.",
                phase: "выбор вершины"
            }));

            adjacency[current].slice().sort(function (a, b) {
                return a.to < b.to ? -1 : 1;
            }).forEach(function (edge) {
                var next = edge.to;

                if (visited[next]) {
                    return;
                }

                var candidate = distances[current] + edge.weight;
                var old = distances[next];

                if (candidate < distances[next]) {
                    distances[next] = candidate;
                    previous[next] = current;

                    steps.push(snapshot({
                        current: current,
                        edge: [current, next],
                        message: "Ребро " + current + "—" + next + ": " +
                            formatDistance(old) + " → " + candidate + " через " + current +
                            ". Обновляем оценку " + next + ".",
                        phase: "ослабление ребра"
                    }));
                } else {
                    steps.push(snapshot({
                        current: current,
                        edge: [current, next],
                        message: "Ребро " + current + "—" + next + ": " +
                            formatDistance(distances[current]) + " + " + edge.weight + " = " + candidate +
                            ", это не меньше " + formatDistance(old) + ". Оставляем как есть.",
                        phase: "проверка ребра"
                    }));
                }
            });
        }

        steps.push(snapshot({
            tree: pathEdges("F"),
            message: "Готово. Кратчайшие расстояния от A: " +
                DIJKSTRA_NODES.map(function (node) {
                    return node + " — " + formatDistance(distances[node]);
                }).join(", ") + ". Маршрут до F: " + pathTo("F") + ".",
            phase: "готово"
        }));

        return steps;
    }

    document.querySelectorAll('[data-widget="dijkstra"]').forEach(function (root) {
        var phaseOut = root.querySelector("[data-algo-phase]");
        var msgOut = root.querySelector("[data-algo-msg]");
        var nodeEls = Array.prototype.slice.call(root.querySelectorAll("[data-dnode]"));
        var edgeEls = Array.prototype.slice.call(root.querySelectorAll("[data-edge]"));
        var rowEls = Array.prototype.slice.call(root.querySelectorAll("[data-drow]"));
        var descOut = root.querySelector("[data-dijkstra-desc]");
        var newBtn = root.querySelector("[data-algo-new]");

        var player = createStepPlayer(root, function (step) {
            nodeEls.forEach(function (element) {
                var node = element.getAttribute("data-dnode");
                var distOut = element.querySelector("[data-dist]");

                element.classList.toggle("is-visited", Boolean(step.visited[node]));
                element.classList.toggle("is-current", step.current === node);

                if (distOut) {
                    distOut.textContent = step.distances[node] === Infinity
                        ? "∞"
                        : String(step.distances[node]);
                }
            });

            var activeKey = step.edge ? edgeKey(step.edge[0], step.edge[1]) : null;

            edgeEls.forEach(function (element) {
                var key = element.getAttribute("data-edge");
                element.classList.toggle("is-tree", Boolean(step.tree[key]));
                element.classList.toggle("is-active", key === activeKey);
            });

            rowEls.forEach(function (element) {
                var node = element.getAttribute("data-drow");
                var isCurrent = step.current === node;
                var isVisited = Boolean(step.visited[node]);
                var distCell = element.querySelector('[data-dcell="dist"]');
                var prevCell = element.querySelector('[data-dcell="prev"]');
                var statusCell = element.querySelector('[data-dcell="status"]');

                element.classList.toggle("is-current", isCurrent);
                element.classList.toggle("is-visited", isVisited && !isCurrent);

                if (distCell) {
                    distCell.textContent = step.distances[node] === Infinity
                        ? "∞"
                        : String(step.distances[node]);
                }
                if (prevCell) {
                    prevCell.textContent = step.previous[node] || "—";
                }
                if (statusCell) {
                    statusCell.textContent = isCurrent
                        ? "текущая"
                        : isVisited
                            ? "посещена"
                            : step.distances[node] === Infinity ? "—" : "в очереди";
                }
            });

            if (phaseOut) {
                phaseOut.textContent = step.phase;
            }
            if (msgOut) {
                msgOut.textContent = step.message;
            }
        });

        function paintEdges(edges) {
            edges.forEach(function (edge) {
                var label = root.querySelector('[data-weight="' + edgeKey(edge.from, edge.to) + '"]');
                if (label) {
                    label.textContent = String(edge.weight);
                }
            });

            if (descOut) {
                descOut.textContent = "Рёбра: " + edges.map(function (edge) {
                    return edge.from + "—" + edge.to + " вес " + edge.weight;
                }).join(", ") + ".";
            }
        }

        function load(edges) {
            paintEdges(edges);
            player.setSteps(buildDijkstraSteps(edges));
        }

        load(DIJKSTRA_EDGES);

        if (newBtn) {
            newBtn.addEventListener("click", function () {
                load(randomDijkstraEdges());
            });
        }
    });

    /* ── Массив и связный список: доступ по индексу и вставка ─────────────── */

    var DS_VALUES = [3, 7, 2, 9, 5, 4];

    function dsMark(index, state) {
        var marks = {};
        marks[index] = state;
        return marks;
    }

    function dsPlural(count, one, few, many) {
        var mod10 = count % 10;
        var mod100 = count % 100;

        if (mod10 === 1 && mod100 !== 11) {
            return one;
        }
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
            return few;
        }
        return many;
    }

    function buildAccessSteps(values, index) {
        var steps = [];
        var arrayBase = {
            values: values.slice(),
            marks: dsMark(index, "aim"),
            cost: "1 операция",
            note: "адрес = начало + индекс × размер"
        };
        var arrayFound = {
            values: values.slice(),
            marks: dsMark(index, "found"),
            cost: "O(1) · 1 операция",
            note: "адрес = начало + " + index + " × размер → ячейка " + index
        };

        steps.push({
            mode: "access",
            phase: "старт",
            index: index,
            arrayState: arrayBase,
            listState: {
                pointer: -1,
                inserted: null,
                rewired: false,
                cost: "0 переходов",
                note: "начинаем с головы"
            },
            message: "Задача: получить элемент с индексом " + index +
                ". Посмотрим, сколько шагов сделает каждая структура."
        });

        steps.push({
            mode: "access",
            phase: "доступ",
            index: index,
            arrayState: arrayFound,
            listState: {
                pointer: 0,
                inserted: null,
                rewired: false,
                cost: "1 узел",
                note: "узел 0: значение " + values[0]
            },
            message: "Массив: адрес вычисляется по формуле — нужная ячейка " + index +
                " найдена сразу, за O(1). Список: начинаем с головы, узел 0."
        });

        for (var p = 1; p <= index; p++) {
            var isTarget = p === index;

            steps.push({
                mode: "access",
                phase: isTarget ? "нашли" : "переход по ссылке",
                index: index,
                arrayState: arrayFound,
                listState: {
                    pointer: p,
                    inserted: null,
                    rewired: false,
                    cost: "переходов: " + p,
                    note: "узел " + p + ": значение " + values[p]
                },
                message: isTarget
                    ? "Список: дошли до узла " + p + " за " + p + " " +
                        dsPlural(p, "переход", "перехода", "переходов") +
                        ". Пришлось пройти все предыдущие узлы — доступ O(n)."
                    : "Список: переходим по ссылке к узлу " + p +
                        " (значение " + values[p] + ")."
            });
        }

        steps.push({
            mode: "access",
            phase: "итог",
            index: index,
            arrayState: arrayFound,
            listState: {
                pointer: index,
                inserted: null,
                rewired: false,
                cost: index === 0 ? "O(1)" : "O(n) · " + index + " " +
                    dsPlural(index, "переход", "перехода", "переходов"),
                note: index === 0 ? "нужный узел — голова списка" : "пройдено узлов: " + (index + 1)
            },
            message: index === 0
                ? "Итог: для индекса 0 обе структуры справляются за один шаг. Чем дальше элемент, тем заметнее разница."
                : "Итог: массив отвечает за O(1), список — за O(n): до нужного узла можно добраться только по цепочке ссылок."
        });

        return steps;
    }

    function buildInsertSteps(values, index, newValue) {
        var array = values.slice();
        var capacity = array.length + 1;
        array.push(null);

        var arrayStates = [];
        var listStates = [];
        var shiftCount = values.length - index;

        arrayStates.push({
            values: array.slice(),
            marks: dsMark(index, "aim"),
            cost: "свободных ячеек: 1",
            note: "свободная ячейка справа — индекс " + (capacity - 1)
        });

        for (var i = values.length - 1; i >= index; i--) {
            array[i + 1] = array[i];
            array[i] = null;

            var marks = {};
            marks[i] = "source";
            marks[i + 1] = "moving";

            arrayStates.push({
                values: array.slice(),
                marks: marks,
                cost: "сдвигов: " + (values.length - i),
                note: array[i + 1] + " переезжает из ячейки " + i + " в " + (i + 1)
            });
        }

        array = array.slice();
        array[index] = newValue;
        arrayStates.push({
            values: array.slice(),
            marks: dsMark(index, "inserted"),
            cost: "сдвигов: " + shiftCount + " + запись",
            note: newValue + " записано в ячейку " + index
        });

        listStates.push({
            pointer: -1,
            inserted: null,
            rewired: false,
            cost: "0 переходов",
            note: "начинаем с головы"
        });

        for (var p = 0; p < index; p++) {
            listStates.push({
                pointer: p,
                inserted: null,
                rewired: false,
                cost: "переходов: " + p,
                note: p === index - 1
                    ? "узел " + p + " (значение " + values[p] + "), следующий — " +
                        values[p + 1] + ", место найдено"
                    : "узел " + p + " (значение " + values[p] + "), идём дальше"
            });
        }

        listStates.push({
            pointer: index - 1,
            inserted: newValue,
            rewired: false,
            cost: "поиск места завершён",
            note: "создаём новый узел со значением " + newValue
        });

        listStates.push({
            pointer: index - 1,
            inserted: newValue,
            rewired: true,
            cost: "вставка O(1)",
            note: "переставляем ссылки: " + values[index - 1] + " → " +
                newValue + " → " + values[index]
        });

        var total = Math.max(arrayStates.length, listStates.length);
        var steps = [{
            mode: "insert",
            phase: "старт",
            index: index,
            arrayState: arrayStates[0],
            listState: listStates[0],
            message: "Задача: вставить " + newValue + " на позицию " + index +
                ". Массив сдвигает хвост вправо, список ищет место с головы."
        }];
        var prevArray = 0;
        var prevList = 0;

        for (var k = 1; k < total; k++) {
            var arrayIndex = Math.min(k, arrayStates.length - 1);
            var listIndex = Math.min(k, listStates.length - 1);
            var parts = [];

            if (arrayIndex !== prevArray) {
                parts.push("Массив: " + arrayStates[arrayIndex].note + ".");
            }
            if (listIndex !== prevList) {
                parts.push("Список: " + listStates[listIndex].note + ".");
            }

            prevArray = arrayIndex;
            prevList = listIndex;

            steps.push({
                mode: "insert",
                phase: "вставка",
                index: index,
                arrayState: arrayStates[arrayIndex],
                listState: listStates[listIndex],
                message: parts.join(" ")
            });
        }

        steps.push({
            mode: "insert",
            phase: "итог",
            index: index,
            arrayState: arrayStates[arrayStates.length - 1],
            listState: listStates[listStates.length - 1],
            message: "Итог: в массиве пришлось сдвинуть " + shiftCount + " " +
                dsPlural(shiftCount, "элемент", "элемента", "элементов") +
                " — это O(n). В списке поиск места занял " + index + " " +
                dsPlural(index, "переход", "перехода", "переходов") +
                " (O(n)), зато перестановка ссылок — O(1)."
        });

        return steps;
    }

    function renderDsArray(out, state) {
        if (!out) {
            return;
        }

        out.innerHTML = "";

        state.values.forEach(function (value, index) {
            var cell = document.createElement("div");
            var isEmpty = value === null || value === undefined;
            cell.className = "dscell";

            if (isEmpty) {
                cell.classList.add("is-empty");
            }
            if (state.marks && state.marks[index]) {
                cell.classList.add("is-" + state.marks[index]);
            }

            var valueEl = document.createElement("span");
            valueEl.className = "dscell__val";
            valueEl.textContent = isEmpty ? "" : String(value);

            var indexEl = document.createElement("span");
            indexEl.className = "dscell__idx";
            indexEl.textContent = String(index);

            cell.appendChild(valueEl);
            cell.appendChild(indexEl);
            cell.setAttribute("aria-label", "индекс " + index +
                (isEmpty ? ", пусто" : ", значение " + value));
            out.appendChild(cell);
        });
    }

    function renderDsList(out, values, step) {
        if (!out) {
            return;
        }

        out.innerHTML = "";

        var state = step.listState;
        var nodes = values.map(function (value, index) {
            return { value: value, index: index, inserted: false };
        });
        var insertedIndex = -1;

        if (state.inserted !== null && state.inserted !== undefined) {
            nodes.splice(step.index, 0, {
                value: state.inserted,
                index: step.index,
                inserted: true
            });
            insertedIndex = step.index;
        }

        function addLink(extra) {
            var link = document.createElement("span");
            link.className = "dslink" + (extra ? " " + extra : "");
            link.setAttribute("aria-hidden", "true");
            link.textContent = "→";
            out.appendChild(link);
        }

        nodes.forEach(function (node, position) {
            if (position > 0) {
                var adjacent = insertedIndex !== -1 &&
                    (position === insertedIndex || position === insertedIndex + 1);
                var linkClass = "";

                if (adjacent) {
                    linkClass = state.rewired ? "is-rewired" : "is-pending";
                } else if (state.pointer >= position) {
                    linkClass = "is-traversed";
                }

                addLink(linkClass);
            }

            var el = document.createElement("div");
            el.className = "dsnode";

            if (node.inserted) {
                el.classList.add("is-inserted");
                if (state.rewired) {
                    el.classList.add("is-linked");
                }
            }

            if (state.pointer === node.index && !node.inserted) {
                el.classList.add("is-current");
            } else if (state.pointer > node.index) {
                el.classList.add("is-visited");
            }

            if (step.mode === "access" && state.pointer === step.index && node.index === step.index) {
                el.classList.add("is-found");
            }

            var valueEl = document.createElement("span");
            valueEl.className = "dsnode__val";
            valueEl.textContent = String(node.value);

            var indexEl = document.createElement("span");
            indexEl.className = "dsnode__idx";
            indexEl.textContent = String(position);

            el.appendChild(valueEl);
            el.appendChild(indexEl);
            el.setAttribute("aria-label", "узел " + position + ", значение " + node.value);
            out.appendChild(el);
        });

        var end = document.createElement("span");
        end.className = "dslink dslink--null";
        end.setAttribute("aria-hidden", "true");
        end.textContent = "∅";
        out.appendChild(end);
    }

    document.querySelectorAll('[data-widget="ds-model"]').forEach(function (root) {
        var arrayOut = root.querySelector("[data-ds-array]");
        var listOut = root.querySelector("[data-ds-list]");
        var arrayNote = root.querySelector("[data-ds-array-note]");
        var listNote = root.querySelector("[data-ds-list-note]");
        var arrayCost = root.querySelector("[data-ds-array-cost]");
        var listCost = root.querySelector("[data-ds-list-cost]");
        var targetOut = root.querySelector("[data-ds-target]");
        var phaseOut = root.querySelector("[data-algo-phase]");
        var msgOut = root.querySelector("[data-algo-msg]");
        var modeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-ds-mode]"));
        var randomBtn = root.querySelector("[data-ds-random]");

        var values = DS_VALUES.slice();
        var mode = "access";
        var index = 3;
        var insertValue = 8;

        var player = createStepPlayer(root, function (step) {
            renderDsArray(arrayOut, step.arrayState);
            renderDsList(listOut, values, step);

            if (arrayNote) {
                arrayNote.textContent = step.arrayState.note;
            }
            if (listNote) {
                listNote.textContent = step.listState.note;
            }
            if (arrayCost) {
                arrayCost.textContent = step.arrayState.cost;
            }
            if (listCost) {
                listCost.textContent = step.listState.cost;
            }
            if (phaseOut) {
                phaseOut.textContent = step.phase;
            }
            if (msgOut) {
                msgOut.textContent = step.message;
            }
        });

        function load() {
            if (targetOut) {
                targetOut.textContent = mode === "access"
                    ? "Цель: элемент с индексом " + index + "."
                    : "Цель: вставить значение " + insertValue + " на позицию " + index + ".";
            }

            player.setSteps(mode === "access"
                ? buildAccessSteps(values, index)
                : buildInsertSteps(values, index, insertValue));
        }

        modeButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                mode = button.getAttribute("data-ds-mode");

                modeButtons.forEach(function (other) {
                    var isOn = other === button;
                    other.classList.toggle("is-on", isOn);
                    other.setAttribute("aria-pressed", isOn ? "true" : "false");
                });

                load();
            });
        });

        if (randomBtn) {
            randomBtn.addEventListener("click", function () {
                var candidates = [1, 2, 3, 4].filter(function (candidate) {
                    return candidate !== index;
                });
                index = candidates[Math.floor(Math.random() * candidates.length)];

                if (mode === "insert") {
                    var pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(function (candidate) {
                        return values.indexOf(candidate) === -1;
                    });
                    var alternatives = pool.filter(function (candidate) {
                        return candidate !== insertValue;
                    });
                    var options = alternatives.length ? alternatives : pool;
                    insertValue = options[Math.floor(Math.random() * options.length)];
                }

                load();
            });
        }

        load();
    });

    /* ── Стек и очередь: отмена действий и очередь печати ─────────────────── */

    var SQ_STACK = [
        "Открыть документ",
        "Набрать текст",
        "Вставить картинку",
        "Выделить абзац"
    ];
    var SQ_QUEUE = ["Договор.pdf", "Отчёт.docx", "Смета.xlsx", "Письмо.pdf"];

    function renderSqStack(out, state) {
        if (!out) {
            return;
        }

        out.innerHTML = "";

        if (!state.values.length) {
            var emptyEl = document.createElement("div");
            emptyEl.className = "sqstack__empty";
            emptyEl.textContent = "стек пуст";
            out.appendChild(emptyEl);
            return;
        }

        for (var i = state.values.length - 1; i >= 0; i--) {
            var item = document.createElement("div");
            var isTop = i === state.top;
            item.className = "sqitem";

            if (isTop) {
                item.classList.add("is-top");
            }
            if (i === state.pushed) {
                item.classList.add("is-pushed");
            }

            var levelEl = document.createElement("span");
            levelEl.className = "sqitem__level";
            levelEl.textContent = String(i);

            var valueEl = document.createElement("span");
            valueEl.className = "sqitem__val";
            valueEl.textContent = state.values[i];

            var badgeEl = document.createElement("span");
            badgeEl.className = "sqitem__badge";
            badgeEl.textContent = isTop ? "вершина" : "";

            item.appendChild(levelEl);
            item.appendChild(valueEl);
            item.appendChild(badgeEl);
            item.setAttribute("aria-label", "уровень " + i + ", действие: " +
                state.values[i] + (isTop ? ", вершина" : ""));
            out.appendChild(item);
        }
    }

    function renderSqQueue(out, state) {
        if (!out) {
            return;
        }

        out.innerHTML = "";

        if (!state.values.length) {
            var emptyEl = document.createElement("span");
            emptyEl.className = "sqqueue__empty";
            emptyEl.textContent = "очередь пуста";
            out.appendChild(emptyEl);
            return;
        }

        state.values.forEach(function (doc, index) {
            var last = state.values.length - 1;

            if (index > 0) {
                var arrowEl = document.createElement("span");
                arrowEl.className = "sqarrow";
                arrowEl.setAttribute("aria-hidden", "true");
                arrowEl.textContent = "→";
                out.appendChild(arrowEl);
            }

            var card = document.createElement("div");
            card.className = "sqdoc";

            if (index === 0) {
                card.classList.add("is-head");
            }
            if (index === last) {
                card.classList.add("is-tail");
            }
            if (index === state.added) {
                card.classList.add("is-added");
            }

            var valueEl = document.createElement("span");
            valueEl.className = "sqdoc__val";
            valueEl.textContent = doc;

            var tagEl = document.createElement("span");
            tagEl.className = "sqdoc__tag";
            tagEl.textContent = index === 0 && index === last
                ? "начало и конец"
                : index === 0 ? "начало" : index === last ? "конец" : "";

            card.appendChild(valueEl);
            card.appendChild(tagEl);
            card.setAttribute("aria-label", "документ " + doc +
                (index === 0 ? ", начало очереди" : "") +
                (index === last ? ", конец очереди" : ""));
            out.appendChild(card);
        });
    }

    function renderSqPrinted(out, docs) {
        if (!out) {
            return;
        }

        out.innerHTML = "";

        if (!docs.length) {
            out.textContent = "—";
            return;
        }

        docs.forEach(function (doc) {
            var item = document.createElement("span");
            item.className = "sqprinted__item";
            item.textContent = "✓ " + doc;
            out.appendChild(item);
        });
    }

    document.querySelectorAll('[data-widget="stack-queue"]').forEach(function (root) {
        var stackOut = root.querySelector("[data-sq-stack]");
        var queueOut = root.querySelector("[data-sq-queue]");
        var stackStage = root.querySelector('[data-sq-stage="stack"]');
        var queueStage = root.querySelector('[data-sq-stage="queue"]');
        var stackCost = root.querySelector("[data-sq-stack-cost]");
        var stackNote = root.querySelector("[data-sq-stack-note]");
        var queueCost = root.querySelector("[data-sq-queue-cost]");
        var queueNote = root.querySelector("[data-sq-queue-note]");
        var popped = root.querySelector("[data-sq-popped]");
        var poppedVal = root.querySelector("[data-sq-popped-val]");
        var printer = root.querySelector("[data-sq-printer]");
        var printerDoc = root.querySelector("[data-sq-printer-doc]");
        var printedOut = root.querySelector("[data-sq-printed]");
        var targetOut = root.querySelector("[data-sq-target]");
        var phaseOut = root.querySelector("[data-algo-phase]");
        var counterOut = root.querySelector("[data-algo-counter]");
        var msgOut = root.querySelector("[data-algo-msg]");
        var modeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-sq-mode]"));
        var addBtn = root.querySelector("[data-sq-add]");
        var removeBtn = root.querySelector("[data-sq-remove]");
        var resetBtn = root.querySelector("[data-sq-reset]");

        var mode = "stack";
        var stack = [];
        var stackPushed = -1;
        var stackPopped = null;
        var stackOps = 0;
        var queue = [];
        var queueAddedAt = -1;
        var queuePrinting = null;
        var queuePrinted = [];
        var queueOps = 0;
        var stackStatus = {
            message: "Стек действий пуст. Нажмите «Добавить», чтобы выполнить первое действие.",
            phase: "стек · пусто",
            note: "стек пока пуст",
            cost: "элементов: 0"
        };
        var queueStatus = {
            message: "Очередь печати пуста. Нажмите «Добавить», чтобы отправить первый документ.",
            phase: "очередь · пусто",
            note: "очередь пока пуста",
            cost: "документов: 0"
        };

        function nextStackIndex() {
            for (var i = 0; i < SQ_STACK.length; i++) {
                if (stack.indexOf(SQ_STACK[i]) === -1) {
                    return i;
                }
            }
            return -1;
        }

        function nextQueueIndex() {
            for (var i = 0; i < SQ_QUEUE.length; i++) {
                if (queue.indexOf(SQ_QUEUE[i]) === -1) {
                    return i;
                }
            }
            return -1;
        }

        function paintStack() {
            renderSqStack(stackOut, {
                values: stack.slice(),
                top: stack.length - 1,
                pushed: stackPushed,
                popped: stackPopped
            });

            if (stackCost) {
                stackCost.textContent = stackStatus.cost;
            }
            if (stackNote) {
                stackNote.textContent = stackStatus.note;
            }
            if (popped && poppedVal) {
                popped.hidden = !stackPopped;
                poppedVal.textContent = stackPopped || "";
            }
        }

        function paintQueue() {
            renderSqQueue(queueOut, {
                values: queue.slice(),
                added: queueAddedAt,
                printing: queuePrinting,
                printed: queuePrinted
            });
            renderSqPrinted(printedOut, queuePrinted);

            if (queueCost) {
                queueCost.textContent = queueStatus.cost;
            }
            if (queueNote) {
                queueNote.textContent = queueStatus.note;
            }
            if (printer) {
                printer.classList.toggle("is-printing", Boolean(queuePrinting));
            }
            if (printerDoc) {
                printerDoc.textContent = queuePrinting || "ожидает документ";
            }
        }

        function paintStatus() {
            if (phaseOut) {
                phaseOut.textContent = mode === "stack" ? stackStatus.phase : queueStatus.phase;
            }
            if (msgOut) {
                msgOut.textContent = mode === "stack" ? stackStatus.message : queueStatus.message;
            }
            if (counterOut) {
                counterOut.textContent = "операций: " + (mode === "stack" ? stackOps : queueOps);
            }
        }

        function syncButtons() {
            if (!addBtn || !removeBtn) {
                return;
            }

            if (mode === "stack") {
                addBtn.disabled = nextStackIndex() === -1;
                removeBtn.disabled = stack.length === 0;
                addBtn.title = addBtn.disabled ? "Все действия из примера уже добавлены" : "";
            } else {
                addBtn.disabled = nextQueueIndex() === -1;
                removeBtn.disabled = queue.length === 0;
                addBtn.title = addBtn.disabled ? "Все документы из примера уже отправлены" : "";
            }
        }

        function paint() {
            if (mode === "stack") {
                paintStack();
            } else {
                paintQueue();
            }
            paintStatus();
            syncButtons();
        }

        function loadMode() {
            var isStack = mode === "stack";

            if (stackStage) {
                stackStage.hidden = !isStack;
            }
            if (queueStage) {
                queueStage.hidden = isStack;
            }
            if (targetOut) {
                targetOut.textContent = isStack
                    ? "История действий в редакторе: новое действие ложится на вершину, Ctrl+Z снимает верхнее."
                    : "Очередь печати: документы печатаются в том порядке, в каком их отправили.";
            }

            paint();
        }

        function addItem() {
            if (mode === "stack") {
                var stackIndex = nextStackIndex();
                if (stackIndex === -1) {
                    return;
                }

                var action = SQ_STACK[stackIndex];
                stack.push(action);
                stackPushed = stack.length - 1;
                stackPopped = null;
                stackOps += 1;
                stackStatus = {
                    message: "Пользователь выполнил действие «" + action +
                        "» — оно добавлено на вершину стека.",
                    phase: "push · добавление",
                    note: stack.length === 1
                        ? "первое действие в стеке"
                        : "новое действие добавлено на вершину",
                    cost: "элементов: " + stack.length
                };
            } else {
                var queueIndex = nextQueueIndex();
                if (queueIndex === -1) {
                    return;
                }

                var doc = SQ_QUEUE[queueIndex];
                queue.push(doc);
                queueAddedAt = queue.length - 1;
                queueOps += 1;
                queueStatus = {
                    message: "Пользователь отправил «" + doc +
                        "» — документ встал в конец очереди.",
                    phase: "enqueue · добавление",
                    note: "новый документ добавлен в конец",
                    cost: "документов: " + queue.length
                };
            }

            paint();
        }

        function removeItem() {
            if (mode === "stack") {
                if (!stack.length) {
                    return;
                }

                var removed = stack.pop();
                stackPushed = -1;
                stackPopped = removed;
                stackOps += 1;
                stackStatus = {
                    message: stack.length
                        ? "Ctrl+Z снимает элемент с вершины: действие «" + removed +
                            "» отменено. Предыдущие действия остались в стеке."
                        : "Ctrl+Z снял последнее действие «" + removed +
                            "» — стек снова пуст.",
                    phase: "pop · Ctrl+Z",
                    note: stack.length ? "Ctrl+Z снял верхнее действие" : "стек снова пуст",
                    cost: "элементов: " + stack.length
                };
            } else {
                if (!queue.length) {
                    return;
                }

                var printed = queue.shift();
                if (queuePrinting) {
                    queuePrinted.push(queuePrinting);
                }
                queuePrinting = printed;
                queueAddedAt = -1;
                queueOps += 1;
                queueStatus = {
                    message: "Принтер берёт «" + printed +
                        "» из начала очереди. Остальные документы ждут своей очереди.",
                    phase: "dequeue · печать",
                    note: queue.length
                        ? "печатается документ из начала"
                        : "в очереди больше нет документов",
                    cost: "в очереди: " + queue.length
                };
            }

            paint();
        }

        function resetMode() {
            if (mode === "stack") {
                stack = [];
                stackPushed = -1;
                stackPopped = null;
                stackOps = 0;
                stackStatus = {
                    message: "Стек действий пуст. Нажмите «Добавить», чтобы выполнить первое действие.",
                    phase: "стек · пусто",
                    note: "стек пока пуст",
                    cost: "элементов: 0"
                };
            } else {
                queue = [];
                queueAddedAt = -1;
                queuePrinting = null;
                queuePrinted = [];
                queueOps = 0;
                queueStatus = {
                    message: "Очередь печати пуста. Нажмите «Добавить», чтобы отправить первый документ.",
                    phase: "очередь · пусто",
                    note: "очередь пока пуста",
                    cost: "документов: 0"
                };
            }

            paint();
        }

        modeButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                mode = button.getAttribute("data-sq-mode");

                modeButtons.forEach(function (other) {
                    var isOn = other === button;
                    other.classList.toggle("is-on", isOn);
                    other.setAttribute("aria-pressed", isOn ? "true" : "false");
                });

                loadMode();
            });
        });

        if (addBtn) {
            addBtn.addEventListener("click", addItem);
        }
        if (removeBtn) {
            removeBtn.addEventListener("click", removeItem);
        }
        if (resetBtn) {
            resetBtn.addEventListener("click", resetMode);
        }

        loadMode();
    });

    document.querySelectorAll(".quiz").forEach(initQuiz);
})();
