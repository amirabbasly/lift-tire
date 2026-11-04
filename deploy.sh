#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  Lift Tire — اسکریپت دیپلوی
#  استفاده:  ./deploy.sh install | update | backup | restart | status | logs | seed | ssl | doctor | clean
# ══════════════════════════════════════════════════════════════
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"
COMPOSE="docker compose"
BACKUP_DIR="$APP_DIR/backups"
KEEP_BACKUPS=14

c_green='\033[0;32m'; c_yellow='\033[0;33m'; c_red='\033[0;31m'; c_reset='\033[0m'
info()  { echo -e "${c_green}▸${c_reset} $*"; }
warn()  { echo -e "${c_yellow}⚠${c_reset} $*"; }
error() { echo -e "${c_red}✖${c_reset} $*" >&2; }

need_root_hint() {
  if ! command -v docker >/dev/null 2>&1; then
    error "داکر نصب نیست. راهنمای نصب در README بخش «آماده‌سازی سرور» آمده است."
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose v2 در دسترس نیست (docker compose)."
    exit 1
  fi
}

ensure_env() {
  if [ ! -f .env ]; then
    warn "فایل .env وجود ندارد؛ از .env.example ساخته می‌شود."
    cp .env.example .env
    SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N)
    sed -i "s|CHANGE_ME_TO_A_LONG_RANDOM_SECRET|$SECRET|" .env
    warn "رمز دیتابیس و JWT در .env تولید شد. مقادیر را بررسی کنید."
  fi
}

wait_db() {
  info "در انتظار آماده شدن PostgreSQL…"
  for i in $(seq 1 40); do
    if $COMPOSE exec -T postgres pg_isready -U "${POSTGRES_USER:-lifttire}" -d "${POSTGRES_DB:-lifttire}" >/dev/null 2>&1; then
      info "PostgreSQL آماده است."
      return 0
    fi
    sleep 2
  done
  error "PostgreSQL بالا نیامد."
  exit 1
}

do_install() {
  need_root_hint
  ensure_env
  render_nginx_conf
  info "بیلد ایمیج‌ها…"
  $COMPOSE build
  info "بالا آوردن سرویس‌ها…"
  $COMPOSE up -d postgres
  wait_db
  $COMPOSE up -d api web
  sleep 4
  if $COMPOSE exec -T api node src/seed.js >/dev/null 2>&1; then
    info "داده اولیه (seed) اعمال شد."
  else
    warn "seed قبلاً اجرا شده یا با خطا مواجه شد — برای بازسازی: ./deploy.sh seed --force"
  fi
  info "بالا آوردن nginx (حالت خودکار: با گواهی → HTTPS، بدون گواهی → HTTP)…"
  $COMPOSE up -d nginx
  sleep 2
  if do_ssl_check >/dev/null 2>&1; then
    info "nginx با HTTPS بالا آمد."
  else
    info "nginx در حالت HTTP بالا آمد — سایت همین حالا در دسترس است."
    info "برای فعال‌کردن HTTPS: ./scripts/ssl-certbot.sh"
  fi
  info "نصب کامل شد 🎉"
  do_status
}

do_update() {
  need_root_hint
  ensure_env
  info "بکاپ پیش از بروزرسانی…"
  do_backup || warn "بکاپ انجام نشد (ادامه می‌دهیم)."
  info "دریافت آخرین تغییرات کد…"
  if git rev-parse --git-dir >/dev/null 2>&1; then
    git pull --ff-only || warn "git pull انجام نشد؛ از کد فعلی بیلد می‌گیریم."
  fi
  info "بیلد مجدد…"
  $COMPOSE build
  info "ری‌استارت سرویس‌ها…"
  $COMPOSE up -d --remove-orphans postgres api web
  $COMPOSE up -d nginx
  if do_ssl_check >/dev/null 2>&1; then
    info "nginx در حالت HTTPS."
  else
    info "nginx در حالت HTTP (بدون گواهی) — برای HTTPS: ./scripts/ssl-certbot.sh"
  fi
  sleep 4
  info "بروزرسانی انجام شد ✅"
  do_status
}

do_backup() {
  need_root_hint
  mkdir -p "$BACKUP_DIR"
  STAMP=$(date +%Y%m%d-%H%M%S)
  FILE="$BACKUP_DIR/lifttire-$STAMP.sql.gz"
  info "بکاپ دیتابیس در $FILE …"
  if $COMPOSE exec -T postgres pg_dump -U "${POSTGRES_USER:-lifttire}" "${POSTGRES_DB:-lifttire}" | gzip > "$FILE"; then
    info "بکاپ دیتابیس ساخته شد ($(du -h "$FILE" | cut -f1))."
  else
    error "بکاپ دیتابیس ناموفق بود."
    rm -f "$FILE"
    return 1
  fi
  # بکاپ آپلودها
  info "بکاپ تصاویر آپلودی…"
  docker run --rm -v lifttire_uploads:/data -v "$BACKUP_DIR":/backup alpine \
    tar czf "/backup/uploads-$STAMP.tar.gz" -C /data . 2>/dev/null && info "بکاپ آپلودها ساخته شد." || warn "بکاپ آپلودها انجام نشد."
  ls -1t "$BACKUP_DIR"/lifttire-*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f
}

do_restart() {
  need_root_hint
  render_nginx_conf
  $COMPOSE up -d postgres api web
  # nginx با ری‌استارت، حالت خودکار (http/https) را دوباره تشخیص می‌دهد
  $COMPOSE up -d --force-recreate nginx
  info "سرویس‌ها ری‌استارت شدند."
  do_status
}

# ── بررسی کامل سلامت نصب ────────────────────────────────────
do_doctor() {
  need_root_hint
  resolve_domain
  echo ""
  echo "══════════ 🩺 بررسی سلامت لیفت تایر ($DOMAIN) ══════════"

  echo ""
  echo "▸ داکر"
  docker --version 2>/dev/null || error "docker در دسترس نیست"
  docker compose version 2>/dev/null || error "docker compose در دسترس نیست"
  docker info >/dev/null 2>&1 && echo "   ✓ daemon داکر فعال است" || echo "   ✗ daemon داکر فعال نیست (systemctl start docker)"

  echo ""
  echo "▸ فایل .env"
  if [ ! -f .env ]; then
    echo "   ✗ فایل .env وجود ندارد — اجرا کنید: cp .env.example .env"
  fi
  for k in DOMAIN JWT_SECRET POSTGRES_PASSWORD ADMIN_EMAIL NEXT_PUBLIC_SITE_URL; do
    if grep -qE "^$k=" .env 2>/dev/null; then
      v="$(grep -E "^$k=" .env | head -1 | cut -d= -f2-)"
      case "$k" in
        JWT_SECRET|POSTGRES_PASSWORD) echo "   ✓ $k = ($(printf '%s' "$v" | wc -c) کاراکتر)" ;;
        *) echo "   ✓ $k = $v" ;;
      esac
    else
      echo "   ✗ $k تعریف نشده"
    fi
  done

  echo ""
  echo "▸ پورت‌های ۸۰ و ۴۴۳"
  if command -v ss >/dev/null 2>&1; then
    ss -lntp 2>/dev/null | grep -E ':80\s|:443\s' || echo "   ⚠ هیچ سرویسی روی ۸۰/۴۴۳ گوش نمی‌دهد (nginx بالا نیست؟)"
  fi

  echo ""
  echo "▸ DNS"
  SERVER_IP="$(curl -4 -fsS --max-time 6 https://api.ipify.org 2>/dev/null || true)"
  echo "   IP سرور: ${SERVER_IP:-نامشخص}"
  for d in "$DOMAIN" "www.$DOMAIN"; do
    ips="$(getent ahostsv4 "$d" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' || true)"
    echo "   $d → ${ips:-نامشخص}"
    case " $ips " in
      *" 104.21."*|*" 172.67."*|*" 172.64."*) echo "     ↳ پشت Cloudflare (روش DNS-01 یا Origin Certificate مناسب است)" ;;
      *"${SERVER_IP:-__none__}"*) echo "     ↳ مستقیم به این سرور ✓" ;;
    esac
  done

  echo ""
  echo "▸ گواهی SSL"
  CERT="nginx/certbot/conf/live/$DOMAIN/fullchain.pem"
  if [ -f "$CERT" ]; then
    if command -v openssl >/dev/null 2>&1; then
      echo "   ✓ موجود — $(openssl x509 -in "$CERT" -noout -enddate 2>/dev/null | cut -d= -f2)"
    else
      echo "   ✓ موجود"
    fi
  else
    echo "   ✗ نصب نشده"
  fi

  echo ""
  echo "▸ کانتینرها"
  $COMPOSE ps 2>/dev/null || true

  echo ""
  echo "▸ پاسخ سرویس‌ها (از داخل سرور)"
  code() { local o; o="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$@" 2>/dev/null || true)"; echo "${o:-000}"; }
  echo "   API  127.0.0.1:${API_PORT:-4000}/api/health → $(code "http://127.0.0.1:${API_PORT:-4000}/api/health")"
  echo "   Web  127.0.0.1:${WEB_PORT:-3000}/            → $(code "http://127.0.0.1:${WEB_PORT:-3000}/")"
  echo "   Nginx http://127.0.0.1/                      → $(code "http://127.0.0.1/")"
  echo "   Nginx https://127.0.0.1/ (Host: $DOMAIN)      → $(code -k -H "Host: $DOMAIN" "https://127.0.0.1/")"

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "راهنمای رفع: کد ۵۲۱/۵۲۶ در Cloudflare ← docs/DEPLOY-ubuntu.md بخش ۲۰"
  echo ""
}

# ── پاک‌سازی کامل داکر و شروع تمیز ─────────────────────────
do_clean() {
  need_root_hint
  warn "همهٔ کانتینرها و شبکهٔ پروژه حذف می‌شوند (داده‌ها در volume باقی می‌مانند)."
  if [ "${2:-}" != "--yes" ]; then
    read -rp "مطمئنید؟ (yes/NO): " ans
    [ "$ans" = "yes" ] || { info "لغو شد."; exit 0; }
  fi
  $COMPOSE down --remove-orphans || true
  docker image prune -f >/dev/null 2>&1 || true
  if [ "${2:-}" = "--volumes" ] || [ "${3:-}" = "--volumes" ]; then
    warn "حذف volumeها (دیتابیس و آپلودها)…"
    $COMPOSE down -v --remove-orphans || true
  fi
  info "پاک‌سازی انجام شد. برای نصب مجدد: ./deploy.sh install"
}

do_status() {
  need_root_hint
  $COMPOSE ps
  echo
  if curl -fsS "http://127.0.0.1:${API_PORT:-4000}/api/health" >/dev/null 2>&1; then
    info "API سالم است: $(curl -fsS "http://127.0.0.1:${API_PORT:-4000}/api/health")"
  else
    warn "API از هاست پاسخ نداد (ممکن است پورت به 127.0.0.1 محدود شده باشد)."
  fi

  # حالت nginx: HTTP یا HTTPS
  resolve_domain
  HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1/healthz 2>/dev/null || true)"
  echo ""
  if [ -f "nginx/certbot/conf/live/${DOMAIN}/fullchain.pem" ]; then
    info "nginx: حالت HTTPS — گواهی ${DOMAIN} موجود است."
    HTTPS_CODE="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 5 "https://127.0.0.1/healthz" 2>/dev/null || true)"
    echo "   http  : ${HTTP_CODE:-000} (باید 301 باشد)"
    echo "   https : ${HTTPS_CODE:-000} (باید 200 باشد)"
    echo "   آدرس  : https://${DOMAIN}"
  else
    warn "nginx: حالت HTTP — گواهی SSL نصب نشده (سایت روی http کار می‌کند)."
    echo "   http  : ${HTTP_CODE:-000} (باید 200 باشد)"
    echo "   آدرس  : http://${DOMAIN}"
    echo "   برای فعال‌سازی HTTPS: ./deploy.sh ssl"
  fi
}

do_logs() { $COMPOSE logs -f --tail=120 "${2:-}"; }

resolve_domain() {
  if [ -z "${DOMAIN:-}" ] && [ -f .env ]; then
    DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ')"
  fi
  export DOMAIN="${DOMAIN:-lift-tire.com}"
}

render_nginx_conf() {
  resolve_domain
  mkdir -p nginx/site
  local made=0
  for f in http https; do
    if [ -f "nginx/site/$f.conf.template" ]; then
      sed "s|__DOMAIN__|${DOMAIN}|g" "nginx/site/$f.conf.template" > "nginx/site/$f.conf"
      made=1
    fi
  done
  [ "$made" -eq 1 ] && info "کانفیگ nginx برای دامنه ${DOMAIN} ساخته شد (http + https)."
}

do_ssl() {
  need_root_hint
  render_nginx_conf
  if ! bash ./scripts/ssl-certbot.sh "${@:2}"; then
    error "گرفتن گواهی انجام نشد. سایت همچنان روی HTTP بالاست."
    exit 1
  fi
  # در حالت تست (--dry-run) گواهی صادر نمی‌شود؛ nginx را دست نمی‌زنیم
  case " ${*:2} " in
    *" --dry-run "*|*" --staging "*" --dry-run "*)
      info "تست انجام شد؛ برای صدور واقعی: ./deploy.sh ssl"
      return 0 ;;
  esac
  info "ری‌استارت nginx برای فعال‌سازی HTTPS…"
  $COMPOSE up -d --force-recreate nginx
  sleep 2
  do_status
}

do_seed() {
  need_root_hint
  $COMPOSE exec -T api node src/seed.js "${2:-}"
}

do_ssl_check() {
  resolve_domain
  if [ -f "nginx/certbot/conf/live/${DOMAIN}/fullchain.pem" ]; then
    info "گواهی SSL موجود است."
    return 0
  fi
  warn "گواهی SSL یافت نشد — nginx در حالت HTTP کار می‌کند (سایت بالا است)."
  return 1
}

case "${1:-}" in
  install) do_install ;;
  update)  do_update ;;
  backup)  do_backup ;;
  restart) do_restart ;;
  status)  do_status ;;
  logs)    do_logs "$@" ;;
  seed)    do_seed "$@" ;;
  ssl)     do_ssl "$@" ;;
  doctor)  do_doctor ;;
  clean)   do_clean "$@" ;;
  *)
    echo "استفاده: $0 {install|update|backup|restart|status|logs|seed|ssl|doctor|clean}"
    echo "  install  نصب اولیه (بیلد + دیتابیس + seed + nginx)"
    echo "  update   دریافت کد جدید و بیلد مجدد با بکاپ خودکار"
    echo "  backup   بکاپ دیتابیس و تصاویر آپلودی"
    echo "  restart  ری‌استارت سرویس‌ها"
    echo "  status   وضعیت سرویس‌ها و سلامت API"
    echo "  logs     مشاهده لاگ‌ها (اختیاری: نام سرویس)"
    echo "  seed     اجرای داده دمو (اختیاری: --force)"
    echo "  ssl      گرفتن گواهی Let's Encrypt با certbot و سوییچ nginx به HTTPS"
    echo "  doctor   بررسی کامل سلامت نصب (Docker، DNS، SSL، کانتینرها، پاسخ‌ها)"
    echo "  clean    پاک‌سازی کامل کانتینرها (--yes برای بدون سؤال، --volumes برای حذف داده)"
    exit 1
    ;;
esac
