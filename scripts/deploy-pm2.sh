#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  Lift Tire — نصب با PM2 (بدون کانتینر برای api/web)
#
#    PM2  →  api (Express) 127.0.0.1:4000
#    PM2  →  web (Next)    127.0.0.1:3000
#    nginx روی خودِ سرور   →  80 / 443
#    certbot روی خودِ سرور →  گواهی رایگان، بدون API Token
#
#  استفاده:
#    ./scripts/deploy-pm2.sh install     نصب کامل از صفر
#    ./scripts/deploy-pm2.sh update      دریافت کد + بیلد + ری‌استارت
#    ./scripts/deploy-pm2.sh restart     فقط ری‌استارت
#    ./scripts/deploy-pm2.sh status      وضعیت
#    ./scripts/deploy-pm2.sh logs        لاگ زنده
#    ./scripts/deploy-pm2.sh ssl         گرفتن گواهی (HTTP-01)
#    ./scripts/deploy-pm2.sh doctor      بررسی سلامت
#    ./scripts/deploy-pm2.sh nginx       فقط بازسازی کانفیگ nginx
#
#  پیش‌نیاز: node ≥ 20، nginx، certbot، postgresql (یا PGlite)
# ══════════════════════════════════════════════════════════════
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

c_green='\033[0;32m'; c_yellow='\033[0;33m'; c_red='\033[0;31m'; c_reset='\033[0m'
info()  { echo -e "${c_green}▸${c_reset} $*"; }
warn()  { echo -e "${c_yellow}⚠${c_reset} $*"; }
error() { echo -e "${c_red}✖${c_reset} $*" >&2; }

NGINX_SITE="/etc/nginx/sites-available/lift-tire.conf"
NGINX_LINK="/etc/nginx/sites-enabled/lift-tire.conf"
NGINX_LIB="/etc/nginx/lifttire"
ACME_WEBROOT="/var/www/certbot"
CERT_DIR="/etc/letsencrypt/live"

# ── خواندن .env ────────────────────────────────────────────────
load_env() {
  if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
  fi
  DOMAIN="${DOMAIN:-lift-tire.com}"
  export DOMAIN
  export API_PORT="${API_PORT:-4000}"
  export WEB_PORT="${WEB_PORT:-3000}"
}

need_root() {
  if [ "$(id -u)" -ne 0 ]; then
    error "این اسکریپت باید با sudo اجرا شود:  sudo ./scripts/deploy-pm2.sh $1"
    exit 1
  fi
}

check_prereqs() {
  local missing=()
  command -v node >/dev/null 2>&1 || missing+=("nodejs")
  command -v npm  >/dev/null 2>&1 || missing+=("npm")
  command -v pm2  >/dev/null 2>&1 || missing+=("pm2")
  command -v nginx >/dev/null 2>&1 || missing+=("nginx")
  if [ ${#missing[@]} -gt 0 ]; then
    error "این ابزارها نصب نیستند: ${missing[*]}"
    echo ""
    echo "  نصب سریع:"
    echo "    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs"
    echo "    npm install -g pm2"
    echo "    apt install -y nginx certbot python3-certbot-nginx"
    exit 1
  fi
  if ! pm2 pid >/dev/null 2>&1 && ! pm2 list >/dev/null 2>&1; then
    warn "PM2 daemon بالا نیست؛ با اولین start راه می‌افتد."
  fi
}

# ── ۱) کانفیگ nginx روی هاست ───────────────────────────────────
render_host_nginx() {
  need_root nginx
  local mode="${1:-auto}"
  local has_cert=0
  [ -f "$CERT_DIR/$DOMAIN/fullchain.pem" ] && [ -f "$CERT_DIR/$DOMAIN/privkey.pem" ] && has_cert=1

  case "$mode" in
    http)  has_cert=0 ;;
    https) [ "$has_cert" -eq 0 ] && { warn "گواهی نیست → حالت HTTP"; } ;;
  esac

  local file="http"
  [ "$has_cert" -eq 1 ] && [ "$mode" != "http" ] && file="https"

  info "نوشتن کانفیگ nginx ($file) برای $DOMAIN…"
  mkdir -p "$NGINX_LIB" "$ACME_WEBROOT/.well-known/acme-challenge" /var/log/nginx

  install -m 0644 nginx/host/locations.conf "$NGINX_LIB/locations.conf"
  sed "s|__DOMAIN__|$DOMAIN|g" "nginx/host/$file.conf.template" > "$NGINX_SITE"
  chmod 0644 "$NGINX_SITE"

  ln -sfn "$NGINX_SITE" "$NGINX_LINK"

  # حذف default پیش‌فرض اوبونتو تا با server_name تداخل نکند
  rm -f /etc/nginx/sites-enabled/default

  if ! nginx -t 2>/tmp/nginx-test.log; then
    error "کانفیگ nginx معتبر نیست:"
    cat /tmp/nginx-test.log
    exit 1
  fi
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
  info "nginx روی حالت $(echo "$file" | tr '[:lower:]' '[:upper:]') فعال شد."
}

# ── ۲) بیلد اپلیکیشن ───────────────────────────────────────────
build_apps() {
  info "نصب وابستگی‌های بک‌اند…"
  ( cd backend && npm ci --omit=dev --no-audit --no-fund ) || {
    error "npm ci بک‌اند ناموفق بود — احتمالاً package-lock.json نیست؛ از npm install استفاده می‌کنم."
    ( cd backend && npm install --omit=dev --no-audit --no-fund ) || exit 1
  }

  info "نصب وابستگی‌های فرانت‌اند…"
  ( cd frontend && { npm ci --no-audit --no-fund || npm install --no-audit --no-fund; } ) || exit 1

  info "بیلد Next.js (standalone)…"
  ( cd frontend && API_INTERNAL_URL="http://127.0.0.1:${API_PORT}" \
      NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://$DOMAIN}" \
      NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="${NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:-}" \
      NEXT_PUBLIC_API_BASE="" \
      npm run build ) || { error "بیلد فرانت‌اند ناموفق بود."; exit 1; }

  # کپی public + static داخل standalone (اگر نباشد ۴۰۴ می‌دهد)
  local SA="frontend/.next/standalone"
  [ -d "$SA" ] || { error "خروجی standalone ساخته نشد."; exit 1; }
  rm -rf "$SA/public" "$SA/.next/static"
  cp -r frontend/public "$SA/public"
  mkdir -p "$SA/.next"
  cp -r frontend/.next/static "$SA/.next/static"
  info "آماده‌سازی standalone انجام شد."
}

# ── ۳) دیتابیس ─────────────────────────────────────────────────
setup_db() {
  local use_pg="${USE_PGLITE:-}"
  if [ -z "$use_pg" ]; then
    if command -v psql >/dev/null 2>&1 && systemctl is-active --quiet postgresql 2>/dev/null; then
      use_pg=false
    else
      use_pg=true
    fi
  fi

  if [ "$use_pg" = "false" ]; then
    info "استفاده از PostgreSQL سیستم…"
    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
      warn "سرویس postgresql فعال نیست — به PGlite سوییچ می‌کنم."
      use_pg=true
    fi
  fi

  if [ "$use_pg" = "true" ]; then
    info "استفاده از PGlite (فایل محلی، بدون سرور دیتابیس)…"
    mkdir -p backend/data/pglite
    # .env را برای دو حالت هماهنگ می‌کنیم
    _set_env USE_PGLITE true
    _set_env PGDATA "$APP_DIR/backend/data/pglite"
  else
    _set_env USE_PGLITE false
    local db_pass="${POSTGRES_PASSWORD:-$(openssl rand -hex 16 2>/dev/null || echo changeme)}"
    _set_env POSTGRES_PASSWORD "$db_pass"
    _set_env DATABASE_URL "postgresql://${POSTGRES_USER:-lifttire}:${db_pass}@127.0.0.1:5432/${POSTGRES_DB:-lifttire}"
    local u="${POSTGRES_USER:-lifttire}" d="${POSTGRES_DB:-lifttire}"
    sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$u'" 2>/dev/null | grep -q 1 \
      || sudo -u postgres psql -c "CREATE ROLE $u LOGIN PASSWORD '$db_pass';" >/dev/null
    sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$d'" 2>/dev/null | grep -q 1 \
      || sudo -u postgres createdb -O "$u" "$d" >/dev/null
    info "دیتابیس $d آماده است."
  fi
  export USE_PGLITE="$use_pg"
}

_set_env() {
  local k="$1" v="$2"
  touch .env
  if grep -qE "^$k=" .env; then
    # با python برای escape امن مقادیر دارای / و : استفاده نمی‌کنیم؛ sed با | امن است
    sed -i "s|^$k=.*|$k=$v|" .env
  else
    printf '%s=%s\n' "$k" "$v" >> .env
  fi
}

seed_db() {
  info "اجرای seed (داده دمو)…"
  ( cd backend && node src/seed.js ) || warn "seed اعمال نشد (ممکن است قبلاً اجرا شده باشد)."
}

# ── ۴) PM2 ─────────────────────────────────────────────────────
pm2_start() {
  info "اجرای اپلیکیشن‌ها با PM2…"
  # env_file در ecosystem به .env اشاره می‌کند؛ PM2 آن را می‌خواند
  pm2 startOrReload ecosystem.config.cjs --update-env >/dev/null || {
    error "PM2 نتوانست اپ‌ها را اجرا کند."
    pm2 logs --nostream --lines 30
    exit 1
  }
  pm2 save >/dev/null 2>&1 || true
  startup_hint
}

startup_hint() {
  if ! systemctl is-enabled pm2-root >/dev/null 2>&1; then
    warn "PM2 بعد از ری‌بوت خودکار بالا نمی‌آید. یک‌بار اجرا کنید:"
    echo "   pm2 startup systemd -u root --hp /root"
    echo "   pm2 save"
  fi
}

wait_ports() {
  info "در انتظار آماده شدن سرویس‌ها…"
  local ok_api=0 ok_web=0
  for _ in $(seq 1 40); do
    [ "$ok_api" -eq 0 ] && [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:${API_PORT}/api/health" 2>/dev/null)" = "200" ] && ok_api=1
    [ "$ok_web" -eq 0 ] && [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:${WEB_PORT}/" 2>/dev/null)" = "200" ] && ok_web=1
    [ "$ok_api" -eq 1 ] && [ "$ok_web" -eq 1 ] && break
    sleep 2
  done
  [ "$ok_api" -eq 1 ] && info "API سالم است." || { warn "API پاسخ نداد:"; pm2 logs lifttire-api --nostream --lines 25; }
  [ "$ok_web" -eq 1 ] && info "وب سالم است."  || { warn "وب پاسخ نداد:";  pm2 logs lifttire-web --nostream --lines 25; }
}

# ── ۵) گواهی SSL ───────────────────────────────────────────────
do_ssl() {
  need_root ssl
  load_env
  local staging=""
  [ "${1:-}" = "--staging" ] && staging="--staging"

  if [ -f "$CERT_DIR/$DOMAIN/fullchain.pem" ]; then
    info "گواهی از قبل موجود است: $CERT_DIR/$DOMAIN"
    render_host_nginx https
    return 0
  fi

  info "اطمینان از آماده بودن حالت HTTP و مسیر ACME…"
  render_host_nginx http
  mkdir -p "$ACME_WEBROOT/.well-known/acme-challenge"
  printf 'lifttire-probe\n' > "$ACME_WEBROOT/.well-known/acme-challenge/probe"
  local got
  got="$(curl -s --max-time 8 "http://$DOMAIN/.well-known/acme-challenge/probe" | tr -d '\r\n')"
  rm -f "$ACME_WEBROOT/.well-known/acme-challenge/probe"
  if [ "$got" != "lifttire-probe" ]; then
    warn "مسیر تأیید از بیرون خوانده نشد."
    echo "   • رکورد A دامنه و www باید به IP این سرور باشد:  curl -4 -s https://api.ipify.org"
    echo "   • فایروال:  ufw allow 'Nginx Full'  (یا 80/443)"
    echo "   • اگر پشت Cloudflare است، رکوردها را موقتاً DNS only کنید."
    echo "   ادامه می‌دهم؛ ممکن است certbot خودش موفق شود…"
  fi

  info "درخواست گواهی برای $DOMAIN و www.$DOMAIN …"
  certbot certonly --webroot -w "$ACME_WEBROOT" \
    --preferred-challenges http \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "${ADMIN_EMAIL:-admin@$DOMAIN}" \
    --agree-tos --no-eff-email --keep-until-expiring $staging
  local st=$?
  if [ $st -ne 0 ]; then
    error "صدور گواهی ناموفق بود (کد $st)."
    echo "   سایت همچنان روی HTTP بالاست. راهنما: docs/DEPLOY-ubuntu.md بخش ۱۹"
    exit 1
  fi

  info "سوییچ nginx به HTTPS…"
  render_host_nginx https

  # تمدید خودکار
  cat > /etc/cron.d/lifttire-certbot <<CRON
# تمدید خودکار گواهی لیفت تایر
0 4 * * * root certbot renew --webroot -w $ACME_WEBROOT --quiet --deploy-hook "systemctl reload nginx" >> /var/log/lifttire-certbot.log 2>&1
CRON
  chmod 0644 /etc/cron.d/lifttire-certbot
  info "cron تمدید خودکار نصب شد: /etc/cron.d/lifttire-certbot"

  info "بررسی HTTPS…"
  sleep 2
  local code
  code="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 8 -H "Host: $DOMAIN" "https://127.0.0.1/" || true)"
  [ "$code" = "200" ] && info "HTTPS سالم است (کد ۲۰۰)." || warn "پاسخ HTTPS محلی: ${code:-none} — لاگ: journalctl -u nginx -n 50"
}

# ── ۶) دستورها ─────────────────────────────────────────────────
do_install() {
  need_root install
  load_env
  check_prereqs
  info "نصب با PM2 — دامنه: $DOMAIN"

  if [ ! -f .env ]; then
    warn "فایل .env نبود؛ از .env.example ساخته می‌شود."
    cp .env.example .env
    local s; s="$(openssl rand -hex 32 2>/dev/null || date +%s%N)"
    sed -i "s|CHANGE_ME_TO_A_LONG_A_RANDOM_SECRET|$s|;s|CHANGE_ME_TO_A_LONG_RANDOM_SECRET|$s|" .env
    load_env
  fi

  setup_db
  build_apps
  render_host_nginx auto
  pm2_start
  wait_ports
  seed_db
  info "نصب PM2 کامل شد 🎉  →  http://$DOMAIN"
  do_status
}

do_update() {
  need_root update
  load_env
  check_prereqs
  if [ -d .git ]; then
    info "دریافت کد جدید…"
    git pull --ff-only || warn "git pull انجام نشد؛ با کد فعلی ادامه می‌دهم."
  fi
  build_apps
  pm2_start
  wait_ports
  render_host_nginx auto
  info "بروزرسانی انجام شد ✅"
}

do_restart() {
  need_root restart
  load_env
  pm2 startOrReload ecosystem.config.cjs --update-env >/dev/null 2>&1 || pm2 restart all
  systemctl reload nginx 2>/dev/null || true
  wait_ports
}

do_status() {
  load_env
  echo ""
  echo "══════ وضعیت PM2 ══════"
  pm2 list 2>/dev/null || error "PM2 در دسترس نیست."
  echo ""
  local a w h
  a="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:${API_PORT}/api/health" 2>/dev/null || true)"
  w="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:${WEB_PORT}/" 2>/dev/null || true)"
  h="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1/ 2>/dev/null || true)"
  echo "  API  127.0.0.1:${API_PORT}/api/health → ${a:-000}"
  echo "  Web  127.0.0.1:${WEB_PORT}/            → ${w:-000}"
  echo "  nginx http://127.0.0.1/                → ${h:-000}"
  echo ""
  if [ -f "$CERT_DIR/$DOMAIN/fullchain.pem" ]; then
    local s
    s="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 3 -H "Host: $DOMAIN" https://127.0.0.1/ || true)"
    echo "  https://$DOMAIN → ${s:-000}"
  else
    echo "  حالت: HTTP (بدون گواهی) — برای HTTPS:  sudo ./scripts/deploy-pm2.sh ssl"
  fi
  echo ""
}

do_doctor() {
  load_env
  echo ""
  echo "══════ 🩺 بررسی سلامت (PM2) — $DOMAIN ══════"
  echo ""
  echo "▸ ابزارها"
  for t in node npm pm2 nginx certbot; do
    if command -v "$t" >/dev/null 2>&1; then echo "  ✓ $t"; else echo "  ✗ $t (نصب نیست)"; fi
  done
  echo ""
  echo "▸ پورت‌های ۸۰/۴۴۳"
  ss -lntp 2>/dev/null | grep -E ':(80|443)\s' || echo "  ⚠ هیچ‌چیز روی ۸۰/۴۴۳ گوش نمی‌دهد"
  echo ""
  echo "▸ پورت‌های اپ"
  ss -lntp 2>/dev/null | grep -E ":(${API_PORT}|${WEB_PORT})\s" || echo "  ⚠ api/web گوش نمی‌دهند (pm2 list)"
  echo ""
  echo "▸ nginx"
  nginx -t 2>&1 | tail -2
  echo "  فایل فعال: $NGINX_SITE"
  [ -f "$NGINX_SITE" ] && grep -m1 "listen" "$NGINX_SITE" | sed 's/^/  /'
  echo ""
  echo "▸ گواهی"
  if [ -f "$CERT_DIR/$DOMAIN/fullchain.pem" ]; then
    openssl x509 -in "$CERT_DIR/$DOMAIN/fullchain.pem" -noout -enddate 2>/dev/null | sed 's/^/  ✓ /'
  else
    echo "  ✗ نصب نشده (سایت روی HTTP کار می‌کند)"
  fi
  echo ""
  do_status
}

do_logs() { pm2 logs "${2:-}" ; }

case "${1:-}" in
  install) do_install ;;
  update)  do_update ;;
  restart) do_restart ;;
  status)  do_status ;;
  logs)    do_logs "$@" ;;
  ssl)     do_ssl "${2:-}" ;;
  nginx)   need_root nginx; load_env; render_host_nginx "${2:-auto}" ;;
  doctor)  do_doctor ;;
  *)
    echo "استفاده: $0 {install|update|restart|status|logs|ssl|nginx|doctor}"
    echo "  install   نصب کامل: وابستگی‌ها + بیلد + دیتابیس + PM2 + nginx"
    echo "  update    git pull + بیلد مجدد + ری‌استارت PM2"
    echo "  restart   ری‌استارت PM2 و nginx"
    echo "  status    وضعیت PM2 و پاسخ سرویس‌ها"
    echo "  logs      لاگ زنده (اختیاری: lifttire-api | lifttire-web)"
    echo "  ssl       گرفتن گواهی Let's Encrypt با certbot و سوییچ به HTTPS"
    echo "  nginx     بازسازی کانفیگ nginx (auto|http|https)"
    echo "  doctor    بررسی کامل سلامت"
    exit 1
    ;;
esac
