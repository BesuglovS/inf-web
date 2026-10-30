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

    root /var/www/inf.nayanovaacademy.ru/public;
    index index.html index.htm;

    access_log /var/log/nginx/inf.nayanovaacademy.ru.access.log;
    error_log  /var/log/nginx/inf.nayanovaacademy.ru.error.log;

    # Сайт статический: отдаём файлы как есть, без SPA-подмены.
    location / {
        try_files $uri $uri/ =404;
    }

    location = /version.json {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Экосистемные скрипты без content-hash: не кэшируем, иначе обновления
    # доходят до 30 дней.
    location = /js/tracking-client.js {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location = /js/progress-client.js {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location = /js/progress-sync.js {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location = /sw.js {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|pdf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
