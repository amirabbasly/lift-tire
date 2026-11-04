#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  گرفتن گواهی Let's Encrypt با روش DNS-01 و API کلادفلر
#  (بدون خاموش‌کردن پروکسی، بدون نیاز به پورت ۸۰)
#
#  پیش‌نیاز:
#    ۱) یک API Token در Cloudflare بسازید:
#       My Profile → API Tokens → Create Token → Edit zone DNS
#       Permissions: Zone → DNS → Edit
#       Zone Resources: Include → Specific zone → lift-tire.com
#    ۲) توکن را در .env بگذارید:
#       CLOUDFLARE_API_TOKEN=xxxxxxxx
#
#  استفاده:
#    ./scripts/cf-certbot-dns.sh --dry-run    # تست
#    ./scripts/cf-certbot-dns.sh            # صدور واقعی
#    ./scripts/cf-certbot-dns.sh --staging  # محیط تست Let's Encrypt
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

ok()   { printf '\033[32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[33m⚠ %s\033[0m\n' "$*"; }
die()  { printf '\033[31m✗ %s\033[0m\n' "$*"; exit 1; }
bold() { printf '\033[1m%s\033[0m\n' "$*"; }

EXTRA_ARGS="${*:-}"

# ── خواندن تنظیمات ───────────────────────────────────────────
if [ -f .env ]; then
  if [ -z "${DOMAIN:-}" ]; then
    DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
  fi
  if [ -z "${EMAIL:-}" ]; then
    EMAIL="$(grep -E '^ADMIN_EMAIL=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
  fi
  if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    CLOUDFLARE_API_TOKEN="$(grep -E '^CLOUDFLARE_API_TOKEN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ' || true)"
  fi
fi
DOMAIN="${DOMAIN:-lift-tire.com}"
EMAIL="${EMAIL:-admin@lift-tire.com}"

[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || die "CLOUDFLARE_API_TOKEN در .env تنظیم نشده است."

CONF="$APP_DIR/nginx/certbot/conf"
WWW="$APP_DIR/nginx/certbot/www"
SECRETS="$APP_DIR/nginx/certbot"
INI="$SECRETS/cloudflare.ini"

mkdir -p "$CONF" "$WWW" "$SECRETS"
umask 077
cat > "$INI" <<EOF
dns_cloudflare_api_token = ${CLOUDFLARE_API_TOKEN}
EOF
chmod 600 "$INI"

# ── بررسی توکن با API کلادفلر ────────────────────────────────
bold "▸ بررسی توکن Cloudflare…"
VERIFY="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/user/tokens/verify" || true)"
if [ "$VERIFY" = "200" ]; then
  ok "توکن معتبر است."
else
  warn "بررسی توکن نتیجهٔ ${VERIFY:-نامشخص} داد (ممکن است دسترسی شبکه محدود باشد)."
  warn "در صورت شکست در مرحلهٔ بعد، توکن و مجوز Zone:DNS:Edit را بررسی کنید."
fi

# ── صدور گواهی با DNS-01 ────────────────────────────────────
bold "▸ صدور گواهی با DNS-01 برای $DOMAIN و www.$DOMAIN …"

set +e
docker run --rm \
  -v "$CONF:/etc/letsencrypt" \
  -v "$INI:/root/.secrets/cloudflare.ini:ro" \
  certbot/dns-cloudflare certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email \
  --keep-until-expiring $EXTRA_ARGS
STATUS=$?
set -e

if [ $STATUS -ne 0 ]; then
  die "صدور گواهی ناموفق بود. خروجی بالا را ببینید (معمولاً توکن یا مجوز Zone)."
fi

ok "گواهی صادر شد."

bold "▸ بالا آوردن/ری‌استارت nginx…"
docker compose up -d nginx
sleep 2
docker compose ps nginx || true

cat <<EOF

$(bold "بررسی:")
   curl -I https://$DOMAIN
   ls -l nginx/certbot/conf/live/$DOMAIN/

$(bold "در Cloudflare حتماً SSL/TLS → Overview → Full (strict) باشد.")

$(bold "تمدید خودکار (crontab -e):")
0 4 * * * cd $APP_DIR && docker run --rm -v $CONF:/etc/letsencrypt -v $INI:/root/.secrets/cloudflare.ini:ro certbot/dns-cloudflare renew --dns-cloudflare --dns-cloudflare-credentials /root/.secrets/cloudflare.ini --quiet && docker compose exec -T nginx nginx -s reload

EOF
