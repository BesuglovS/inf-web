<?php
/**
 * SQLite singleton для inf-web.
 * Хранит прогресс и попытки прохождения квизов.
 */
class Database
{
    private static ?PDO $instance = null;

    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            $dbDir = dirname(INF_DB_PATH);
            if (!is_dir($dbDir) && !mkdir($dbDir, 0755, true) && !is_dir($dbDir)) {
                throw new RuntimeException("Не удалось создать директорию: {$dbDir}");
            }
            if (!is_writable($dbDir)) {
                throw new RuntimeException("Директория недоступна для записи: {$dbDir}");
            }

            self::$instance = new PDO('sqlite:' . INF_DB_PATH, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            self::$instance->exec('PRAGMA journal_mode=WAL');
            self::$instance->exec('PRAGMA foreign_keys=ON');
            self::$instance->exec('PRAGMA busy_timeout=5000');
        }
        return self::$instance;
    }

    public static function initialize(): void
    {
        $db = self::getInstance();
        $currentVersion = (int) $db->query('PRAGMA user_version')->fetchColumn();

        if ($currentVersion < 1) {
            $db->exec("
                CREATE TABLE IF NOT EXISTS progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    lesson_number INTEGER NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 0,
                    quiz_score INTEGER DEFAULT NULL,
                    completed_at DATETIME DEFAULT NULL,
                    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
                    UNIQUE(user_id, lesson_number)
                );

                CREATE TABLE IF NOT EXISTS quiz_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    lesson_number INTEGER NOT NULL,
                    score INTEGER NOT NULL,
                    total_questions INTEGER NOT NULL,
                    correct_count INTEGER NOT NULL,
                    answers TEXT DEFAULT NULL,
                    attempted_at DATETIME NOT NULL DEFAULT (datetime('now'))
                );

                CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
                CREATE INDEX IF NOT EXISTS idx_progress_lesson ON progress(user_id, lesson_number);
                CREATE INDEX IF NOT EXISTS idx_progress_completed_at ON progress(user_id, completed_at);
                CREATE INDEX IF NOT EXISTS idx_qa_user_lesson ON quiz_attempts(user_id, lesson_number);
                CREATE INDEX IF NOT EXISTS idx_qa_user ON quiz_attempts(user_id);
            ");

            $db->exec('PRAGMA user_version = 1');
        }
    }
}
