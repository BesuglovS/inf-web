<?php
/**
 * API квизов inf-web: отдаёт вопросы, проверяет ответы и сохраняет результат.
 *
 * GET  ?lesson_number=N
 *      → {lesson_number, authenticated, questions:[{question, options}]}
 * POST {action:'answer', lesson_number, question_idx, selected}
 *      → {question_idx, is_correct, correct, explanation}
 * POST {action:'reset', lesson_number}
 *      → {ok:true}
 * POST {action:'grade', lesson_number}
 *      → {lesson_number, score, total, correct_count, saved, best_score, completed}
 *
 * Ответы и правильные варианты не отдаются клиенту до проверки.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Auth.php';
require_once __DIR__ . '/AuthClient.php';
require_once __DIR__ . '/ProgressReporter.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    setCorsHeaders();
    http_response_code(200);
    exit;
}

setCorsHeaders();
Database::initialize();
apiCheckRateLimit('quiz', 240, 60);

function quizSessionKey(int $lessonNumber): string
{
    return 'quiz_answers_' . $lessonNumber;
}

function quizRecordedAnswers(int $lessonNumber): array
{
    $key = quizSessionKey($lessonNumber);
    return (isset($_SESSION[$key]) && is_array($_SESSION[$key])) ? $_SESSION[$key] : [];
}

function quizRecordAnswer(int $lessonNumber, int $questionIdx, int $selected): int
{
    $key = quizSessionKey($lessonNumber);
    if (!isset($_SESSION[$key]) || !is_array($_SESSION[$key])) {
        $_SESSION[$key] = [];
    }
    if (!array_key_exists($questionIdx, $_SESSION[$key])) {
        $_SESSION[$key][$questionIdx] = $selected;
    }
    return (int) $_SESSION[$key][$questionIdx];
}

function quizResetAnswers(int $lessonNumber): void
{
    unset($_SESSION[quizSessionKey($lessonNumber)]);
}

function quizNormalizeLessonNumber($raw): ?int
{
    if (!is_int($raw) && !(is_string($raw) && is_numeric($raw))) {
        return null;
    }
    $n = (int) $raw;
    if ($n < 1 || $n > MAX_COURSE_LESSONS) {
        return null;
    }
    return $n;
}

/**
 * @return array<int, array<string, mixed>>|null
 */
function quizLoadQuestions(int $lessonNumber): ?array
{
    $path = __DIR__ . '/../data/quizzes/' . str_pad((string) $lessonNumber, 2, '0', STR_PAD_LEFT) . '.json';
    if (!is_file($path)) {
        return null;
    }
    $data = json_decode((string) file_get_contents($path), true);
    if (!is_array($data) || $data === []) {
        return null;
    }
    return array_values($data);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $lessonNumber = quizNormalizeLessonNumber($_GET['lesson_number'] ?? null);
    if ($lessonNumber === null) {
        jsonResponse(['error' => 'lesson_number должен быть от 1 до ' . MAX_COURSE_LESSONS], 400);
    }

    $questions = quizLoadQuestions($lessonNumber);
    if ($questions === null) {
        jsonResponse(['error' => 'Вопросы не найдены'], 404);
    }

    $public = [];
    foreach ($questions as $q) {
        $public[] = [
            'question' => (string) ($q['question'] ?? ''),
            'options' => array_values(array_map('strval', (array) ($q['options'] ?? []))),
        ];
    }

    quizResetAnswers($lessonNumber);

    jsonResponse([
        'lesson_number' => $lessonNumber,
        'questions' => $public,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
        jsonResponse(['error' => 'Content-Type must be application/json'], 415);
    }
    $input = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($input)) {
        jsonResponse(['error' => 'Некорректный JSON'], 400);
    }

    $action = (string) ($input['action'] ?? '');
    $lessonNumber = quizNormalizeLessonNumber($input['lesson_number'] ?? null);
    if ($lessonNumber === null) {
        jsonResponse(['error' => 'lesson_number должен быть от 1 до ' . MAX_COURSE_LESSONS], 400);
    }

    $questions = quizLoadQuestions($lessonNumber);
    if ($questions === null) {
        jsonResponse(['error' => 'Вопросы не найдены'], 404);
    }
    $total = count($questions);

    if ($action === 'reset') {
        quizResetAnswers($lessonNumber);
        jsonResponse(['ok' => true]);
    }

    if ($action === 'answer') {
        $rawIdx = $input['question_idx'] ?? null;
        $rawSelected = $input['selected'] ?? null;
        if (!is_numeric($rawIdx) || !is_numeric($rawSelected)) {
            jsonResponse(['error' => 'question_idx и selected обязательны'], 400);
        }
        $questionIdx = (int) $rawIdx;
        $selected = (int) $rawSelected;
        if ($questionIdx < 0 || $questionIdx >= $total) {
            jsonResponse(['error' => 'question_idx вне диапазона'], 400);
        }
        $question = $questions[$questionIdx];
        $optionCount = count((array) ($question['options'] ?? []));
        if ($selected < 0 || $selected >= $optionCount) {
            jsonResponse(['error' => 'selected вне диапазона'], 400);
        }

        $correct = (int) ($question['correct'] ?? -1);
        $selected = quizRecordAnswer($lessonNumber, $questionIdx, $selected);

        jsonResponse([
            'question_idx' => $questionIdx,
            'is_correct' => $selected === $correct,
            'correct' => $correct,
            'explanation' => (string) ($question['explanation'] ?? ''),
        ]);
    }

    if ($action === 'grade') {
        $answers = quizRecordedAnswers($lessonNumber);
        $correctCount = 0;
        $log = [];
        foreach ($questions as $i => $question) {
            $selected = array_key_exists($i, $answers) ? (int) $answers[$i] : -1;
            $correct = (int) ($question['correct'] ?? -1);
            $isCorrect = $selected === $correct;
            if ($isCorrect) {
                $correctCount++;
            }
            $log[] = [
                'question_idx' => $i,
                'selected' => $selected,
                'correct' => $correct,
                'is_correct' => $isCorrect,
            ];
        }

        $score = $total > 0 ? (int) round($correctCount / $total * 100) : 0;
        $saved = false;
        $bestScore = null;
        $completed = 0;
        $saveError = null;

        $user = AuthClient::check();
        $userId = $user !== null && isset($user['id']) ? (int) $user['id'] : null;

        if ($userId !== null) {
            try {
                $db = Database::getInstance();
                $db->beginTransaction();

                $answersJson = json_encode($log, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                $stmt = $db->prepare(
                    "INSERT INTO quiz_attempts
                        (user_id, lesson_number, score, total_questions, correct_count, answers)
                     VALUES (?, ?, ?, ?, ?, ?)"
                );
                $stmt->execute([$userId, $lessonNumber, $score, $total, $correctCount, $answersJson]);

                $completedNow = $score === 100 ? 1 : 0;
                $stmt = $db->prepare(
                    "INSERT INTO progress
                        (user_id, lesson_number, completed, quiz_score, completed_at, updated_at)
                     VALUES (?, ?, ?, ?,
                       CASE WHEN CAST(? AS INTEGER) = 1 THEN datetime('now') ELSE NULL END,
                       datetime('now'))
                     ON CONFLICT(user_id, lesson_number) DO UPDATE SET
                       completed = CASE WHEN excluded.completed = 1 THEN 1 ELSE progress.completed END,
                       quiz_score = CASE
                         WHEN excluded.quiz_score IS NOT NULL
                              AND (progress.quiz_score IS NULL OR excluded.quiz_score > progress.quiz_score)
                         THEN excluded.quiz_score
                         ELSE progress.quiz_score
                       END,
                       completed_at = CASE
                         WHEN excluded.completed = 1 AND progress.completed_at IS NULL
                         THEN datetime('now')
                         ELSE progress.completed_at
                       END,
                       updated_at = datetime('now')"
                );
                $stmt->execute([$userId, $lessonNumber, $completedNow, $score, $completedNow]);

                $stmt = $db->prepare(
                    'SELECT quiz_score, completed FROM progress WHERE user_id = ? AND lesson_number = ?'
                );
                $stmt->execute([$userId, $lessonNumber]);
                $progressRow = $stmt->fetch();
                $bestScore = $progressRow && $progressRow['quiz_score'] !== null
                    ? (int) $progressRow['quiz_score']
                    : $score;
                $completed = $progressRow ? (int) $progressRow['completed'] : $completedNow;

                $db->commit();
                $saved = true;

                try {
                    $stmt = $db->prepare('SELECT COUNT(*) FROM progress WHERE user_id = ? AND completed = 1');
                    $stmt->execute([$userId]);
                    $done = (int) $stmt->fetchColumn();
                    ProgressReporter::report($userId, COURSE_KEY, $done, MAX_COURSE_LESSONS);
                } catch (Throwable $e) {
                    error_log('inf quiz progress report: ' . $e->getMessage());
                }
            } catch (Throwable $e) {
                if (isset($db) && $db->inTransaction()) {
                    $db->rollBack();
                }
                error_log('inf quiz grade: ' . $e->getMessage());
                $saveError = 'Не удалось сохранить результат. Попробуйте позже.';
            }
        }

        quizResetAnswers($lessonNumber);

        jsonResponse([
            'lesson_number' => $lessonNumber,
            'score' => $score,
            'total' => $total,
            'correct_count' => $correctCount,
            'saved' => $saved,
            'best_score' => $bestScore,
            'completed' => $completed,
            'error' => $saveError,
        ]);
    }

    jsonResponse(['error' => 'Неизвестное действие'], 400);
}

jsonResponse(['error' => 'Метод не поддерживается'], 405);
