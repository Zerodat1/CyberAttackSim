#!/usr/bin/env bash
#
# One-time bootstrap for Let's Encrypt certificates, run once on a fresh
# server before the first `docker compose ... up -d`. It:
#   1. generates a temporary self-signed cert so nginx can start at all
#      (nginx refuses to boot with an ssl_certificate directive pointing at
#      a file that doesn't exist yet),
#   2. starts nginx,
#   3. requests the real certificate from Let's Encrypt over HTTP-01
#      (webroot challenge, served by nginx on port 80),
#   4. reloads nginx with the real certificate.
#
# Requires API_DOMAIN, ADMIN_DOMAIN, and LETSENCRYPT_EMAIL to be set in
# backend/.env (or exported in your shell) before running.
#
# Usage: ./deploy/nginx/init-letsencrypt.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ -f backend/.env ]; then
  set -a
  # shellcheck disable=SC1091
  source backend/.env
  set +a
fi

: "${API_DOMAIN:?Set API_DOMAIN (e.g. api.yourdomain.com) in backend/.env}"
: "${ADMIN_DOMAIN:?Set ADMIN_DOMAIN (e.g. admin.yourdomain.com) in backend/.env}"
: "${LETSENCRYPT_EMAIL:?Set LETSENCRYPT_EMAIL (for renewal notices) in backend/.env}"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
CERT_PATH="/etc/letsencrypt/live/${API_DOMAIN}"

echo "==> Creating a temporary self-signed certificate for ${API_DOMAIN}"
$COMPOSE run --rm --entrypoint "\
  sh -c 'mkdir -p ${CERT_PATH} && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ${CERT_PATH}/privkey.pem \
    -out ${CERT_PATH}/fullchain.pem \
    -subj \"/CN=${API_DOMAIN}\"'" certbot

echo "==> Starting nginx with the temporary certificate"
$COMPOSE up -d nginx

echo "==> Removing the temporary certificate so certbot can issue the real one"
$COMPOSE run --rm --entrypoint "sh -c 'rm -rf /etc/letsencrypt/live/${API_DOMAIN} /etc/letsencrypt/archive/${API_DOMAIN} /etc/letsencrypt/renewal/${API_DOMAIN}.conf'" certbot

echo "==> Requesting the real Let's Encrypt certificate"
$COMPOSE run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email ${LETSENCRYPT_EMAIL} --agree-tos --no-eff-email \
    -d ${API_DOMAIN} -d ${ADMIN_DOMAIN}" certbot

echo "==> Reloading nginx with the real certificate"
$COMPOSE exec nginx nginx -s reload

echo "==> Done. The certbot service will keep renewing this certificate automatically every 12h."
