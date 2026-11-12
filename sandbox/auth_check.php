<?php
/**
 * Проверка авторизации inf-web через auth-web.
 * Возвращает только безопасный набор полей пользователя.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/AuthClient.php';

header('Content-Type: application/json; charset=utf-8');
setCorsHeaders();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedHost = 'inf.nayanovaacademy.ru';
$refererHost = parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST) ?? '';
$host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$isLocal = $host === '' || preg_match('/^(localhost|127\.0\.0\.1)(:\d+)?$/', $host);

if ($origin !== '') {
    if (!in_array($origin, ALLOWED_ORIGINS, true)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
} elseif (!$isLocal && $refererHost !== $allowedHost) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$status = AuthClient::checkStatus();
if ($status['status'] === 'unavailable') {
    echo json_encode(['authenticated' => false, 'unavailable' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = $status['user'];
if ($user === null) {
    echo json_encode([
        'authenticated' => false,
        'login_url' => AuthClient::getLoginUrl(INF_BASE_URL . '/'),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'authenticated' => true,
    'user' => [
        'id' => isset($user['id']) ? (int) $user['id'] : 0,
        'login' => isset($user['login']) ? (string) $user['login'] : '',
        'display_name' => isset($user['display_name']) ? (string) $user['display_name'] : '',
        'is_admin' => !empty($user['is_admin']),
    ],
    'logout_url' => AuthClient::getLogoutUrl(INF_BASE_URL . '/'),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
