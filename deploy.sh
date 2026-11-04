#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  Lift Tire — اسکریپت دیپلوی
#  استفاده:  ./deploy.sh install | update | backup | restart | status | logs | seed
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
  do_ssl_check || true
  $COMPOSE up -d nginx
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
  $COMPOSE up -d --remove-orphans
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
  $COMPOSE restart
  info "سرویس‌ها ری‌استارت شدند."
  do_status
}

do_status() {
  need_root_hint
  $COMPOSE ps
  echo
  if curl -fsS http://127.0.0.1:${API_PORT:-4000}/api/health >/dev/null 2>&1; then
    info "API سالم است: $(curl -fsS http://127.0.0.1:${API_PORT:-4000}/api/health)"
  else
    warn "API از هاست پاسخ نداد (ممکن است پورت به 127.0.0.1 محدود شده باشد)."
  fi
}

do_logs() { $COMPOSE logs -f --tail=120 "${2:-}"; }

resolve_domain() {
  if [ -z "${DOMAIN:-}" ] && [ -f .env ]; then
    DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ')"
  fi
  export DOMAIN="${DOMAIN:-lifttire.com}"
}

render_nginx_conf() {
  resolve_domain
  if [ -f nginx/conf/lifttire.conf.template ]; then
    sed "s|__DOMAIN__|${DOMAIN}|g" nginx/conf/lifttire.conf.template > nginx/conf/lifttire.conf
    info "کانفیگ nginx برای دامنه ${DOMAIN} ساخته شد."
  fi
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
  warn "گواهی SSL یافت نشد — nginx تا زمان اجرای scripts/ssl-certbot.sh بالا نمی‌آید."
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
  *)
    echo "استفاده: $0 {install|update|backup|restart|status|logs|seed}"
    echo "  install  نصب اولیه (بیلد + دیتابیس + seed + nginx)"
    echo "  update   دریافت کد جدید و بیلد مجدد با بکاپ خودکار"
    echo "  backup   بکاپ دیتابیس و تصاویر آپلودی"
    echo "  restart  ری‌استارت سرویس‌ها"
    echo "  status   وضعیت سرویس‌ها و سلامت API"
    echo "  logs     مشاهده لاگ‌ها (اختیاری: نام سرویس)"
    echo "  seed     اجرای داده دمو (اختیاری: --force)"
    exit 1
    ;;
esac
