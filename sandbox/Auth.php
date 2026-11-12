<?php
/**
 * Аутентификация inf-web через auth-web.
 * Реализация вынесена в общий AuthClient (shared/php/auth-client/AuthClient.php):
 * проверка сессии по куке auth_session, кэш в PHP-сессии.
 */
require_once __DIR__ . '/AuthClient.php';

class Auth
{
    public static function isLoggedIn(): bool
    {
        return AuthClient::isLoggedIn();
    }

    public static function isAdmin(): bool
    {
        return AuthClient::isAdmin();
    }

    public static function getUserId(): ?int
    {
        return AuthClient::getUserId();
    }

    public static function getUserName(): ?string
    {
        return AuthClient::getUserName();
    }

    public static function getUser(): ?array
    {
        return AuthClient::check();
    }

    public static function requireLogin(): void
    {
        if (!self::isLoggedIn()) {
            jsonResponse(['authenticated' => false, 'error' => 'Требуется авторизация'], 401);
        }
    }

    public static function requireAdmin(): void
    {
        self::requireLogin();
        if (!self::isAdmin()) {
            jsonResponse(['error' => 'Доступ запрещён'], 403);
        }
    }

    public static function clearCache(): void
    {
        AuthClient::clearCache();
    }
}
