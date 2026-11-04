#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  دریافت/تمدید گواهی SSL رایگان Let's Encrypt
#  روش: webroot + یک nginx موقت روی پورت ۸۰ (نیازی به آزادکردن دستی پورت نیست)
#
#  استفاده:
#    ./scripts/ssl-certbot.sh              # گرفتن گواهی
#    ./scripts/ssl-certbot.sh --dry-run    # تست بدون مصرف سهمیه Let's Encrypt
#    DOMAIN=example.com ./scripts/ssl-certbot.sh
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow(){ printf '\033[33m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

# ── خواندن دامنه/ایمیل از .env ────────────────────────────────
if [ -f .env ]; then
  if [ -z "${DOMAIN:-}" ]; then
    DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
  fi
  if [ -z "${EMAIL:-}" ]; then
    EMAIL="$(grep -E '^ADMIN_EMAIL=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
  fi
fi
DOMAIN="${DOMAIN:-lifttire.com}"
EMAIL="${EMAIL:-admin@lifttire.com}"
CONF="$APP_DIR/nginx/certbot/conf"
WWW="$APP_DIR/nginx/certbot/www"
ACME_NAME="lifttire-acme"
EXTRA_ARGS="${*:-}"

mkdir -p "$CONF" "$WWW/.well-known/acme-challenge"

# ── اگر گواهی از قبل هست ──────────────────────────────────────
if [ -f "$CONF/live/$DOMAIN/fullchain.pem" ] && [[ "$EXTRA_ARGS" != *"--force-renewal"* ]]; then
  green "✅ گواهی برای $DOMAIN از قبل موجود است."
  echo "   برای تمدید اجباری: ./scripts/ssl-certbot.sh --force-renewal"
  docker compose up -d nginx >/dev/null 2>&1 && green "   nginx بالا آمد." || true
  exit 0
fi

# ── پیش‌بررسی شبکه و DNS ──────────────────────────────────────
bold "▸ پیش‌بررسی DNS و پورت ۸۰ (دامنه: $DOMAIN)"

SERVER_IP="$(curl -4 -fsS --max-time 6 https://api.ipify.org 2>/dev/null || true)"
DNS_MAIN="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"
DNS_WWW="$(getent ahostsv4 "www.$DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"

echo "   IP این سرور        : ${SERVER_IP:-نامشخص}"
echo "   $DOMAIN  →  ${DNS_MAIN:-نامشخص}"
echo "   www.$DOMAIN  →  ${DNS_WWW:-نامشخص}"

DNS_OK=1
if [ -n "$SERVER_IP" ]; then
  if [ -z "$DNS_MAIN" ] || [[ " $DNS_MAIN " != *" $SERVER_IP "* ]]; then
    red "   ✗ رکورد A دامنه اصلی به این سرور اشاره نمی‌کند."
    DNS_OK=0
  fi
  if [ -z "$DNS_WWW" ] || [[ " $DNS_WWW " != *" $SERVER_IP "* ]]; then
    red "   ✗ رکورد A ساب‌دامنه www به این سرور اشاره نمی‌کند."
    DNS_OK=0
  fi
fi

if [ "$DNS_OK" -eq 0 ]; then
  cat <<EOF

$(yellow "پیش از گرفتن گواهی، DNS را درست کنید:")
   1) در پنل دامنه، رکورد A برای @  (دامنه اصلی)  →  ${SERVER_IP:-IP_سرور}
   2) رکورد A برای www                            →  ${SERVER_IP:-IP_سرور}
   3) اگر رکورد AAAA (IPv6) وجود دارد و به این سرور اشاره نمی‌کند، آن را حذف کنید.
   4) رکورد CNAME یا Forward روی www را حذف کنید.
   5) انتشار DNS را بررسی کنید:  dig +short $DOMAIN   و   dig +short www.$DOMAIN

$(yellow "فایروال سرور و پنل ارائه‌دهنده هم باید پورت‌های ۸۰ و ۴۴۳ را باز داشته باشند:")
   ufw allow 80/tcp && ufw allow 443/tcp && ufw status

پس از اصلاح DNS (تا چند دقیقه تا ۲۴ ساعت) دوباره اجرا کنید:
   ./scripts/ssl-certbot.sh

EOF
  exit 1
fi

green "   ✓ DNS درست است."

# ── آماده‌سازی: توقف nginx اصلی (چون هنوز گواهی ندارد) ────────
docker rm -f "$ACME_NAME" >/dev/null 2>&1 || true
docker compose stop nginx >/dev/null 2>&1 || true

cleanup() { docker rm -f "$ACME_NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

bold "▸ بالا آوردن nginx موقت روی پورت ۸۰…"
docker run -d --rm --name "$ACME_NAME" \
  -p 80:80 \
  -v "$APP_DIR/nginx/acme/bootstrap.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$WWW:/var/www/certbot:ro" \
  nginx:1.27-alpine >/dev/null

# تست محلی مسیر ACME
echo "ok" > "$WWW/.well-known/acme-challenge/health.txt"
sleep 2
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1/.well-known/acme-challenge/health.txt" || true)"
if [ "$CODE" != "200" ]; then
  red "✗ nginx موقت روی پورت ۸۰ پاسخ نداد (کد: ${CODE:-none})."
  echo "   بررسی کنید چیزی دیگر روی پورت ۸۰ گوش می‌دهد:  ss -lntp | grep ':80'"
  exit 1
fi
green "   ✓ پورت ۸۰ آماده است."
rm -f "$WWW/.well-known/acme-challenge/health.txt"

# ── درخواست گواهی ────────────────────────────────────────────
bold "▸ درخواست گواهی برای $DOMAIN و www.$DOMAIN …"
set +e
docker run --rm \
  -v "$CONF:/etc/letsencrypt" \
  -v "$WWW:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --preferred-challenges http \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email \
  --keep-until-expiring $EXTRA_ARGS
STATUS=$?
set -e

cleanup
trap - EXIT

if [ $STATUS -ne 0 ]; then
  red "✗ دریافت گواهی ناموفق بود."
  cat <<EOF

$(yellow "کارهایی که معمولاً مشکل را حل می‌کند:")
   • اطمینان از اینکه $DOMAIN و www.$DOMAIN هر دو به IP این سرور اشاره می‌کنند
   • باز بودن پورت ۸۰ از اینترنت (فایروال سرور + فایروال پنل ابری)
   • حذف رکوردهای AAAA اشتباه یا CNAME روی www
   • اگر پشت CDN/پروکسی (Cloudflare) هستید، موقتاً آن را خاموش (DNS only) کنید
   • تست دستی:  curl -I http://$DOMAIN/.well-known/acme-challenge/test

EOF
  exit 1
fi

green "✅ گواهی با موفقیت نصب شد."
docker compose up -d nginx >/dev/null 2>&1 || true
green "   nginx با HTTPS بالا آمد:  https://$DOMAIN"

cat <<EOF

$(bold "تمدید خودکار (crontab -e):")
0 4 * * * cd $APP_DIR && docker run --rm -v $CONF:/etc/letsencrypt -v $WWW:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec -T nginx nginx -s reload

EOF
