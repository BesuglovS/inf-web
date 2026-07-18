import { describe, it, expect } from 'vitest';

// Pure-function tests that don't require DOM
// DOM-dependent functions are tested in DOM-tests

const UNITS = { bit: 1, byte: 8, kb: 8 * 1024, mb: 8 * 1024 * 1024, gb: 8 * 1024 * 1024 * 1024 };

function calcBits(value, unit) {
    return value * UNITS[unit];
}

function bitsToUnit(bits, unit) {
    return bits / UNITS[unit];
}

describe('Unit Conversion Logic', () => {
    it('1 byte = 8 bits', () => {
        expect(calcBits(1, 'byte')).toBe(8);
    });

    it('1 KB = 1024 bytes = 8192 bits', () => {
        expect(calcBits(1, 'kb')).toBe(8192);
    });

    it('1 MB = 1024 KB = 8388608 bits', () => {
        expect(calcBits(1, 'mb')).toBe(8388608);
    });

    it('bits to KB conversion', () => {
        expect(bitsToUnit(8192, 'kb')).toBe(1);
    });

    it('bits to MB conversion', () => {
        expect(bitsToUnit(8388608, 'mb')).toBe(1);
    });
});

describe('RGB Color Conversion', () => {
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(function(x) {
            return x.toString(16).padStart(2, '0');
        }).join('');
    }

    it('black is #000000', () => {
        expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('white is #ffffff', () => {
        expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    });

    it('red is #ff0000', () => {
        expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    });

    it('green is #00ff00', () => {
        expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    });
});

describe('Image Volume Calculation', () => {
    function calcImageBits(width, height, depth) {
        return width * height * depth;
    }

    it('800x600 24-bit image = 11520000 bits', () => {
        expect(calcImageBits(800, 600, 24)).toBe(11520000);
    });

    it('1920x1080 24-bit image = 49766400 bits', () => {
        expect(calcImageBits(1920, 1080, 24)).toBe(49766400);
    });

    it('single pixel 1-bit = 1 bit', () => {
        expect(calcImageBits(1, 1, 1)).toBe(1);
    });
});

describe('Audio Volume Calculation', () => {
    function calcAudioBits(freq, depth, channels, seconds) {
        return freq * depth * channels * seconds;
    }

    it('44100 Hz, 16 bit, stereo, 60 sec = 84672000 bits', () => {
        expect(calcAudioBits(44100, 16, 2, 60)).toBe(84672000);
    });

    it('8000 Hz, 8 bit, mono, 10 sec = 640000 bits', () => {
        expect(calcAudioBits(8000, 8, 1, 10)).toBe(640000);
    });
});

describe('Text Volume (Unicode)', () => {
    function calcUTF8Bytes(str) {
        let bytes = 0;
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code <= 0x7F) bytes += 1;
            else if (code <= 0x7FF) bytes += 2;
            else if (code <= 0xFFFF) bytes += 3;
            else bytes += 4;
        }
        return bytes;
    }

    it('ASCII character "A" = 1 byte in UTF-8', () => {
        expect(calcUTF8Bytes('A')).toBe(1);
    });

    it('Cyrillic "Б" = 2 bytes in UTF-8', () => {
        expect(calcUTF8Bytes('Б')).toBe(2);
    });

    it('"Hello" = 5 bytes', () => {
        expect(calcUTF8Bytes('Hello')).toBe(5);
    });

    it('"Привет" = 12 bytes (6 Cyrillic chars * 2)', () => {
        expect(calcUTF8Bytes('Привет')).toBe(12);
    });

    it('mixed "ABCабв" = 9 bytes (3 ASCII + 3 Cyrillic * 2)', () => {
        expect(calcUTF8Bytes('ABCабв')).toBe(9);
    });
});

describe('Password Strength Check', () => {
    function checkStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    }

    const levels = ['Очень слабый', 'Слабый', 'Средний', 'Надёжный', 'Очень надёжный', 'Максимальный'];

    it('"123" = очень слабый (0)', () => {
        expect(levels[checkStrength('123')]).toBe('Очень слабый');
    });

    it('"12345678" = слабый (1)', () => {
        expect(levels[checkStrength('12345678')]).toBe('Слабый');
    });

    it('"Password1" = надёжный (3)', () => {
        expect(levels[checkStrength('Password1')]).toBe('Надёжный');
    });

    it('"P@ssw0rd123" = очень надёжный (4)', () => {
        expect(levels[checkStrength('P@ssw0rd123')]).toBe('Очень надёжный');
    });
});

describe('Caesar Cipher', () => {
    const alphabet = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

    function caesar(str, shift) {
        let output = '';
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
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
        return output;
    }

    it('"А" shift 1 = "Б"', () => {
        expect(caesar('А', 1)).toBe('Б');
    });

    it('"Я" shift 1 = "А" (wraps)', () => {
        expect(caesar('Я', 1)).toBe('А');
    });

    it('"АБВ" shift 1 = "БВГ"', () => {
        expect(caesar('АБВ', 1)).toBe('БВГ');
    });

    it('spaces and punctuation preserved', () => {
        expect(caesar('Привет, Мир!', 3)).toBe('Тулзёх, Плу!');
    });
});

describe('Base Conversion', () => {
    it('binary "1010" = decimal 10', () => {
        expect(parseInt('1010', 2)).toBe(10);
    });

    it('hex "FF" = decimal 255', () => {
        expect(parseInt('FF', 16)).toBe(255);
    });

    it('octal "77" = decimal 63', () => {
        expect(parseInt('77', 8)).toBe(63);
    });

    it('decimal 255 to hex = "FF"', () => {
        expect((255).toString(16).toUpperCase()).toBe('FF');
    });

    it('decimal 10 to binary = "1010"', () => {
        expect((10).toString(2)).toBe('1010');
    });
});

describe('Logic Operations', () => {
    it('AND: 1 AND 1 = 1', () => {
        expect(1 && 1 ? 1 : 0).toBe(1);
    });

    it('AND: 1 AND 0 = 0', () => {
        expect(1 && 0 ? 1 : 0).toBe(0);
    });

    it('OR: 0 OR 1 = 1', () => {
        expect(0 || 1 ? 1 : 0).toBe(1);
    });

    it('OR: 0 OR 0 = 0', () => {
        expect(0 || 0 ? 1 : 0).toBe(0);
    });

    it('implication: 1 -> 0 = 0', () => {
        const a = 1, b = 0;
        expect(a === 1 && b === 0 ? 0 : 1).toBe(0);
    });

    it('implication: 1 -> 1 = 1', () => {
        const a = 1, b = 1;
        expect(a === 1 && b === 0 ? 0 : 1).toBe(1);
    });
});

describe('Quiz Shuffle', () => {
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

    it('shuffle preserves all elements', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffle(input);
        expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('shuffle preserves length', () => {
        const input = [1, 2, 3];
        expect(shuffle(input).length).toBe(3);
    });

    it('shuffle of empty array returns empty', () => {
        expect(shuffle([])).toEqual([]);
    });
});

describe('Binary to Decimal', () => {
    it('"1" = 1', () => {
        expect(parseInt('1', 2)).toBe(1);
    });

    it('"10000000" = 128', () => {
        expect(parseInt('10000000', 2)).toBe(128);
    });

    it('"11111111" = 255', () => {
        expect(parseInt('11111111', 2)).toBe(255);
    });
});

describe('Video Volume', () => {
    function calcVideoVolume(width, height, depth, fps, duration) {
        return width * height * depth * fps * duration;
    }

    it('1920x1080 24bit 30fps 60sec = ~89.7 Gbits', () => {
        const bits = calcVideoVolume(1920, 1080, 24, 30, 60);
        expect(bits).toBe(89579520000);
    });
});