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

    document.querySelectorAll(".quiz").forEach(initQuiz);
})();
