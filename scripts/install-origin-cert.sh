#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  نصب گواهی Cloudflare Origin Certificate روی nginx
#
#  چرا؟ وقتی دامنه پشت Cloudflare (ابر نارنجی) است و نمی‌خواهید
#  پروکسی را خاموش کنید، certbot نمی‌تواند HTTP-01 را رد کند.
#  Cloudflare یک گواهی رایگان ۱۵ ساله می‌دهد (بدون API Token و
#  فقط از داشبورد) که مستقیم روی سرور نصب می‌شود.
#
#  نکته: nginx خودش تشخیص می‌دهد گواهی هست یا نه؛ بدون گواهی هم
#  سایت روی HTTP بالا می‌ماند.
#
#  استفاده:
#    ./scripts/install-origin-cert.sh /root/origin-cert.pem /root/origin-key.pem
#    ./deploy.sh restart
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

die() { printf '\033[31m✗ %s\033[0m\n' "$*"; exit 1; }
ok()  { printf '\033[32m✓ %s\033[0m\n' "$*"; }

CERT="${1:-}"; KEY="${2:-}"
[ -n "$CERT" ] && [ -n "$KEY" ] || die "استفاده: $0 <fullchain.pem> <privkey.pem>"
[ -f "$CERT" ] || die "فایل گواهی پیدا نشد: $CERT"
[ -f "$KEY" ]  || die "فایل کلید پیدا نشد: $KEY"

if [ -f .env ] && [ -z "${DOMAIN:-}" ]; then
  DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
fi
DOMAIN="${DOMAIN:-lift-tire.com}"

DEST="nginx/certbot/conf/live/$DOMAIN"
mkdir -p "$DEST"
cp "$CERT" "$DEST/fullchain.pem"
cp "$KEY"  "$DEST/privkey.pem"
chmod 644 "$DEST/fullchain.pem"
chmod 600 "$DEST/privkey.pem"

ok "گواهی در $DEST نصب شد."

# بررسی سریع صحت گواهی
if command -v openssl >/dev/null 2>&1; then
  SUBJECT="$(openssl x509 -in "$DEST/fullchain.pem" -noout -subject 2>/dev/null || true)"
  ENDS="$(openssl x509 -in "$DEST/fullchain.pem" -noout -enddate 2>/dev/null || true)"
  echo "   $SUBJECT"
  echo "   $ENDS"
fi

echo "▸ ری‌استارت nginx (حالت HTTPS خودکار فعال می‌شود)…"
docker compose up -d --force-recreate nginx
sleep 3
docker compose ps nginx || true

CODE="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 8 -H "Host: $DOMAIN" https://127.0.0.1/ 2>/dev/null || true)"
echo "   پاسخ HTTPS محلی: ${CODE:-none}"

cat <<EOF

$(printf '\033[1m%s\033[0m' "مرحله بعد در پنل Cloudflare:")
   • SSL/TLS → Overview → حالت را روی  Full (strict)  بگذارید
   • SSL/TLS → Edge Certificates → Always Use HTTPS  را روشن کنید
   • اگر حالت روی Flexible باشد، سایت وارد حلقهٔ ریدایرکت می‌شود.

تست:
   curl -I https://$DOMAIN
EOF
