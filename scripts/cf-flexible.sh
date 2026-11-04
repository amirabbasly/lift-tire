#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  حالت اضطراری/موقت: اجرای سایت پشت Cloudflare با SSL mode = Flexible
#  (بدون نیاز به گواهی روی سرور)
#
#  استفاده:
#    ./scripts/cf-flexible.sh enable    # سایت روی HTTP بالا می‌آید
#    ./scripts/cf-flexible.sh disable   # برگشت به حالت HTTPS (نیازمند گواهی)
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

ok()   { printf '\033[32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m⚠ %s\033[0m\n' "$*"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$*"; exit 1; }

if [ -f .env ] && [ -z "${DOMAIN:-}" ]; then
  DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
fi
DOMAIN="${DOMAIN:-lift-tire.com}"

MODE="${1:-enable}"

case "$MODE" in
  enable)
    [ -f nginx/conf-flexible/lifttire.conf ] || die "فایل nginx/conf-flexible/lifttire.conf پیدا نشد."
    if [ -f nginx/conf/lifttire.conf ] && ! grep -q "SSL mode = Flexible" nginx/conf/lifttire.conf; then
      cp nginx/conf/lifttire.conf "nginx/conf/lifttire.conf.bak.$(date +%s)"
    fi
    cp nginx/conf-flexible/lifttire.conf nginx/conf/lifttire.conf
    ok "کانفیگ HTTP-only فعال شد."
    docker compose up -d postgres api web nginx || true
    sleep 2
    docker compose ps
    cat <<EOF

$(printf '\033[1m%s\033[0m' "حالا در Cloudflare:")
   • SSL/TLS → Overview →  Flexible
   • SSL/TLS → Edge Certificates → Always Use HTTPS: On  (اختیاری)
   • بعد از بازشدن سایت، حتماً به حالت امن برگردید:
       گواهی Origin نصب کنید → ./scripts/install-origin-cert.sh <cert> <key>
       SSL mode را  Full (strict)  کنید → ./scripts/cf-flexible.sh disable

تست:
   curl -I https://$DOMAIN
   curl -s https://$DOMAIN/api/health
EOF
    ;;
  disable)
    if [ ! -f nginx/certbot/conf/live/"$DOMAIN"/fullchain.pem ]; then
      die "گواهی $DOMAIN نصب نیست. اول ./scripts/install-origin-cert.sh یا ./scripts/ssl-certbot.sh را اجرا کنید."
    fi
    if [ -f nginx/conf/lifttire.conf.template ]; then
      sed "s|__DOMAIN__|${DOMAIN}|g" nginx/conf/lifttire.conf.template > nginx/conf/lifttire.conf
    else
      die "قالب nginx/conf/lifttire.conf.template پیدا نشد."
    fi
    ok "کانفیگ HTTPS برگشت داده شد."
    docker compose up -d nginx
    sleep 2
    docker compose ps nginx
    warn "الان در Cloudflare حالت SSL را Full (strict) بگذارید."
    ;;
  *)
    die "استفاده: $0 [enable|disable]"
    ;;
esac
