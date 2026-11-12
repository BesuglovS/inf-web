limit_req_zone $binary_remote_addr zone=inf_sandbox:10m rate=5r/s;

server {
    listen 80;
    server_name inf.nayanovaacademy.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name inf.nayanovaacademy.ru;

    ssl_certificate     /etc/ssl/certs/nayanovaacademy.ru/cert.pem;
    ssl_certificate_key /etc/ssl/private/nayanovaacademy.ru/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; media-src 'self'; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://auth.nayanovaacademy.ru; frame-src https://vk.com https://www.youtube.com https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self' https://auth.nayanovaacademy.ru; frame-ancestors 'none'" always;

    root /var/www/inf.nayanovaacademy.ru/public;
    index index.html index.htm;
    autoindex off;

    access_log /var/log/nginx/inf.nayanovaacademy.ru.access.log;
    error_log  /var/log/nginx/inf.nayanovaacademy.ru.error.log;

    gzip on;
    gzip_types text/css application/javascript text/javascript application/json text/xml image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_vary on;

    # Служебные данные (SQLite, банк вопросов, vk-videos.json) не отдаём.
    location ^~ /data/ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # PHP API квизов. Служебные файлы снаружи недоступны.
    location ^~ /sandbox/ {
        limit_req zone=inf_sandbox burst=10 nodelay;

        location ~ ^/sandbox/\.(.*)$ {
            deny all;
            access_log off;
            log_not_found off;
        }

        location ~ ^/sandbox/(config|Database|Auth|AuthClient|ProgressReporter)\.php$ {
            deny all;
            access_log off;
            log_not_found off;
        }

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }

        return 404;
    }

    # Другие PHP-файлы исполнять не нужно.
    location ~ \.php$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    # HTML не кэшируем: после обновления сайта пользователь получает свежую версию.
    location / {
        expires -1;
        try_files $uri $uri/ =404;
    }

    location = /version.json {
        expires -1;
    }

    location = /admin-quiz {
        return 301 /admin-quiz/;
    }

    location = /sw.js {
        expires -1;
    }

    # CSS/JS отдаём без длинного кэша: версия задаётся query-параметром.
    location ~* \.(css|js)$ {
        expires -1;
        access_log off;
    }

    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf|mp4|webp)$ {
        expires 30d;
        access_log off;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
