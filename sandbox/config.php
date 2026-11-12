<?php
/**
 * Конфигурация inf-web API.
 * Содержит настройки сессии, базы данных, CORS и общие helper-функции.
 */

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

define('INF_BASE_URL', getenv('INF_BASE_URL') ?: 'https://inf.nayanovaacademy.ru');
define('INF_DB_PATH', __DIR__ . '/../data/inf.db');
define('AUTH_URL', 'https://auth.nayanovaacademy.ru');
define('SESSION_LIFETIME', 86400 * 30);
define('COURSE_KEY', 'inf');

// Количество занятий в курсе «Основы информационных технологий».
define('MAX_COURSE_LESSONS', 40);

$infHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$isLocalHost = $infHost === ''
    || preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/', $infHost);

$allowedOrigins = [
    'https://inf.nayanovaacademy.ru',
];
if ($isLocalHost) {
    $allowedOrigins[] = 'http://localhost:8000';
    $allowedOrigins[] = 'http://127.0.0.1:8000';
}
define('ALLOWED_ORIGINS', $allowedOrigins);

define('ALLOWED_SERVER_IPS', array_merge(
    ['79.143.31.184'],
    $isLocalHost ? ['127.0.0.1', '::1'] : []
));

if (session_status() === PHP_SESSION_NONE) {
    session_name('inf_session');
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path' => '/',
        'secure' => !$isLocalHost,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.use_strict_mode', '1');
    session_start();
}

function jsonResponse(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function setCorsHeaders(): void
{
    header('Vary: Origin');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
}

/**
 * Простой файловый rate-limit для API.
 */
function apiCheckRateLimit(string $scope, int $limit = 60, int $window = 60): void
{
    $dir = __DIR__ . '/../data/.ratelimit';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return;
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $file = $dir . '/' . md5($scope . '|' . $ip) . '.json';

    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return;
    }
    flock($handle, LOCK_EX);

    $now = time();
    $timestamps = [];
    $content = stream_get_contents($handle);
    if ($content !== false && $content !== '') {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $timestamps = array_values(array_filter($decoded, function ($ts) use ($now, $window) {
                return is_numeric($ts) && ($now - (int) $ts) < $window;
            }));
        }
    }

    if (count($timestamps) >= $limit) {
        $retryAfter = $window - ($now - (int) $timestamps[0]);
        flock($handle, LOCK_UN);
        fclose($handle);
        header('Retry-After: ' . max(0, $retryAfter));
        jsonResponse(['error' => 'Слишком много запросов. Повторите через ' . max(1, $retryAfter) . ' сек.'], 429);
    }

    $timestamps[] = $now;
    ftruncate($handle, 0);
    rewind($handle);
    fwrite($handle, json_encode($timestamps, JSON_UNESCAPED_UNICODE));
    flock($handle, LOCK_UN);
    fclose($handle);
}
