#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  دریافت گواهی SSL رایگان Let's Encrypt برای lifttire.com
#  پیش‌نیاز: دامنه به IP سرور اشاره کند و پورت ۸۰ آزاد باشد.
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# اگر .env وجود دارد، دامنه و ایمیل از آن خوانده می‌شود
if [ -f .env ] && [ -z "${DOMAIN:-}" ]; then
  DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ')"
fi

DOMAIN="${DOMAIN:-lifttire.com}"
EMAIL="${EMAIL:-admin@lifttire.com}"
CONF="$APP_DIR/nginx/certbot/conf"
WWW="$APP_DIR/nginx/certbot/www"

mkdir -p "$CONF" "$WWW"

echo "▸ درخواست گواهی برای $DOMAIN و www.$DOMAIN …"

# اگر nginx در حال اجراست، موقتاً متوقف می‌شود تا certbot روی پورت ۸۰ bind کند
if docker compose ps --status running 2>/dev/null | grep -q lifttire_nginx; then
  echo "▸ توقف موقت nginx…"
  docker compose stop nginx
fi

docker run --rm \
  -v "$CONF:/etc/letsencrypt" \
  -v "$WWW:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --preferred-challenges http \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email \
  --keep-until-expiring

echo "▸ راه‌اندازی مجدد nginx…"
docker compose up -d nginx

echo "✅ گواهی نصب شد. تمدید خودکار را با cron زیر فعال کنید:"
echo "   0 3 * * * cd $APP_DIR && docker run --rm -v $CONF:/etc/letsencrypt -v $WWW:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec nginx nginx -s reload"
