'use strict';

const LESSONS = [
  { num: 1, title: '1. Ранние вычисления' },
  { num: 2, title: '2. Электронные вычисления' },
  { num: 3, title: '3. Логика из проводов' },
  { num: 4, title: '4. Всё — числа' },
  { num: 5, title: '5. АЛУ' },
  { num: 6, title: '6. Регистры и память' },
  { num: 7, title: '7. Процессор' },
  { num: 8, title: '8. Из чего состоит программа' },
  { num: 9, title: '9. Конвейер, кэш, предсказания' },
  { num: 10, title: '10. Первые программы' },
  { num: 11, title: '11. Языки программирования' },
  { num: 12, title: '12. Переменные и функции' },
  { num: 13, title: '13. Алгоритмы' },
  { num: 14, title: '14. Структуры данных' },
  { num: 15, title: '15. Машина Тьюринга' },
  { num: 16, title: '16. Инженерия ПО' },
  { num: 17, title: '17. Интегральные схемы' },
  { num: 18, title: '18. Операционные системы' },
  { num: 19, title: '19. Память и хранение' },
  { num: 20, title: '20. Файловые системы' },
  { num: 21, title: '21. Сжатие информации' },
  { num: 22, title: '22. Командная строка' },
  { num: 23, title: '23. Экраны и графика' },
  { num: 24, title: '24. Холодная война' },
  { num: 25, title: '25. Персональные компьютеры' },
  { num: 26, title: '26. Графические интерфейсы' },
  { num: 27, title: '27. Трёхмерная графика' },
  { num: 28, title: '28. Компьютерные сети' },
  { num: 29, title: '29. Интернет' },
  { num: 30, title: '30. Всемирная паутина' },
  { num: 31, title: '31. Кибербезопасность' },
  { num: 32, title: '32. Хакеры' },
  { num: 33, title: '33. Криптография' },
  { num: 34, title: '34. Машинное обучение' },
  { num: 35, title: '35. Компьютерное зрение' },
  { num: 36, title: '36. Обработка текста' },
  { num: 37, title: '37. Роботы' },
  { num: 38, title: '38. Психология вычислений' },
  { num: 39, title: '39. Технологии в образовании' },
  { num: 40, title: '40. Будущее вычислений' }
];

const groupSelect = document.getElementById('group-select');
const lessonFrom = document.getElementById('lesson-from');
const lessonTo = document.getElementById('lesson-to');
const loadBtn = document.getElementById('load-btn');
const statusEl = document.getElementById('status');
const tableContainer = document.getElementById('table-container');
const authStatus = document.getElementById('auth-status');

const markSection = document.getElementById('mark-section');
const markStudent = document.getElementById('mark-student');
const markLesson = document.getElementById('mark-lesson');
const markScore = document.getElementById('mark-score');
const markCompleted = document.getElementById('mark-completed');
const markBtn = document.getElementById('mark-btn');
const markStatus = document.getElementById('mark-status');
const quickMode = document.getElementById('quick-mode');
const quickHint = document.getElementById('quick-hint');
const clearMode = document.getElementById('clear-mode');
const onlyQuizzes = document.getElementById('only-quizzes');

const recentBtn = document.getElementById('recent-btn');
const recentCsvBtn = document.getElementById('recent-csv-btn');
const recentLimit = document.getElementById('recent-limit');
const recentStatus = document.getElementById('recent-status');
const recentTableContainer = document.getElementById('recent-table-container');
let recentRows = [];

function escapeHtml(value) {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function apiGet(url) {
  return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
    .then(function (response) {
      return response.json().catch(function () { return null; });
    })
    .catch(function () { return null; });
}

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso.replace(' ', 'T') + 'Z');
  if (isNaN(date.getTime())) return iso;
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return dd + '.' + mm + '.' + date.getFullYear() + ' ' + hh + ':' + mi;
}

function lessonLabel(num) {
  const lesson = LESSONS.find(function (item) { return item.num === num; });
  return lesson ? lesson.title : ('Занятие ' + num);
}

function scoreClass(score) {
  if (score === null || score === undefined) return 'score-none';
  if (score === 100) return 'score-100';
  if (score > 0) return 'score-high';
  return 'score-zero';
}

function updateQuickHint() {
  if (quickMode.checked) {
    quickHint.textContent = 'Быстрый ввод включён: клик по ячейке ставит 100% и отметку «пройдено».';
  } else if (clearMode.checked) {
    quickHint.textContent = 'Режим «Убирать результаты» включён: клик по ячейке снимает результат.';
  } else {
    quickHint.textContent = 'Клик по ячейке квиза — попытки. «Быстрый ввод» ставит 100%, «Убирать результаты» снимает результат.';
  }
}

quickMode.addEventListener('change', function () {
  if (quickMode.checked) clearMode.checked = false;
  updateQuickHint();
});
clearMode.addEventListener('change', function () {
  if (clearMode.checked) quickMode.checked = false;
  updateQuickHint();
});
updateQuickHint();

function populateLessonSelects() {
  let html = '';
  LESSONS.forEach(function (lesson) {
    html += '<option value="' + lesson.num + '">' + escapeHtml(lesson.title) + '</option>';
  });
  lessonFrom.innerHTML = html;
  lessonTo.innerHTML = html;
  lessonFrom.value = '1';
  lessonTo.value = '40';
  markLesson.innerHTML = html;
  markLesson.value = '1';
}
populateLessonSelects();

function getLessonRange(maxLessonWithQuizzes) {
  if (onlyQuizzes.checked) {
    const max = maxLessonWithQuizzes > 0 ? maxLessonWithQuizzes : 40;
    const range = [];
    for (let i = 1; i <= max; i += 1) range.push(i);
    return range;
  }
  let from = parseInt(lessonFrom.value, 10) || 1;
  let to = parseInt(lessonTo.value, 10) || 40;
  if (from > to) {
    const temp = from;
    from = to;
    to = temp;
  }
  const range = [];
  for (let i = from; i <= to; i += 1) range.push(i);
  return range;
}

function checkAuth() {
  return apiGet('/sandbox/auth_check.php').then(function (data) {
    if (!data || !data.authenticated) {
      authStatus.innerHTML = 'Требуется авторизация. <a href="https://auth.nayanovaacademy.ru/index.php?page=login&redirect=' +
        encodeURIComponent(window.location.href) + '">Войти</a>';
      loadBtn.disabled = true;
      return null;
    }
    if (!data.user || !data.user.is_admin) {
      authStatus.textContent = 'Доступ запрещён: нужны права администратора.';
      loadBtn.disabled = true;
      return null;
    }
    authStatus.innerHTML = 'Вы вошли как <strong>' + escapeHtml(data.user.display_name || data.user.login) + '</strong>' +
      (data.logout_url ? ' · <a href="' + escapeHtml(data.logout_url) + '">Выйти</a>' : '');
    return data;
  });
}

function loadGroups() {
  apiGet('/sandbox/admin_quiz.php?action=groups').then(function (data) {
    if (!data || !data.groups || !data.groups.length) {
      groupSelect.innerHTML = '<option value="">Нет классов</option>';
      return;
    }
    let html = '<option value="">Выберите класс</option>';
    data.groups.forEach(function (group) {
      html += '<option value="' + group.id + '">' + escapeHtml(group.name || ('Класс #' + group.id)) + '</option>';
    });
    groupSelect.innerHTML = html;
  });
}

function sendMarkQuiz(userId, lessonNumber, score, completed) {
  return fetch('/sandbox/admin_quiz.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_quiz',
      user_id: userId,
      lesson_number: lessonNumber,
      quiz_score: score,
      completed: completed ? 1 : 0
    })
  }).then(function (response) { return response.json(); });
}

function quickMark(cell, userId, lessonNumber) {
  if (cell.dataset.busy === '1') return;
  cell.dataset.busy = '1';
  const previous = cell.textContent;
  cell.textContent = '...';
  sendMarkQuiz(userId, lessonNumber, 100, true).then(function (data) {
    cell.dataset.busy = '';
    if (!data || !data.success) {
      cell.textContent = previous;
      markStatus.innerHTML = '<span class="error">' + escapeHtml((data && data.error) || 'Ошибка записи') + '</span>';
      return;
    }
    cell.textContent = '100';
    cell.className = 'score score-100';
    cell.title = 'Записано 100%';
    loadBtn.click();
  }).catch(function () {
    cell.dataset.busy = '';
    cell.textContent = previous;
    markStatus.innerHTML = '<span class="error">Ошибка сети</span>';
  });
}

function clearMark(cell, userId, lessonNumber) {
  if (cell.dataset.busy === '1') return;
  const student = (window.__currentStudents || []).find(function (item) { return item.id === userId; });
  const studentName = student ? student.name : String(userId);
  if (!window.confirm('Снять результат: ' + studentName + ' — ' + lessonLabel(lessonNumber) + '?')) return;

  cell.dataset.busy = '1';
  const previous = cell.textContent;
  cell.textContent = '...';
  fetch('/sandbox/admin_quiz.php', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clear_quiz', user_id: userId, lesson_number: lessonNumber })
  }).then(function (response) { return response.json(); }).then(function (data) {
    cell.dataset.busy = '';
    if (!data || !data.success) {
      cell.textContent = previous;
      markStatus.innerHTML = '<span class="error">' + escapeHtml((data && data.error) || 'Ошибка снятия') + '</span>';
      return;
    }
    cell.textContent = '—';
    cell.className = 'score score-none';
    markStatus.textContent = data.deleted
      ? 'Результат снят: ' + studentName + ' — ' + lessonLabel(lessonNumber)
      : 'Результата для этого занятия не было.';
    loadBtn.click();
  }).catch(function () {
    cell.dataset.busy = '';
    cell.textContent = previous;
    markStatus.innerHTML = '<span class="error">Ошибка сети</span>';
  });
}

function buildAttemptsHtml(attempts) {
  if (!attempts || !attempts.length) return '<div class="empty">Нет попыток</div>';
  let html = '';
  attempts.forEach(function (attempt) {
    let details = '';
    if (attempt.answers && attempt.answers.length) {
      const wrong = attempt.answers.filter(function (item) { return !item.is_correct; }).length;
      details = ' · ошибок: ' + wrong;
    }
    html += '<div class="attempt-row">' +
      '<span class="attempt-score ' + scoreClass(attempt.score) + '">' + attempt.score + '%</span>' +
      '<span class="attempt-detail">' + attempt.correct_count + '/' + attempt.total_questions + details + '</span>' +
      '<span class="attempt-time">' + formatDate(attempt.attempted_at) + '</span>' +
      '</div>';
  });
  return html;
}

function showAttempts(userId, lessonNumber, anchorCell) {
  const container = document.getElementById('attempts-container');
  const existingId = 'attempts-' + userId + '-' + lessonNumber;
  const existing = document.getElementById(existingId);
  if (existing) {
    existing.classList.toggle('open');
    return;
  }

  const panel = document.createElement('div');
  panel.className = 'attempts-panel open';
  panel.id = existingId;
  const studentName = anchorCell.parentElement.querySelector('.student-name').textContent;
  panel.innerHTML = '<h4>' + escapeHtml(studentName) + ' — ' + escapeHtml(lessonLabel(lessonNumber)) +
    '</h4><div class="empty">Загрузка…</div>';
  container.innerHTML = '';
  container.appendChild(panel);

  apiGet('/sandbox/admin_quiz.php?action=attempts&user_id=' + userId + '&lesson_number=' + lessonNumber)
    .then(function (data) {
      if (!data || !data.attempts) {
        panel.innerHTML = '<h4>' + escapeHtml(studentName) + '</h4><div class="error">Ошибка загрузки</div>';
        return;
      }
      panel.innerHTML = '<h4>' + escapeHtml(studentName) + ' — ' + escapeHtml(lessonLabel(lessonNumber)) +
        ': попытки (' + data.attempts.length + ')</h4>' + buildAttemptsHtml(data.attempts);
    });
}

loadBtn.addEventListener('click', function () {
  const groupId = groupSelect.value;
  if (!groupId) {
    statusEl.innerHTML = '<span class="error">Выберите класс</span>';
    return;
  }

  statusEl.textContent = 'Загрузка…';
  tableContainer.style.display = 'none';
  loadBtn.disabled = true;

  apiGet('/sandbox/admin_quiz.php?action=class_progress&group_id=' + encodeURIComponent(groupId))
    .then(function (data) {
      loadBtn.disabled = false;
      if (!data || !data.students) {
        statusEl.innerHTML = '<span class="error">Ошибка загрузки данных</span>';
        return;
      }

      const students = data.students;
      window.__currentStudents = students;
      if (!students.length) {
        statusEl.textContent = 'В этом классе нет учеников';
        return;
      }

      const range = getLessonRange(data.max_lesson_with_quizzes || 0);
      let html = '<table><thead><tr><th class="student-name">Ученик</th>';
      range.forEach(function (num) {
        html += '<th class="lesson-header" title="' + escapeHtml(lessonLabel(num)) + '">' + num + '</th>';
      });
      html += '<th>Занятий</th></tr></thead><tbody>';

      students.forEach(function (student) {
        html += '<tr><td class="student-name">' + escapeHtml(student.name) + '</td>';
        let completedCount = 0;
        range.forEach(function (num) {
          const lesson = student.lessons[num] || {};
          const score = lesson.quiz_score !== undefined ? lesson.quiz_score : null;
          if (score === 100) completedCount += 1;
          const display = score !== null ? String(score) : '—';
          html += '<td class="score ' + scoreClass(score) + '" data-user="' + student.id +
            '" data-lesson="' + num + '" title="' +
            (score !== null ? 'Лучший балл: ' + score + '%' : 'Нет данных') + '">' + display + '</td>';
        });
        html += '<td class="completed-count">' + completedCount + '/' + range.length + '</td></tr>';
      });
      html += '</tbody></table><div id="attempts-container"></div>';

      tableContainer.innerHTML = html;
      tableContainer.style.display = 'block';
      statusEl.textContent = 'Класс: ' + groupSelect.options[groupSelect.selectedIndex].text +
        ' · учеников: ' + students.length + ' · занятий: ' + range.length;

      markSection.style.display = 'block';
      let options = '<option value="">— выберите ученика —</option>';
      students.forEach(function (student) {
        options += '<option value="' + student.id + '">' + escapeHtml(student.name) + '</option>';
      });
      markStudent.innerHTML = options;
      markStudent.value = '';
      markStatus.textContent = '';
      markBtn.disabled = false;

      tableContainer.querySelectorAll('td.score').forEach(function (cell) {
        cell.addEventListener('click', function () {
          const userId = parseInt(cell.getAttribute('data-user'), 10);
          const lessonNumber = parseInt(cell.getAttribute('data-lesson'), 10);
          if (quickMode.checked) {
            quickMark(cell, userId, lessonNumber);
          } else if (clearMode.checked) {
            clearMark(cell, userId, lessonNumber);
          } else {
            showAttempts(userId, lessonNumber, cell);
          }
        });
      });
    })
    .catch(function () {
      loadBtn.disabled = false;
      statusEl.innerHTML = '<span class="error">Ошибка сети</span>';
    });
});

markBtn.addEventListener('click', function () {
  const userId = parseInt(markStudent.value, 10);
  const lessonNumber = parseInt(markLesson.value, 10);
  const score = parseInt(markScore.value, 10);
  if (!userId) {
    markStatus.innerHTML = '<span class="error">Выберите ученика</span>';
    return;
  }
  if (isNaN(score) || score < 0 || score > 100) {
    markStatus.innerHTML = '<span class="error">Балл должен быть от 0 до 100</span>';
    return;
  }

  markBtn.disabled = true;
  markStatus.textContent = 'Сохранение…';
  sendMarkQuiz(userId, lessonNumber, score, markCompleted.checked).then(function (data) {
    markBtn.disabled = false;
    if (!data || !data.success) {
      markStatus.innerHTML = '<span class="error">' + escapeHtml((data && data.error) || 'Ошибка сохранения') + '</span>';
      return;
    }
    markStatus.textContent = 'Записано: ' + lessonLabel(lessonNumber) + ', ' + score + '%' +
      (data.completed === 1 ? ', пройдено' : '');
    loadBtn.click();
  }).catch(function () {
    markBtn.disabled = false;
    markStatus.innerHTML = '<span class="error">Ошибка сети</span>';
  });
});

recentBtn.addEventListener('click', function () {
  const limit = parseInt(recentLimit.value, 10) || 100;
  recentBtn.disabled = true;
  recentStatus.textContent = 'Загрузка…';
  recentTableContainer.style.display = 'none';

  apiGet('/sandbox/admin_quiz.php?action=recent&limit=' + limit).then(function (data) {
    recentBtn.disabled = false;
    if (!data || !data.recent) {
      recentStatus.innerHTML = '<span class="error">Ошибка загрузки данных</span>';
      return;
    }
    recentRows = data.recent;
    if (!recentRows.length) {
      recentStatus.textContent = 'Попыток пока нет';
      recentCsvBtn.disabled = true;
      return;
    }
    let html = '<table><thead><tr><th>Время</th><th>Ученик</th><th>Занятие</th><th>Балл, %</th>' +
      '<th>Лучший, %</th><th>Верно</th><th>Пройдено</th></tr></thead><tbody>';
    recentRows.forEach(function (row) {
      const best = row.best_score !== null && row.best_score !== undefined ? row.best_score : row.score;
      html += '<tr><td class="nowrap">' + formatDate(row.attempted_at) + '</td>' +
        '<td class="left">' + escapeHtml(row.name) + '</td>' +
        '<td>' + escapeHtml(lessonLabel(row.lesson_number)) + '</td>' +
        '<td class="score ' + scoreClass(row.score) + '">' + row.score + '</td>' +
        '<td class="score ' + scoreClass(best) + '">' + (row.best_score !== null && row.best_score !== undefined ? row.best_score : '—') + '</td>' +
        '<td>' + row.correct_count + '/' + row.total_questions + '</td>' +
        '<td>' + (row.completed === 1 ? '✔' : '—') + '</td></tr>';
    });
    html += '</tbody></table>';
    recentTableContainer.innerHTML = html;
    recentTableContainer.style.display = 'block';
    recentStatus.textContent = 'Загружено попыток: ' + recentRows.length;
    recentCsvBtn.disabled = false;
  }).catch(function () {
    recentBtn.disabled = false;
    recentStatus.innerHTML = '<span class="error">Ошибка сети</span>';
  });
});

recentCsvBtn.addEventListener('click', function () {
  if (!recentRows.length) return;
  const lines = [['Время', 'Ученик', 'Занятие', 'Балл %', 'Лучший %', 'Верно', 'Всего', 'Пройдено'].join(';')];
  recentRows.forEach(function (row) {
    const values = [
      formatDate(row.attempted_at),
      row.name,
      lessonLabel(row.lesson_number),
      row.score,
      row.best_score !== null && row.best_score !== undefined ? row.best_score : '',
      row.correct_count,
      row.total_questions,
      row.completed === 1 ? 'да' : 'нет'
    ];
    lines.push(values.map(function (value) {
      let text = String(value === null || value === undefined ? '' : value);
      if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    }).join(';'));
  });
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'inf-quiz-results.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
});

checkAuth().then(function (auth) {
  if (auth) loadGroups();
});
