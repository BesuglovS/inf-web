<?php
/**
 * Router для локального PHP-сервера.
 *
 * Запуск:
 *   php -S 127.0.0.1:8000 router.php
 *
 * Позволяет работать API в /sandbox/, отдаёт статические файлы и
 * закрывает служебные данные (/data/) от прямого доступа.
 */
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';
$projectDir = realpath(__DIR__);

function safeResolve(string $projectDir, string $path): ?string
{
    $fullPath = realpath($projectDir . $path);
    if ($fullPath === false) {
        return null;
    }
    if (strpos($fullPath, $projectDir . DIRECTORY_SEPARATOR) !== 0 && $fullPath !== $projectDir) {
        return null;
    }
    return $fullPath;
}

function notFound(): bool
{
    http_response_code(404);
    echo '<h1>404 Not Found</h1>';
    return true;
}

// Служебные данные не отдаём.
if (strpos($path, '/data/') === 0) {
    return notFound();
}

// API и служебные PHP-файлы.
if (strpos($path, '/sandbox/') === 0) {
    $file = safeResolve($projectDir, $path);
    $internal = ['config.php', 'Database.php', 'Auth.php', 'AuthClient.php', 'ProgressReporter.php'];
    if ($file === null || !is_file($file) || pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
        return notFound();
    }
    if (in_array(basename($file), $internal, true)) {
        return notFound();
    }
    require $file;
    return true;
}

// Директории с index.php (например, /admin-quiz/).
$filePath = safeResolve($projectDir, $path);
if ($filePath !== null && is_dir($filePath)) {
    $index = rtrim($filePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'index.php';
    if (is_file($index)) {
        require $index;
        return true;
    }
}

// Статические файлы отдаёт встроенный сервер.
if ($filePath !== null && is_file($filePath)) {
    return false;
}

return notFound();
