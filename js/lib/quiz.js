// Система интерактивных квизов для inf-web
import { escapeHTML } from './utils.js';

export function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a;
}

export function buildQuiz(container, rawQuestions) {
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

    const state = {
        current: 0,
        total: shuffledOptions.length,
        answers: [],
        answered: false,
        finished: false
    };

    container.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'quiz-header';
    header.innerHTML = '<h4>\u{1F9E0} \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u0432\u043E\u0438 \u0437\u043D\u0430\u043D\u0438\u044F</h4>';
    container.appendChild(header);

    const counter = document.createElement('div');
    counter.className = 'quiz-counter';
    container.appendChild(counter);

    const body = document.createElement('div');
    body.className = 'quiz-body';
    container.appendChild(body);

    const nav = document.createElement('div');
    nav.className = 'quiz-nav';
    container.appendChild(nav);

    const result = document.createElement('div');
    result.className = 'quiz-final-result';
    container.appendChild(result);

    function render() {
        if (state.finished) {
            showResults();
            return;
        }

        const q = shuffledOptions[state.current];
        const num = state.current + 1;

        counter.textContent = '\u0412\u043E\u043F\u0440\u043E\u0441 ' + num + ' \u0438\u0437 ' + state.total;

        let html = '<p class="quiz-question-text">' + escapeHTML(q.q) + '</p>';
        html += '<div class="quiz-options">';
        for (let i = 0; i < q.options.length; i++) {
            const checked = state.answers[state.current] === i ? ' checked' : '';
            let cls = '';
            if (state.answered) {
                if (i === q.correct) cls = ' correct';
                else if (i === state.answers[state.current]) cls = ' wrong';
            }
            html += '<label class="quiz-option' + cls + '">';
            html += '<input type="radio" name="quiz-q" value="' + i + '"' + checked + (state.answered ? ' disabled' : '') + '>';
            html += '<span class="quiz-option-label">' + escapeHTML(q.options[i]) + '</span>';
            html += '</label>';
        }
        html += '</div>';

        if (state.answered) {
            html += '<div class="quiz-explanation">' + escapeHTML(q.explanation) + '</div>';
        }

        body.innerHTML = html;

        if (!state.answered) {
            const radios = body.querySelectorAll('input[name="quiz-q"]');
            for (let i = 0; i < radios.length; i++) {
                radios[i].addEventListener('change', function() {
                    state.answers[state.current] = parseInt(this.value);
                    state.answered = true;
                    render();
                });
            }
        }

        renderNav();
    }

    function renderNav() {
        let html = '';
        if (state.current > 0 && !state.answered) {
            html += '<button class="quiz-btn quiz-btn-secondary" id="quiz-prev">\u041D\u0430\u0437\u0430\u0434</button> ';
        }
        if (state.answered && state.current < state.total - 1) {
            html += '<button class="quiz-btn" id="quiz-next">\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0432\u043E\u043F\u0440\u043E\u0441</button>';
        }
        if (state.answered && state.current === state.total - 1) {
            html += '<button class="quiz-btn quiz-btn-finish" id="quiz-finish">\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C</button>';
        }
        nav.innerHTML = html;

        const prevBtn = document.getElementById('quiz-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (state.current > 0) {
                    state.current--;
                    state.answered = false;
                    render();
                }
            });
        }

        const nextBtn = document.getElementById('quiz-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (state.current < state.total - 1) {
                    state.current++;
                    state.answered = false;
                    render();
                }
            });
        }

        const finishBtn = document.getElementById('quiz-finish');
        if (finishBtn) {
            finishBtn.addEventListener('click', function() {
                state.finished = true;
                render();
            });
        }
    }

    function showResults() {
        let correct = 0;
        for (let i = 0; i < shuffledOptions.length; i++) {
            if (state.answers[i] === shuffledOptions[i].correct) correct++;
        }
        const total = shuffledOptions.length;
        const percentage = Math.round((correct / total) * 100);

        let grade;
        if (percentage >= 90) grade = '\u043E\u0442\u043B\u0438\u0447\u043D\u043E!';
        else if (percentage >= 70) grade = '\u0445\u043E\u0440\u043E\u0448\u043E!';
        else if (percentage >= 50) grade = '\u043D\u0435\u043F\u043B\u043E\u0445\u043E.';
        else grade = '\u043D\u0443\u0436\u043D\u043E \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B.';

        counter.textContent = '';
        body.innerHTML = '<div class="quiz-final"><h4>\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442: ' + correct + ' \u0438\u0437 ' + total + '</h4><p>' + percentage + '% \u2014 ' + grade + '</p></div>';
        nav.innerHTML = '<button class="quiz-btn" id="quiz-restart">\u041F\u0440\u043E\u0439\u0442\u0438 \u0437\u0430\u043D\u043E\u0432\u043E</button>';

        const restartBtn = document.getElementById('quiz-restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                buildQuiz(container, rawQuestions);
            });
        }
    }

    render();
}

export function initQuiz(container) {
    const topicId = container.getAttribute('data-topic');
    if (!topicId) return;

    // Load from inline data or JSON
    if (typeof QUIZ_DATA !== 'undefined' && QUIZ_DATA[topicId]) {
        const questions = QUIZ_DATA[topicId];
        if (!questions || questions.length === 0) {
            container.innerHTML = '<p class="quiz-empty">Вопросы пока не добавлены.</p>';
            return;
        }
        buildQuiz(container, questions);
        return;
    }

    // Try to load from JSON
    fetch('/data/quizzes.json')
        .then(function(response) {
            if (!response.ok) throw new Error('No quiz data');
            return response.json();
        })
        .then(function(data) {
            const quiz = data.quizzes[topicId];
            if (quiz && quiz.questions.length > 0) {
                buildQuiz(container, quiz.questions);
            } else {
                container.innerHTML = '<p class="quiz-empty">Вопросы пока не добавлены.</p>';
            }
        })
        .catch(function() {
            container.innerHTML = '<p class="quiz-empty">Вопросы пока не добавлены.</p>';
        });
}

// Auto-init all quiz containers
export function initAllQuizzes() {
    const containers = document.querySelectorAll('.quiz-container');
    for (let i = 0; i < containers.length; i++) {
        initQuiz(containers[i]);
    }
}