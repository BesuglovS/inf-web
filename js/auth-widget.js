/*
 * Виджет учётной записи в шапке inf-web.
 *
 * Гость видит кнопку «Войти», вошедший через SSO auth-web — своё имя и «Выйти».
 * Сессию проверяет sandbox/auth_check.php (кука auth_session на
 * .nayanovaacademy.ru). Страницы сайта открыты всем, поэтому виджет только
 * отражает состояние входа и не блокирует контент.
 */
(function () {
    "use strict";

    var AUTH_API = "/sandbox/auth_check.php";
    var AUTH_BASE = "https://auth.nayanovaacademy.ru";
    var ACCOUNT_URL = AUTH_BASE + "/index.php";
    var LOGIN_URL = AUTH_BASE + "/index.php?page=login&redirect=";
    var LOGOUT_URL = AUTH_BASE + "/api/logout.php?redirect=";

    function returnUrl() {
        return encodeURIComponent(window.location.href);
    }

    function element(tag, className, text) {
        var node = document.createElement(tag);
        node.className = className;
        if (text) {
            node.textContent = text;
        }
        return node;
    }

    function render(box, data) {
        box.textContent = "";

        var user = data && data.authenticated && data.user ? data.user : null;

        if (user) {
            var account = element("a", "site-auth__user",
                user.display_name || user.login || "Учётная запись");
            account.href = ACCOUNT_URL;
            account.title = "Личный кабинет auth-web";
            box.appendChild(account);

            var logout = element("a", "site-auth__logout", "Выйти");
            logout.href = LOGOUT_URL + returnUrl();
            box.appendChild(logout);
        } else {
            var login = element("a", "site-auth__login", "Войти");
            login.href = LOGIN_URL + returnUrl();
            box.appendChild(login);
        }

        box.style.visibility = "";
    }

    function init() {
        var header = document.querySelector(".site-head__inner");
        if (!header) {
            return;
        }

        var box = element("div", "site-auth");
        // Место под виджет резервируем сразу, чтобы шапка не прыгала,
        // когда придёт ответ auth-web.
        box.style.visibility = "hidden";
        header.appendChild(box);

        fetch(AUTH_API, {
            credentials: "same-origin",
            cache: "no-store",
            headers: { "Accept": "application/json" }
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status);
                }
                return response.json();
            })
            .then(function (data) {
                render(box, data);
            })
            .catch(function () {
                // auth-web недоступен: кнопку входа всё равно показываем,
                // чтобы шапка не оставалась пустой.
                render(box, null);
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
}());
