FROM dunglas/frankenphp:1-php8.5

# Extensions PHP utiles pour Symfony + MariaDB
RUN install-php-extensions \
    pdo_mysql \
    intl \
    zip \
    opcache \
    apcu

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Config PHP de développement
RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"
COPY docker/php/app.ini $PHP_INI_DIR/conf.d/zz-app.ini

# Le conteneur tourne avec l'UID de l'hôte : Caddy doit pouvoir écrire ici
RUN mkdir -p /data/caddy /config/caddy /tmp/composer \
    && chmod -R 777 /data /config /tmp/composer

WORKDIR /app
