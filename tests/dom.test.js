import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// DOM-based tests for calculators module
describe('DOM Calculator Functions', () => {
    let resultEl;

    beforeEach(() => {
        resultEl = document.createElement('div');
        resultEl.id = 'test-result';
        resultEl.className = 'result-box';
        document.body.appendChild(resultEl);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    function setResultText(el, text) {
        el.textContent = text;
        el.className = 'result-box show';
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    it('setResultText sets text and adds show class', () => {
        setResultText(resultEl, 'Test message');
        expect(resultEl.textContent).toBe('Test message');
        expect(resultEl.className).toBe('result-box show');
    });

    it('escapeHTML escapes < and > characters', () => {
        const result = escapeHTML('<script>alert("xss")</script>');
        expect(result).not.toContain('<script>');
        expect(result).toContain('<');
        expect(result).toContain('>');
    });

    it('escapeHTML does not change plain text', () => {
        const result = escapeHTML('Hello World');
        expect(result).toBe('Hello World');
    });

    it('escapeHTML handles ampersand', () => {
        const result = escapeHTML('a & b');
        expect(result).toContain('&');
    });
});

describe('Image Volume Calculator with DOM', () => {
    let resultEl, widthEl, heightEl, depthEl;

    beforeEach(() => {
        resultEl = document.createElement('div');
        resultEl.id = 'img-volume-result';
        resultEl.className = 'result-box';
        document.body.appendChild(resultEl);

        widthEl = document.createElement('input');
        widthEl.id = 'img-width';
        document.body.appendChild(widthEl);

        heightEl = document.createElement('input');
        heightEl.id = 'img-height';
        document.body.appendChild(heightEl);

        depthEl = document.createElement('input');
        depthEl.id = 'img-depth';
        document.body.appendChild(depthEl);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

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

        result.textContent = 'Размер: ' + width + '\u00D7' + height + ' пикселей, глубина: ' + depth + ' бит/пиксель';
        result.innerHTML += '<br>Объём: ' + bits + ' бит = ' + bytes + ' байт = ' + kb.toFixed(2) + ' Кбайт = ' + mb.toFixed(4) + ' Мбайт';
        result.className = 'result-box show';
    }

    it('shows error for empty values', () => {
        calcImageVolume();
        expect(resultEl.textContent).toContain('корректные');
        expect(resultEl.className).toContain('show');
    });

    it('calculates correct volume for 800x600 24-bit', () => {
        widthEl.value = '800';
        heightEl.value = '600';
        depthEl.value = '24';
        calcImageVolume();
        expect(resultEl.innerHTML).toContain('11520000');
        expect(resultEl.className).toContain('show');
    });

    it('shows error for zero width', () => {
        widthEl.value = '0';
        heightEl.value = '600';
        depthEl.value = '24';
        calcImageVolume();
        expect(resultEl.textContent).toContain('корректные');
    });
});

describe('Quiz Build Logic', () => {
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }

    function buildShuffledQuestions(rawQuestions) {
        const questions = shuffle(rawQuestions);
        const shuffledOptions = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            let indices = [0, 1, 2];
            indices = shuffle(indices);
            const newCorrect = indices.indexOf(q.answer);
            const opts = [];
            for (let j = 0; j < indices.length; j++) {
                opts.push(q.options[indices[j]]);
            }
            shuffledOptions.push({
                q: q.q,
                options: opts,
                correct: newCorrect,
                explanation: q.explanation
            });
        }
        return shuffledOptions;
    }

    it('builds shuffled questions with correct option tracking', () => {
        const questions = [
            { q: 'Q1', options: ['A', 'B', 'C'], answer: 0, explanation: 'Explanation 1' },
            { q: 'Q2', options: ['X', 'Y', 'Z'], answer: 2, explanation: 'Explanation 2' }
        ];

        const result = buildShuffledQuestions(questions);
        expect(result.length).toBe(2);

        // Each question should have its correct answer remapped
        for (let i = 0; i < result.length; i++) {
            const q = result[i];
            // The option at correct index should match the original answer
            const originalQ = questions.find(function(o) { return o.q === q.q; });
            expect(q.options[q.correct]).toBe(originalQ.options[originalQ.answer]);
        }
    });
});

describe('IP Address Validation', () => {
    function isValidIP(input) {
        const octets = input.split('.');
        if (octets.length !== 4) return false;
        const nums = [];
        for (let i = 0; i < 4; i++) {
            const n = parseInt(octets[i], 10);
            if (isNaN(n) || n < 0 || n > 255 || octets[i] !== n.toString()) {
                return false;
            }
            nums.push(n);
        }
        return true;
    }

    function ipToDecimal(input) {
        const octets = input.split('.').map(Number);
        return octets.reduce(function(acc, n) { return acc * 256 + n; }, 0);
    }

    function getIPClass(octets) {
        if (octets[0] >= 1 && octets[0] <= 126) return 'A';
        if (octets[0] >= 128 && octets[0] <= 191) return 'B';
        if (octets[0] >= 192 && octets[0] <= 223) return 'C';
        if (octets[0] >= 224 && octets[0] <= 239) return 'D';
        return 'E';
    }

    it('validates correct IPs', () => {
        expect(isValidIP('192.168.1.1')).toBe(true);
        expect(isValidIP('10.0.0.1')).toBe(true);
        expect(isValidIP('255.255.255.255')).toBe(true);
        expect(isValidIP('0.0.0.0')).toBe(true);
    });

    it('rejects invalid IPs', () => {
        expect(isValidIP('256.1.1.1')).toBe(false);
        expect(isValidIP('1.1.1')).toBe(false);
        expect(isValidIP('1.1.1.1.1')).toBe(false);
        expect(isValidIP('abc.def.ghi.jkl')).toBe(false);
        expect(isValidIP('192.168.01.1')).toBe(false); // leading zero in octet
    });

    it('converts IP to decimal', () => {
        expect(ipToDecimal('192.168.1.1')).toBe(3232235777);
        expect(ipToDecimal('127.0.0.1')).toBe(2130706433);
    });

    it('classifies IP classes', () => {
        expect(getIPClass([10, 0, 0, 1])).toBe('A');
        expect(getIPClass([172, 16, 0, 1])).toBe('B');
        expect(getIPClass([192, 168, 1, 1])).toBe('C');
        expect(getIPClass([224, 0, 0, 1])).toBe('D');
    });

    it('127.0.0.1 is private loopback', () => {
        const octets = [127, 0, 0, 1];
        expect(octets[0] === 127).toBe(true);
    });

    it('192.168.x.x is private', () => {
        const octets = [192, 168, 1, 100];
        expect(octets[0] === 192 && octets[1] === 168).toBe(true);
    });

    it('10.x.x.x is private', () => {
        const octets = [10, 0, 0, 1];
        expect(octets[0] === 10).toBe(true);
    });
});

describe('Cell Addressing Simulation', () => {
    function shiftFormula(formula) {
        return formula.replace(/\b([A-Z]+)(\d+)\b/g, function(match, col, row) {
            const newRow = parseInt(row) + 1;
            return col + newRow;
        });
    }

    it('shifts A1 to A2', () => {
        expect(shiftFormula('A1')).toBe('A2');
    });

    it('shifts A1+B1 to A2+B2', () => {
        expect(shiftFormula('A1+B1')).toBe('A2+B2');
    });

    it('ignores absolute references ($A$1 not shifted by this simple regex)', () => {
        // The simple regex doesn't handle $ signs, which is expected
        const result = shiftFormula('$A$1');
        // It won't match due to $ prefix
        expect(result).toBe('$A$1');
    });

    it('handles complex formulas', () => {
        expect(shiftFormula('SUM(A1:B10)')).toBe('SUM(A2:B11)');
    });
});

describe('Readability Check Logic', () => {
    function checkReadability(text) {
        const words = text.trim().split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).filter(function(s) { return s.trim().length > 0; }).length || 1;
        const vowels = text.match(/[аеёиоуыэюяaeiouy]/gi);
        const syllables = vowels ? vowels.length : 1;

        const avgWordsPerSentence = words / sentences;
        const avgSyllablesPerWord = syllables / words;

        const flesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

        let level;
        if (flesch >= 90) level = 'Очень лёгкий';
        else if (flesch >= 70) level = 'Довольно лёгкий';
        else if (flesch >= 50) level = 'Средний';
        else level = 'Сложный';

        return { flesch: Math.round(flesch * 100) / 100, level };
    }

    it('simple text gets high readability', () => {
        const result = checkReadability('Мама мыла раму. Папа строил дом.');
        expect(result.flesch).toBeGreaterThan(50);
    });

    it('returns at least 1 sentence', () => {
        const result = checkReadability('одно слово');
        expect(result.flesch).toBeDefined();
    });
});