/**
 * Проверка банка вопросов самопроверки.
 *
 * Запуск: node scripts/validate-quizzes.mjs
 * Проверяет, что для каждого занятия есть 10 вопросов с четырьмя вариантами,
 * корректным индексом ответа и непустым пояснением.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'data', 'quizzes');
const errors = [];
const seen = new Map();

for (let n = 1; n <= 40; n += 1) {
    const name = `${String(n).padStart(2, '0')}.json`;
    const file = path.join(dir, name);

    if (!fs.existsSync(file)) {
        errors.push(`${name}: файл не найден`);
        continue;
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
        errors.push(`${name}: невалидный JSON — ${error.message}`);
        continue;
    }

    if (!Array.isArray(data) || data.length !== 10) {
        errors.push(`${name}: ожидается массив из 10 вопросов`);
        continue;
    }

    data.forEach((item, index) => {
        const where = `${name} #${index + 1}`;
        if (typeof item.question !== 'string' || item.question.trim().length < 8) {
            errors.push(`${where}: пустой или слишком короткий вопрос`);
        }
        if (!Array.isArray(item.options) || item.options.length !== 4) {
            errors.push(`${where}: нужно ровно 4 варианта`);
        } else if (new Set(item.options.map((option) => option.trim().toLowerCase())).size !== 4) {
            errors.push(`${where}: варианты повторяются`);
        }
        if (!Number.isInteger(item.correct) || item.correct < 0 || item.correct > 3) {
            errors.push(`${where}: correct должен быть целым от 0 до 3`);
        }
        if (typeof item.explanation !== 'string' || item.explanation.trim().length < 25) {
            errors.push(`${where}: нет пояснения`);
        }

        const key = item.question.trim().toLowerCase();
        if (seen.has(key)) {
            errors.push(`${where}: повтор вопроса из ${seen.get(key)}`);
        } else {
            seen.set(key, where);
        }
    });
}

if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
}

console.log(`OK: 40 занятий, ${seen.size} вопросов, по 4 варианта ответа.`);
