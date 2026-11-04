#!/bin/sh
# ═══════════════════════════════════════════════════════════════
#  انتخاب خودکار حالت nginx در زمان استارت کانتینر
#    • گواهی SSL موجود  →  حالت HTTPS (پورت ۴۴۳ + ریدایرکت ۸۰→۴۴۳)
#    • گواهی موجود نیست  →  حالت HTTP  (سایت بدون SSL هم بالا می‌آید)
#
#  این فایل داخل کانتینر روی /docker-entrypoint.d/40-lifttire-mode.sh
#  مانت می‌شود و قبل از اجرای nginx اجرا می‌گردد.
#
#  تغییر حالت اجباری:  NGINX_MODE=http  یا  NGINX_MODE=https
#  اعمال:  docker compose restart nginx
# ═══════════════════════════════════════════════════════════════
set -eu

SITE_DIR="${SITE_DIR:-/opt/nginx-sites}"
TARGET_DIR="${TARGET_DIR:-/etc/nginx/conf.d}"
TARGET="$TARGET_DIR/default.conf"
MODE="${NGINX_MODE:-auto}"
# فقط برای تست محلی؛ در کانتینر همان مسیر پیش‌فرض است
CERT_ROOT="${CERT_ROOT:-/etc/letsencrypt}"

log() { echo "[lifttire-nginx] $*"; }

# خواندن مسیرهای گواهی از https.conf؛ اگر فایل رندرشده نبود از قالب می‌خوانیم
conf_source() {
  if [ -f "$SITE_DIR/https.conf" ]; then
    echo "$SITE_DIR/https.conf"
  elif [ -f "$SITE_DIR/https.conf.template" ]; then
    echo "$SITE_DIR/https.conf.template"
  fi
}

has_cert() {
  src="$(conf_source)"
  if [ -n "$src" ]; then
    cert="$(sed -n 's|.*\(/etc/letsencrypt/live/[^/]*/fullchain\.pem\).*|\1|p' "$src" | head -1)"
    key="$(sed -n 's|.*\(/etc/letsencrypt/live/[^/]*/privkey\.pem\).*|\1|p' "$src" | head -1)"
    if [ -n "$cert" ] && [ -n "$key" ]; then
      cert="${CERT_ROOT}${cert#/etc/letsencrypt}"
      key="${CERT_ROOT}${key#/etc/letsencrypt}"
      [ -f "$cert" ] && [ -f "$key" ] && return 0
    fi
  fi
  # fallback: هر گواهی معتبر داخل live
  for f in "$CERT_ROOT"/live/*/fullchain.pem; do
    [ -f "$f" ] || continue
    [ -f "${f%/fullchain.pem}/privkey.pem" ] && return 0
  done
  return 1
}

if [ "$MODE" = "auto" ]; then
  if has_cert; then MODE=https; else MODE=http; fi
fi

if [ "$MODE" = "https" ] && ! has_cert; then
  log "حالت https خواسته شد ولی گواهی پیدا نشد → حالت http"
  MODE=http
fi

SRC=""
DOMAIN="${DOMAIN:-lift-tire.com}"

# ۱) فایل نهایی آماده (ساخته‌شده توسط deploy.sh)؟
if [ -f "$SITE_DIR/$MODE.conf" ]; then
  SRC="$SITE_DIR/$MODE.conf"
# ۲) وگرنه همان‌جا از قالب با DOMAIN رندر می‌کنیم
elif [ -f "$SITE_DIR/$MODE.conf.template" ]; then
  log "رندر $MODE.conf از قالب با دامنه $DOMAIN"
  if sed "s|__DOMAIN__|$DOMAIN|g" "$SITE_DIR/$MODE.conf.template" > "/tmp/lifttire-$MODE.conf" 2>/dev/null; then
    SRC="/tmp/lifttire-$MODE.conf"
  fi
fi

# ۳) اگر حالت انتخاب‌شده فایل نداشت، حالت http را امتحان کن
if [ -z "$SRC" ] && [ "$MODE" != "http" ]; then
  log "فایل حالت $MODE پیدا نشد → تلاش برای حالت http"
  MODE=http
  if [ -f "$SITE_DIR/http.conf" ]; then
    SRC="$SITE_DIR/http.conf"
  elif [ -f "$SITE_DIR/http.conf.template" ]; then
    sed "s|__DOMAIN__|$DOMAIN|g" "$SITE_DIR/http.conf.template" > /tmp/lifttire-http.conf 2>/dev/null && SRC=/tmp/lifttire-http.conf
  fi
fi

mkdir -p "$TARGET_DIR"
rm -f "$TARGET_DIR"/*.conf 2>/dev/null || true

if [ -n "$SRC" ] && [ -f "$SRC" ]; then
  cp "$SRC" "$TARGET"
else
  # آخرین سنگر: حتی اگر پوشهٔ کانفیگ کامل نبود، سایت باید بالا بیاید
  log "هیچ فایل کانفیگی پیدا نشد → کانفیگ حداقلی HTTP نوشته می‌شود"
  cat > "$TARGET" <<'FALLBACK'
server {
    listen 80 default_server;
    server_name _;
    location = /healthz { access_log off; default_type text/plain; return 200 "ok\n"; }
    location /api/ { proxy_pass http://api:4000; proxy_set_header Host $host; }
    location / { proxy_pass http://web:3000; proxy_set_header Host $host; }
}
FALLBACK
  MODE=http
fi

if [ "$MODE" = "https" ]; then
  log "حالت فعال: HTTPS ✅  (سایت روی https سرو می‌شود)"
else
  log "حالت فعال: HTTP (بدون گواهی) — سایت بالاست، بعد از certbot خودکار به HTTPS می‌رود"
fi
