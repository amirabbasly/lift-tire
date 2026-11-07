#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  گرفتن گواهی SSL با certbot نصب‌شده روی خودِ سرور
#
#  • certbot با apt نصب می‌شود (نه ایمیج داکر)
#  • روش webroot: nginx (کانتینر) مسیر تأیید را از /var/www/certbot سرو می‌کند
#  • هیچ API Token یا دسترسی Zone لازم نیست — Cloudflare در کار نیست
#  • بعد از صدور، nginx خودکار به HTTPS سوییچ می‌شود
#
#  استفاده:
#    sudo ./scripts/ssl-certbot.sh              # گرفتن گواهی + سوییچ به HTTPS
#    sudo ./scripts/ssl-certbot.sh --dry-run    # تست بدون مصرف سهمیه
#    sudo ./scripts/ssl-certbot.sh --staging    # محیط تست Let's Encrypt
# ══════════════════════════════════════════════════════════════
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

red()    { printf '\033[31m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

DRY=0; STAGING=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --staging) STAGING=1 ;;
  esac
done

# ── تنظیمات ──────────────────────────────────────────────────
if [ -f .env ]; then
  [ -z "${DOMAIN:-}" ]         && DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  [ -z "${EMAIL:-}" ]          && EMAIL="$(grep -E '^ADMIN_EMAIL=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  [ -z "${ACME_WEBROOT:-}" ]   && ACME_WEBROOT="$(grep -E '^ACME_WEBROOT=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  [ -z "${LETSENCRYPT_DIR:-}" ] && LETSENCRYPT_DIR="$(grep -E '^LETSENCRYPT_DIR=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
fi
DOMAIN="${DOMAIN:-lift-tire.com}"
EMAIL="${EMAIL:-admin@lift-tire.com}"
ACME_WEBROOT="${ACME_WEBROOT:-/var/www/certbot}"
LETSENCRYPT_DIR="${LETSENCRYPT_DIR:-/etc/letsencrypt}"
CHALLENGE="$ACME_WEBROOT/.well-known/acme-challenge"

if [ "${SKIP_ROOT_CHECK:-0}" != "1" ] && [ "$(id -u)" -ne 0 ]; then
  red "✗ این اسکریپت باید با sudo اجرا شود:  sudo ./scripts/ssl-certbot.sh"
  exit 1
fi

# ── ۰) certbot نصب است؟ اگر نه، نصب کن ──────────────────────
if ! command -v certbot >/dev/null 2>&1; then
  bold "▸ certbot نصب نیست — نصب می‌کنم…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq certbot || { red "✗ نصب certbot ناموفق بود."; exit 1; }
fi
CERTBOT_VER="$(certbot --version 2>/dev/null | head -1)"
green "   ✓ $CERTBOT_VER"

mkdir -p "$CHALLENGE" "$LETSENCRYPT_DIR/live"
chmod -R a+rX "$ACME_WEBROOT"

# ── ۱) گواهی از قبل هست؟ ────────────────────────────────────
if [ -f "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" ] && [ "$DRY" -eq 0 ] && [ "$STAGING" -eq 0 ]; then
  end="$(openssl x509 -in "$LETSENCRYPT_DIR/live/$DOMAIN/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2 || true)"
  green "✅ گواهی برای $DOMAIN از قبل موجود است${end:+ (انقضا: $end)}."
  echo "   • تمدید دستی:  certbot renew --webroot -w $ACME_WEBROOT && docker compose exec -T nginx nginx -s reload"
  echo "   • صدور مجدد:   rm -rf $LETSENCRYPT_DIR/live/$DOMAIN && sudo ./scripts/ssl-certbot.sh"
  if ! docker compose logs --tail=30 nginx 2>/dev/null | grep -q "حالت فعال: HTTPS"; then
    yellow "   nginx هنوز در حالت HTTP است → ری‌استارت می‌کنم…"
    docker compose up -d --force-recreate nginx >/dev/null 2>&1 || true
  fi
  exit 0
fi

# ── ۲) nginx باید روی HTTP بالا باشد ────────────────────────
bold "▸ بالا آوردن nginx در حالت HTTP…"
if ! docker compose up -d nginx >/tmp/lifttire-nginx-up.log 2>&1; then
  red "✗ بالا آوردن nginx ناموفق بود:"
  sed -n '1,15p' /tmp/lifttire-nginx-up.log
  echo "   اگر پورت ۸۰ اشغال است:  ss -lntp | grep ':80'"
  exit 1
fi

alive=0
for i in $(seq 1 20); do
  hc="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1/healthz 2>/dev/null || true)"
  case "$hc" in
    200|301|308) green "   ✓ nginx روی پورت ۸۰ پاسخ می‌دهد (کد $hc)."; alive=1; break ;;
  esac
  sleep 1
done
[ "$alive" -eq 0 ] && { red "✗ nginx روی پورت ۸۰ پاسخ نداد."; echo "   docker compose logs --tail=30 nginx"; exit 1; }

# ── ۳) تست دسترسی عمومی به مسیر تأیید ──────────────────────
PROBE="probe-$(date +%s)-$RANDOM"
printf 'lifttire-%s\n' "$PROBE" > "$CHALLENGE/$PROBE"
EXPECT="lifttire-$PROBE"
cleanup_probe() { rm -f "$CHALLENGE/$PROBE"; }
trap cleanup_probe EXIT

check_reachable() {
  local got
  got="$(curl -s --max-time 8 "http://$DOMAIN/.well-known/acme-challenge/$PROBE" 2>/dev/null | tr -d '\r\n' || true)"
  [ "$got" = "$EXPECT" ]
}

SERVER_IP="$(curl -4 -fsS --max-time 6 https://api.ipify.org 2>/dev/null || true)"
DNS_MAIN="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"
DNS_WWW="$(getent ahostsv4 "www.$DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"

bold "▸ بررسی دسترسی عمومی به مسیر تأیید (${DOMAIN})"
echo "   IP این سرور : ${SERVER_IP:-نامشخص}"
echo "   رکورد A     : ${DNS_MAIN:-نامشخص}"
echo "   رکورد www   : ${DNS_WWW:-نامشخص}"

if check_reachable; then
  green "   ✓ مسیر تأیید از اینترنت قابل خواندن است."
else
  yellow "   مسیر تأیید از بیرون خوانده نشد. چک‌لیست:"
  echo "   • رکورد A دامنه و www باید به ${SERVER_IP:-IP سرور} اشاره کند (بدون پروکسی)"
  echo "   • فایروال:   ufw allow 80/tcp && ufw allow 443/tcp"
  echo "   • فایروال پنل ارائه‌دهنده هم پورت ۸۰ را باز کند"
  echo "   • تست دستی:  curl -v http://$DOMAIN/.well-known/acme-challenge/$PROBE"
  echo ""
  if [ "$DRY" -eq 1 ]; then
    yellow "   → در حالت --dry-run ادامه می‌دهم (نتیجه را خود certbot می‌گوید)."
  else
    echo "   هر ۵ ثانیه دوباره بررسی می‌کنم (تا ۳ دقیقه). Ctrl+C = انصراف"
    waited=0; ok=0
    while [ "$waited" -lt 180 ]; do
      sleep 5; waited=$((waited + 5))
      if check_reachable; then green "   ✓ حالا در دسترس است (${waited}s)."; ok=1; break; fi
      printf '   … %ss\n' "$waited"
    done
    if [ "$ok" -eq 0 ]; then
      red "✗ مسیر تأیید باز نشد — DNS/فایروال را درست کنید و دوباره اجرا کنید."
      cleanup_probe; trap - EXIT
      exit 2
    fi
  fi
fi

# ── ۴) صدور گواهی با certbot نصبی ──────────────────────────
bold "▸ درخواست گواهی از Let's Encrypt برای $DOMAIN و www.$DOMAIN …"
ARGS=(certonly --webroot -w "$ACME_WEBROOT"
      --preferred-challenges http
      -d "$DOMAIN" -d "www.$DOMAIN"
      --email "$EMAIL" --agree-tos --no-eff-email --keep-until-expiring)
[ "$DRY" -eq 1 ] && ARGS+=(--dry-run)
[ "$STAGING" -eq 1 ] && ARGS+=(--staging)

certbot "${ARGS[@]}"
STATUS=$?

cleanup_probe; trap - EXIT

if [ "$DRY" -eq 1 ]; then
  if [ $STATUS -eq 0 ]; then
    green "✅ تست (dry-run) موفق بود — اجرای واقعی:  sudo ./scripts/ssl-certbot.sh"
  else
    red "✗ تست ناموفق بود."
  fi
  exit $STATUS
fi

if [ $STATUS -ne 0 ]; then
  red "✗ صدور گواهی ناموفق بود."
  echo "   سایت همچنان روی HTTP بالاست و در دسترس است."
  echo "   اگر «too many certificates» بود، یک ساعت صبر کنید یا --staging تست کنید."
  exit 1
fi

green "✅ گواهی با موفقیت صادر شد: $LETSENCRYPT_DIR/live/$DOMAIN/"

# ── ۵) سوییچ nginx به HTTPS ─────────────────────────────────
bold "▸ سوییچ nginx به حالت HTTPS…"
docker compose up -d --force-recreate nginx >/dev/null 2>&1
sleep 3

CODE="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 8 -H "Host: $DOMAIN" https://127.0.0.1/ 2>/dev/null || true)"
if [ "$CODE" = "200" ] || [ "$CODE" = "301" ] || [ "$CODE" = "308" ]; then
  green "   ✓ nginx در حالت HTTPS کار می‌کند (کد $CODE)."
else
  yellow "   ⚠ پاسخ محلی HTTPS: ${CODE:-none} — لاگ: docker compose logs --tail=40 nginx"
fi

# ── ۶) تمدید خودکار (timer سیستم) ──────────────────────────
bold "▸ تنظیم تمدید خودکار…"
# پکیج certbot اوبونتو معمولاً certbot.timer را با خودش می‌آورد
if systemctl list-timers 2>/dev/null | grep -q certbot.timer; then
  systemctl enable --now certbot.timer >/dev/null 2>&1 || true
  # هوک reload برای کانتینر nginx
  mkdir -p /etc/letsencrypt/renewal-hooks/deploy
  cat > /etc/letsencrypt/renewal-hooks/deploy/lifttire-reload-nginx.sh <<HOOK
#!/bin/sh
# بعد از هر تمدید موفق، nginx کانتینری را reload کن
cd $APP_DIR && docker compose exec -T nginx nginx -s reload >/dev/null 2>&1 || docker compose restart nginx >/dev/null 2>&1
HOOK
  chmod +x /etc/letsencrypt/renewal-hooks/deploy/lifttire-reload-nginx.sh
  green "   ✓ certbot.timer فعال است (تمدید خودکار دو بار در روز)."
  echo "     وضعیت:  systemctl list-timers | grep certbot"
else
  warn "certbot.timer پیدا نشد؛ در cron بنویسید:"
  echo "     0 4 * * * certbot renew --webroot -w $ACME_WEBROOT --quiet && cd $APP_DIR && docker compose exec -T nginx nginx -s reload"
fi

cat <<EOF

$(bold "بررسی نهایی:")
   curl -I https://$DOMAIN
   curl -s https://$DOMAIN/api/health

EOF
