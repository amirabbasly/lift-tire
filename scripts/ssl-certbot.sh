#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  گرفتن گواهי SSL رایگان Let's Encrypt با certbot — روش webroot
#  • نیازی به API Token یا دسترسی Zone در Cloudflare نیست
#  • nginx در حالت HTTP بالاست و مسیر ACME را سرو می‌کند
#  • بعد از صدور، nginx خودکار به حالت HTTPS سوییچ می‌شود
#
#  استفاده:
#    ./scripts/ssl-certbot.sh              # گرفتن/تمدید
#    ./scripts/ssl-certbot.sh --dry-run    # تست بدون مصرف سهمیه
#    ./scripts/ssl-certbot.sh --staging    # محیط تست Let's Encrypt
#    ./scripts/ssl-certbot.sh --force      # عبور از هشدار Cloudflare
#    ./scripts/ssl-certbot.sh --no-wait    # بدون انتظار برای DNS
# ══════════════════════════════════════════════════════════════
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

red()    { printf '\033[31m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }

DRY=0; STAGING=0; FORCE=0; NOWAIT=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --staging) STAGING=1 ;;
    --force)   FORCE=1 ;;
    --no-wait) NOWAIT=1 ;;
  esac
done

is_cf_ip() {
  local ip="$1" a b
  IFS=. read -r a b _ <<< "$ip"
  case "$a" in
    104) [ "${b:-0}" -ge 16 ] 2>/dev/null && [ "${b:-0}" -le 31 ] 2>/dev/null ;;
    172) [ "${b:-0}" -ge 64 ] 2>/dev/null && [ "${b:-0}" -le 71 ] 2>/dev/null ;;
    108) [ "${b:-0}" -eq 162 ] 2>/dev/null ;;
    162) [ "${b:-0}" -ge 158 ] 2>/dev/null && [ "${b:-0}" -le 159 ] 2>/dev/null ;;
    173) [ "${b:-0}" -eq 245 ] 2>/dev/null ;;
    103) [ "${b:-0}" -eq 21 ] 2>/dev/null || [ "${b:-0}" -eq 22 ] 2>/dev/null || [ "${b:-0}" -eq 31 ] 2>/dev/null ;;
    141) [ "${b:-0}" -eq 101 ] 2>/dev/null ;;
    190) [ "${b:-0}" -eq 93 ] 2>/dev/null ;;
    188) [ "${b:-0}" -eq 114 ] 2>/dev/null ;;
    197) [ "${b:-0}" -eq 234 ] 2>/dev/null ;;
    198) [ "${b:-0}" -eq 41 ] 2>/dev/null ;;
    *) return 1 ;;
  esac
}

# ── تنظیمات ──────────────────────────────────────────────────
if [ -f .env ]; then
  [ -z "${DOMAIN:-}" ] && DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  [ -z "${EMAIL:-}" ]  && EMAIL="$(grep -E '^ADMIN_EMAIL=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
fi
DOMAIN="${DOMAIN:-lift-tire.com}"
EMAIL="${EMAIL:-admin@lift-tire.com}"

CONF="$APP_DIR/nginx/certbot/conf"
WWW="$APP_DIR/nginx/certbot/www"
CHALLENGE="$WWW/.well-known/acme-challenge"

mkdir -p "$CONF" "$WWW" "$CHALLENGE"

# ── گواهی از قبل موجود است؟ ──────────────────────────────────
if [ -f "$CONF/live/$DOMAIN/fullchain.pem" ] && [ "$DRY" -eq 0 ] && [ "$STAGING" -eq 0 ]; then
  end="$(openssl x509 -in "$CONF/live/$DOMAIN/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2 || true)"
  green "✅ گواهی برای $DOMAIN از قبل موجود است${end:+ (انقضا: $end)}."
  echo "   • تمدید (crontab):  cd $APP_DIR && docker run --rm -v $CONF:/etc/letsencrypt -v $WWW:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec -T nginx nginx -s reload"
  echo "   • صدور مجدد از صفر:  rm -rf nginx/certbot/conf/live/$DOMAIN && ./scripts/ssl-certbot.sh"
  # مطمئن شو nginx در حالت HTTPS است
  if ! docker compose logs --tail=30 nginx 2>/dev/null | grep -q "حالت فعال: HTTPS"; then
    yellow "   nginx هنوز در حالت HTTP است → ری‌استارت می‌کنم…"
    docker compose up -d --force-recreate nginx >/dev/null 2>&1 || true
  fi
  exit 0
fi

# ── ۱) nginx باید در حالت HTTP بالا باشد ─────────────────────
bold "▸ بالا آوردن nginx در حالت HTTP…"
docker compose up -d nginx >/dev/null 2>&1 || { red "✗ بالا آوردن nginx ناموفق بود. اجرا کنید: ./deploy.sh install"; exit 1; }

for i in $(seq 1 20); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1/healthz 2>/dev/null)" = "200" ]; then
    green "   ✓ nginx روی پورت ۸۰ پاسخ می‌دهد."
    break
  fi
  [ "$i" -eq 20 ] && { red "✗ nginx روی پورت ۸۰ پاسخ نداد."; echo "   docker compose logs --tail=30 nginx"; exit 1; }
  sleep 1
done

# ── ۲) تست واقعی مسیر ACME از بیرون (بدون هیچ API Token) ────
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

CF=0
for ip in $DNS_MAIN $DNS_WWW; do is_cf_ip "$ip" && CF=1; done

OK=0
if check_reachable; then
  green "   ✓ مسیر تأیید از اینترنت قابل خواندن است — certbot بدون مشکل کار می‌کند."
  OK=1
else
  echo "   … مسیر تأیید از بیرون خوانده نشد؛ بررسی مجدد…"
fi

# ── ۳) اگر در دسترس نیست: راهنما و انتظار ───────────────────
if [ "$OK" -eq 0 ]; then
  if [ "$CF" -eq 1 ]; then
    cat <<EOF

$(yellow "دامنه پشت Cloudflare است و پروکسی اجازهٔ رسیدن به مسیر تأیید را نمی‌دهد.")
$(yellow "بدون هیچ توکن/Zone هم می‌شود certbot گرفت؛ فقط باید پروکسی موقتاً خاموش شود:")

  ۱) پنل Cloudflare → DNS → رکورد  @  و  www
     Proxy status را روی  **DNS only**  (ابر خاکستری) بگذارید
     مقدار A باید ${SERVER_IP:-IP سرور} باشد (رکوردهای AAAA/پارکینگ را حذف کنید)
  ۲) همین اسکریپت را دوباره اجرا کنید:  ./scripts/ssl-certbot.sh
  ۳) بعد از گرفتن گواهی، پروکسی را روشن کنید و SSL mode را  Full (strict)  کنید

$(bold "در این مدت سایت از کار نمی‌افتد؛ روی HTTP بالاست.")
EOF
  else
    cat <<EOF

$(yellow "مسیر تأیید از اینترنت قابل خواندن نیست. موارد زیر را چک کنید:")
   • رکورد A دامنه و www باید به ${SERVER_IP:-IP سرور} اشاره کند (بدون پروکسی/CDN)
   • فایروال سرور:   ufw allow 80/tcp && ufw allow 443/tcp
   • فایروال پنل ارائه‌دهنده (Hetzner/Arvan/…): پورت ۸۰ باز باشد
   • رکورد AAAA یا CNAME اضافی روی دامنه وجود نداشته باشد
   • تست دستی:  curl -v http://$DOMAIN/.well-known/acme-challenge/$PROBE
EOF
  fi

  if [ "$FORCE" -eq 1 ]; then
    yellow "→ با --force، بدون تأیید دسترسی ادامه می‌دهیم."
  elif [ "$NOWAIT" -eq 1 ]; then
    red "✗ با --no-wait از انتظار صرف‌نظر شد. بعد از اصلاح، دوباره اجرا کنید."
    exit 2
  else
    echo ""
    echo "   هر ۵ ثانیه دوباره بررسی می‌کنم (تا ۴ دقیقه). برای انصراف: Ctrl+C"
    waited=0
    while [ "$waited" -lt 240 ]; do
      sleep 5; waited=$((waited + 5))
      if check_reachable; then
        green "   ✓ حالا مسیر تأیید در دسترس است (${waited}s)."
        OK=1
        break
      fi
      printf '   … %ss\n' "$waited"
    done
    if [ "$OK" -eq 0 ]; then
      red "✗ مسیر تأیید باز نشد. DNS/فایروال را درست کنید و دوباره اجرا کنید."
      exit 2
    fi
  fi
fi

# ── ۴) صدور گواهی ───────────────────────────────────────────
bold "▸ درخواست گواهی از Let's Encrypt برای $DOMAIN و www.$DOMAIN …"
ARGS=(certonly --webroot -w /var/www/certbot --preferred-challenges http
      -d "$DOMAIN" -d "www.$DOMAIN"
      --email "$EMAIL" --agree-tos --no-eff-email --keep-until-expiring)
[ "$DRY" -eq 1 ] && ARGS+=(--dry-run)
[ "$STAGING" -eq 1 ] && ARGS+=(--staging)

docker run --rm \
  -v "$CONF:/etc/letsencrypt" \
  -v "$WWW:/var/www/certbot" \
  certbot/certbot "${ARGS[@]}"
STATUS=$?

cleanup_probe
trap - EXIT

if [ "$DRY" -eq 1 ]; then
  [ $STATUS -eq 0 ] && green "✅ تست (dry-run) موفق بود — اجرای واقعی: ./scripts/ssl-certbot.sh" || red "✗ تست ناموفق بود."
  exit $STATUS
fi

if [ $STATUS -ne 0 ]; then
  red "✗ صدور گواهی ناموفق بود."
  echo "   اگر پیام «too many certificates» بود، یک ساعت صبر کنید یا --staging تست کنید."
  echo "   راهنمای کامل: docs/DEPLOY-ubuntu.md بخش ۱۹ و ۲۰"
  exit 1
fi

green "✅ گواهی با موفقیت صادر شد."

# ── ۵) سوییچ خودکار nginx به HTTPS ──────────────────────────
bold "▸ سوییچ nginx به حالت HTTPS…"
docker compose up -d --force-recreate nginx >/dev/null 2>&1
sleep 3

CODE="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 8 -H "Host: $DOMAIN" https://127.0.0.1/ 2>/dev/null || true)"
if [ "$CODE" = "200" ] || [ "$CODE" = "301" ] || [ "$CODE" = "308" ]; then
  green "   ✓ nginx در حالت HTTPS کار می‌کند (کد $CODE)."
else
  yellow "   ⚠ پاسخ محلی HTTPS: ${CODE:-none} — لاگ را ببینید: docker compose logs --tail=40 nginx"
fi
rm -f "$CONF/live/$DOMAIN/README" 2>/dev/null || true

cat <<EOF

$(bold "مرحله بعد:")
   • در Cloudflare: SSL/TLS → Overview →  Full (strict)
   • رکوردها می‌توانند دوباره Proxied (ابر نارنجی) باشند

$(bold "بررسی:")
   curl -I https://$DOMAIN

$(bold "تمدید خودکار (crontab -e):")
0 4 * * * cd $APP_DIR && docker run --rm -v $CONF:/etc/letsencrypt -v $WWW:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec -T nginx nginx -s reload

EOF
