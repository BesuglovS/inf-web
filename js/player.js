/**
 * Подгрузка YouTube-плеера по клику.
 *
 * До клика на странице только постер: никаких запросов к YouTube и cookies.
 * После клика кнопка заменяется на iframe youtube-nocookie с автозапуском.
 */
(function () {
    "use strict";

    var BASE = "https://www.youtube-nocookie.com/embed/";
    var PARAMS = "?autoplay=1&rel=0&modestbranding=1&hl=ru";

    function mountPlayer(root) {
        var videoId = root.getAttribute("data-video");
        if (!videoId) {
            return;
        }

        var frame = root.querySelector(".player__frame");
        var button = root.querySelector(".player__btn");
        if (!frame || !button) {
            return;
        }

        var iframe = document.createElement("iframe");
        iframe.src = BASE + videoId + PARAMS;
        iframe.title = root.getAttribute("data-title") || "Видео на YouTube";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.loading = "eager";

        frame.replaceChildren(iframe);
        button.remove();
    }

    // Постер maxresdefault есть не у всех роликов: пробуем hqdefault,
    // а если картинка недоступна вовсе — оставляем чистую панель без «сломанной» иконки.
    document.querySelectorAll(".player__poster").forEach(function (img) {
        function fail() {
            if (!img.dataset.fallback) {
                img.dataset.fallback = "1";
                img.src = img.src.replace("maxresdefault", "hqdefault");
            } else {
                img.classList.add("is-failed");
            }
        }

        img.addEventListener("error", fail);
        img.addEventListener("load", function () {
            if (!img.naturalWidth) {
                fail();
            }
        });

        // Скрипт может выполниться уже после ошибки загрузки.
        if (img.complete && img.naturalWidth === 0) {
            fail();
        }
    });

    document.querySelectorAll(".player").forEach(function (root) {
        root.addEventListener("click", function (event) {
            if (event.target.closest(".player__btn")) {
                event.preventDefault();
                mountPlayer(root);
            }
        });
    });
})();
