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
green_msg() { echo -e "${c_green}$*${c_reset}"; }

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
      verify_db_credentials
      return $?
    fi
    sleep 2
  done
  error "PostgreSQL بالا نیامد."
  exit 1
}

# رمز داخل volume با رمز .env یکی است؟ (منبع شمارهٔ یک کرش‌لوپ API)
verify_db_credentials() {
  local u="${POSTGRES_USER:-lifttire}" d="${POSTGRES_DB:-lifttire}"
  local pw="${POSTGRES_PASSWORD:-lifttire_pass}"
  if $COMPOSE exec -T -e PGPASSWORD="$pw" postgres \
       psql -U "$u" -d "$d" -c 'SELECT 1' >/dev/null 2>&1; then
    return 0
  fi

  error "رمز دیتابیس با داده‌های volume هم‌خوان نیست."
  echo "   یعنی فایل .env (رمز جدید) با volume قدیمی lifttire_pgdata (رمز قدیم) جور نیست."
  echo "   بدون این، کانتینر api مدام ری‌استارت می‌شود و سایت ۵۰۲ می‌دهد."
  echo ""
  echo "   راه‌حل ۱ (پیشنهادی، داده دمو بازسازی می‌شود):"
  echo "      ./deploy.sh clean --yes --volumes"
  echo "      ./deploy.sh install"
  echo ""
  echo "   راه‌حل ۲ (داده‌ها می‌مانند — رمز دیتابیس را با .env هم‌خوان کنید):"
  echo "      docker compose exec postgres psql -U $u -d $d -c \"ALTER USER $u WITH PASSWORD '\$POSTGRES_PASSWORD';\""
  echo ""
  echo "   راه‌حل ۳ (رمز فعلی volume را می‌دانید → همان را در .env بگذارید):"
  echo "      nano .env   # POSTGRES_PASSWORD=...  و در DATABASE_URL هم همان رمز"
  echo ""
  exit 1
}

do_install() {
  need_root_hint
  ensure_env
  resolve_domain
  prepare_cert_dirs
  render_nginx_conf
  info "بیلد ایمیج‌ها…"
  $COMPOSE build
  info "بالا آوردن سرویس‌ها…"
  $COMPOSE up -d postgres
  wait_db
  $COMPOSE up -d api web
  sleep 4
  check_api_alive || true
  if $COMPOSE exec -T api node src/seed.js >/dev/null 2>&1; then
    info "داده اولیه (seed) اعمال شد."
  else
    warn "seed قبلاً اجرا شده یا با خطا مواجه شد — برای بازسازی: ./deploy.sh seed --force"
  fi
  info "بالا آوردن nginx (حالت خودکار: با گواهی → HTTPS، بدون گواهی → HTTP)…"
  start_nginx || warn "nginx بالا نیامد — راهنمای بالا را ببینید. بقیهٔ سرویس‌ها سالم‌اند."
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

# ── یک دستور: کل سایت را روی HTTP بالا بیاور (بدون نیاز به SSL) ──
do_up() {
  need_root_hint
  ensure_env
  resolve_domain
  prepare_cert_dirs
  render_nginx_conf
  info "بیلد ایمیج‌ها…"
  $COMPOSE build
  info "بالا آوردن سرویس‌ها…"
  $COMPOSE up -d postgres
  wait_db || exit 1
  $COMPOSE up -d api web
  sleep 4
  check_api_alive || warn "API مشکل دارد — ولی ادامه می‌دهم تا لاگ‌ها را ببینید."
  if $COMPOSE exec -T api node src/seed.js >/dev/null 2>&1; then
    info "داده اولیه (seed) اعمال شد."
  else
    info "seed از قبل اجرا شده (طبیعی است)."
  fi
  info "بالا آوردن nginx…"
  start_nginx || { error "nginx بالا نیامد — دلیل بالا."; exit 1; }
  sleep 3
  do_status

  echo ""
  if do_ssl_check >/dev/null 2>&1; then
    green_msg "✅ سایت روی HTTPS بالاست:  https://$DOMAIN"
  else
    green_msg "✅ سایت روی HTTP بالاست:  http://$DOMAIN   (یا http://$(curl -4 -s --max-time 4 https://api.ipify.org 2>/dev/null || echo IP-SERVER))"
    echo ""
    echo "   مرحله بعد — گرفتن گواهی SSL با certbot نصبی (بدون Cloudflare):"
    echo "     sudo ./scripts/ssl-certbot.sh --dry-run"
    echo "     sudo ./scripts/ssl-certbot.sh"
  fi
}

do_update() {
  need_root_hint
  ensure_env
  resolve_domain
  prepare_cert_dirs
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
  start_nginx || true
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
  resolve_domain
  prepare_cert_dirs
  render_nginx_conf
  $COMPOSE up -d postgres api web
  # nginx با ری‌استارت، حالت خودکار (http/https) را دوباره تشخیص می‌دهد
  start_nginx --force-recreate || warn "nginx بالا نیامد؛ docker compose logs nginx را ببینید."
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
      *" 104.21."*|*" 172.67."*|*" 172.64."*) echo "     ↳ پشت Cloudflare — برای certbot موقتاً رکورد را DNS only کنید (یا Origin Certificate)" ;;
      *"${SERVER_IP:-__none__}"*) echo "     ↳ مستقیم به این سرور ✓" ;;
    esac
  done

  echo ""
  echo "▸ گواهی SSL"
  CERT="${LETSENCRYPT_DIR}/live/$DOMAIN/fullchain.pem"
  if [ -f "$CERT" ]; then
    if command -v openssl >/dev/null 2>&1; then
      echo "   ✓ موجود — $(openssl x509 -in "$CERT" -noout -enddate 2>/dev/null | cut -d= -f2)"
    else
      echo "   ✓ موجود"
    fi
  else
    echo "   ✗ نصب نشده → سایت در حالت HTTP کار می‌کند؛ برای HTTPS: ./deploy.sh ssl"
  fi

  echo ""
  echo "▸ کانتینرها"
  $COMPOSE ps 2>/dev/null || true

  echo ""
  echo "▸ سلامت API (دلیل واقعی خطا)"
  if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 4 "http://127.0.0.1:${API_PORT:-4000}/api/health" 2>/dev/null)" != "200" ]; then
    check_api_alive 2>&1 | head -20
  else
    echo "   ✓ API پاسخ ۲۰۰ می‌دهد"
  fi

  echo ""
  echo "▸ پاسخ سرویس‌ها (از داخل سرور)"
  code() { local o; o="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$@" 2>/dev/null || true)"; echo "${o:-000}"; }
  echo "   API  127.0.0.1:${API_PORT:-4000}/api/health → $(code "http://127.0.0.1:${API_PORT:-4000}/api/health")"
  echo "   Web  127.0.0.1:${WEB_PORT:-3000}/            → $(code "http://127.0.0.1:${WEB_PORT:-3000}/")"
  H_CODE="$(code "http://127.0.0.1/")"
  echo "   Nginx http://127.0.0.1/                      → $H_CODE"
  if [ -f "$CERT" ]; then
    S_CODE="$(code -k -H "Host: $DOMAIN" "https://127.0.0.1/")"
    echo "   Nginx https://127.0.0.1/ (Host: $DOMAIN)      → $S_CODE"
    [ "$S_CODE" = "200" ] || echo "      ⚠ HTTPS جواب نداد — لاگ: docker compose logs --tail=30 nginx"
  else
    echo "   حالت فعال: HTTP (بدون گواهی) — برای HTTPS: ./deploy.sh ssl"
  fi

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
  info "پاک‌سازی انجام شد. برای نصب مجدد: ./deploy.sh up"
}

# ── پاک‌سازی کامل: کانتینرها، ایمیج‌ها، volumeها، گواهی، nginx و پوشهٔ پروژه ──
do_destroy() {
  need_root_hint
  resolve_domain
  local assume_yes=0 keep_code=0 purge_cert=0
  local a
  for a in "$@"; do
    case "$a" in
      --yes|-y)   assume_yes=1 ;;
      --keep-code) keep_code=1 ;;
      --purge-cert) purge_cert=1 ;;
    esac
  done

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  ⚠️  پاک‌سازی کامل — این موارد حذف می‌شوند:"
  echo "═══════════════════════════════════════════════════════"
  echo "   • کانتینرها و شبکهٔ lifttire"
  echo "   • ایمیج‌های lifttire-api / lifttire-web"
  echo "   • volumeهای lifttire_pgdata و lifttire_uploads (دیتابیس + آپلودها!)"
  echo "   • گواهی SSL در $LETSENCRYPT_DIR/live/$DOMAIN"
  echo "   • کانفیگ‌های nginx: /etc/nginx/sites-enabled/lift-tire.conf و /etc/nginx/lifttire"
  if [ "$keep_code" -eq 0 ]; then
    echo "   • خودِ پوشهٔ پروژه: $APP_DIR   (کد + .env + بیلدها)"
  else
    echo "   (کد پروژه و .env نگه داشته می‌شوند: --keep-code)"
  fi
  echo "═══════════════════════════════════════════════════════"
  echo ""

  if [ "$assume_yes" -eq 0 ]; then
    read -rp "برای ادامه عبارت «DELETE» را دقیقاً بنویسید: " ans
    [ "$ans" = "DELETE" ] || { info "لغو شد — هیچ تغییری انجام نشد."; exit 0; }
  fi

  info "توقف و حذف کانتینرها + volumeها…"
  $COMPOSE down -v --remove-orphans >/dev/null 2>&1 ||     docker rm -f lifttire_db lifttire_api lifttire_web lifttire_nginx >/dev/null 2>&1 || true
  docker network rm lifttire_lifttire >/dev/null 2>&1 || true

  info "حذف volumeهای باقی‌مانده (اگر نام دیگری داشتند)…"
  for v in lifttire_pgdata lifttire_uploads; do
    docker volume rm -f "$v" >/dev/null 2>&1 || true
  done

  info "حذف ایمیج‌های پروژه…"
  for img in lifttire-api lifttire-web; do
    docker rmi -f "$img" >/dev/null 2>&1 || true
    docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' 2>/dev/null | grep -E "^lifttire-" | awk '{print $2}' | xargs -r docker rmi -f >/dev/null 2>&1 || true
  done

  if [ "$purge_cert" -eq 1 ] || [ -d "$LETSENCRYPT_DIR/live/$DOMAIN" ]; then
    info "حذف گواهی $DOMAIN از certbot…"
    command -v certbot >/dev/null 2>&1 && certbot delete --cert-name "$DOMAIN" --non-interactive >/dev/null 2>&1 || true
    rm -rf "$LETSENCRYPT_DIR/live/$DOMAIN" "$LETSENCRYPT_DIR/archive/$DOMAIN" \
           "$LETSENCRYPT_DIR/renewal/$DOMAIN.conf" 2>/dev/null || true
  fi

  info "حذف کانفیگ nginx و ری‌لود…"
  rm -f /etc/nginx/sites-enabled/lift-tire.conf /etc/nginx/sites-available/lift-tire.conf
  rm -rf /etc/nginx/lifttire
  rm -f /etc/cron.d/lifttire-certbot
  if command -v nginx >/dev/null 2>&1; then
    nginx -t >/dev/null 2>&1 && systemctl reload nginx 2>/dev/null || true
  fi

  # PM2 (اگر مسیر PM2 را هم استفاده کرده بودید)
  if command -v pm2 >/dev/null 2>&1; then
    info "حذف اپ‌های PM2 (اگر بودند)…"
    pm2 delete lifttire-api lifttire-web >/dev/null 2>&1 || true
    pm2 save --force >/dev/null 2>&1 || true
  fi

  info "حذف پوشه‌های runtime داخل پروژه…"
  rm -rf "$APP_DIR/backend/data/pglite" "$APP_DIR/backend/uploads/"* "$APP_DIR/logs" 2>/dev/null || true

  if [ "$keep_code" -eq 0 ]; then
    info "حذف خودِ پوشهٔ پروژه: $APP_DIR"
    # از والد خارج می‌شویم تا حذف خودمان ممکن باشد
    local parent; parent="$(dirname "$APP_DIR")"
    cd "$parent" || exit 1
    rm -rf "$APP_DIR"
    echo ""
    green_msg "✅ پاک‌سازی کامل انجام شد. پوشهٔ $APP_DIR حذف شد."
    echo ""
    echo "   برای شروع از صفر:"
    echo "     cd $parent"
    echo "     git clone <REPO_URL> $(basename "$APP_DIR") && cd $(basename "$APP_DIR")"
    echo "     ./deploy.sh up"
    exit 0
  fi

  echo ""
  green_msg "✅ پاک‌سازی انجام شد (کد نگه داشته شد)."
  echo "   شروع مجدد:  ./deploy.sh up"
}

do_status() {
  need_root_hint
  $COMPOSE ps
  echo
  if curl -fsS "http://127.0.0.1:${API_PORT:-4000}/api/health" >/dev/null 2>&1; then
    info "API سالم است: $(curl -fsS "http://127.0.0.1:${API_PORT:-4000}/api/health")"
  else
    API_STATE="$(docker inspect -f '{{.State.Status}}' lifttire_api 2>/dev/null || echo missing)"
    if [ "$API_STATE" = "restarting" ] || [ "$API_STATE" = "exited" ]; then
      error "API در حال کرش‌کردن است (وضعیت: $API_STATE) — سایت ۵۰۲ می‌دهد."
      echo "   لاگ خطا:"
      docker compose logs --tail=20 api 2>&1 | sed 's/^/     /'
      echo "   بررسی کامل:  ./deploy.sh doctor     (دلیل را به فارسی می‌گوید)"
    else
      warn "API از هاست پاسخ نداد (وضعیت کانتینر: $API_STATE)."
    fi
  fi

  # حالت nginx: HTTP یا HTTPS
  resolve_domain
  NGINX_STATE="$(docker inspect -f '{{.State.Status}}' lifttire_nginx 2>/dev/null || echo "missing")"
  if [ "$NGINX_STATE" != "running" ]; then
    echo ""
    error "کانتینر nginx در حال اجرا نیست (وضعیت: $NGINX_STATE)"
    echo "   docker compose logs --tail=40 nginx"
    echo "   docker compose up -d nginx"
    return 1
  fi
  HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1/healthz 2>/dev/null || true)"
  echo ""
  if [ -f "${LETSENCRYPT_DIR}/live/${DOMAIN}/fullchain.pem" ]; then
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

# پوشه‌های گواهی و ACME روی خودِ سرور (certbot نصبی اینجا کار می‌کند)
prepare_cert_dirs() {
  mkdir -p "$ACME_WEBROOT/.well-known/acme-challenge" 2>/dev/null || {
    warn "اجازهٔ ساخت $ACME_WEBROOT را ندارید — با sudo اجرا کنید."
  }
  mkdir -p "$LETSENCRYPT_DIR/live" 2>/dev/null || true
  chmod -R a+rX "$ACME_WEBROOT" 2>/dev/null || true
}

# بالا آوردن nginx با پیام خطای فارسی و تشخیص اشغال‌بودن پورت‌ها
# تشخیص کرش‌لوپ API و گفتن دلیل واقعی به فارسی
check_api_alive() {
  local state
  state="$(docker inspect -f '{{.State.Status}}' lifttire_api 2>/dev/null || echo missing)"
  if [ "$state" = "running" ] && docker inspect -f '{{.State.Health.Status}}' lifttire_api 2>/dev/null | grep -q healthy; then
    return 0
  fi
  if [ "$state" = "running" ]; then
    # تازه بالا آمده؛ چند ثانیه صبر کن
    for _ in $(seq 1 10); do
      sleep 2
      if [ "$(docker inspect -f '{{.State.Status}}' lifttire_api 2>/dev/null)" = "running" ] \
         && [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:${API_PORT:-4000}/api/health" 2>/dev/null)" = "200" ]; then
        return 0
      fi
    done
  fi

  error "API سالم نیست (وضعیت: $state) — دلیل واقعی:"
  echo "──────────────────────────────────────────────"
  $COMPOSE logs --tail=30 api 2>&1 | sed 's/^/  /'
  echo "──────────────────────────────────────────────"

  local logs
  logs="$($COMPOSE logs --tail=80 api 2>&1 || true)"

  if echo "$logs" | grep -qiE "password authentication failed|role .* does not exist"; then
    warn "دیتابیس رمز/کاربر را قبول نمی‌کند."
    echo "   علت رایج: volume قدیمی «lifttire_pgdata» با رمز قبلی ساخته شده است."
    echo "   راه‌حل سریع (داده دمو بازسازی می‌شود):"
    echo "      ./deploy.sh clean --yes --volumes && ./deploy.sh install"
    echo "   یا رمز فعلی volume را در .env بگذارید (فقط اگر آن را می‌دانید)."
  elif echo "$logs" | grep -qiE "EADDRINUSE|address already in use"; then
    warn "پورت ۴۰۰۰ از قبل اشغال است."
    echo "   ss -lntp | grep :4000"
  elif echo "$logs" | grep -qiE "ECONNREFUSED|getaddrinfo|ENOTFOUND"; then
    warn "API نمی‌تواند به دیتابیس/سرویس دیگر وصل شود."
    echo "   docker compose ps        # آیا lifttire_db سالم است؟"
    echo "   docker compose logs --tail=30 postgres"
  elif echo "$logs" | grep -qiE "Cannot find module|ERR_MODULE_NOT_FOUND"; then
    warn "ماژول لازم در ایمیج نیست — ایمیج را بدون کش بسازید:"
    echo "   docker compose build --no-cache api && docker compose up -d api"
  else
    warn "پیام خطای بالا را ببینید. لاگ کامل:  docker compose logs -f api"
  fi
  return 1
}

# چه سرویسی روی ۸۰/۴۴۳ است
start_nginx() {
  local args="${1:-}"
  # shellcheck disable=SC2086
  if ! $COMPOSE up -d $args nginx >/tmp/lifttire-nginx-up.log 2>&1; then
    error "بالا آوردن nginx ناموفق بود:"
    sed -n '1,20p' /tmp/lifttire-nginx-up.log || true
    if grep -qiE "port is already allocated|address already in use" /tmp/lifttire-nginx-up.log 2>/dev/null \
       || { command -v ss >/dev/null 2>&1 && ss -lntp 2>/dev/null | grep -qE ':(80|443)\s'; }; then
      warn "پورت ۸۰ یا ۴۴۳ توسط سرویس دیگری اشغال شده است."
      command -v ss >/dev/null 2>&1 && ss -lntp 2>/dev/null | grep -E ':(80|443)\s' || true
      echo "   اگر nginx یا apache روی خودِ سیستم نصب است:"
      echo "      systemctl disable --now nginx apache2"
      echo "   چه سرویسی پورت را گرفته:"
      echo "      sudo ss -lntp | grep -E ':80|:443'"
    fi
    warn "لاگ کامل:  docker compose logs --tail=50 nginx"
    return 1
  fi
  return 0
}

resolve_domain() {
  if [ -z "${DOMAIN:-}" ] && [ -f .env ]; then
    DOMAIN="$(grep -E '^DOMAIN=' .env | head -1 | cut -d= -f2 | tr -d '"'"'"' ')"
  fi
  export DOMAIN="${DOMAIN:-lift-tire.com}"

  # گواهی و مسیر ACME روی خودِ سرور (certbot نصبی)، نه داخل مخزن
  if [ -z "${LETSENCRYPT_DIR:-}" ] && [ -f .env ]; then
    LETSENCRYPT_DIR="$(grep -E '^LETSENCRYPT_DIR=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  fi
  if [ -z "${ACME_WEBROOT:-}" ] && [ -f .env ]; then
    ACME_WEBROOT="$(grep -E '^ACME_WEBROOT=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' ' || true)"
  fi
  export LETSENCRYPT_DIR="${LETSENCRYPT_DIR:-/etc/letsencrypt}"
  export ACME_WEBROOT="${ACME_WEBROOT:-/var/www/certbot}"
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
  resolve_domain
  prepare_cert_dirs
  render_nginx_conf
  if ! bash ./scripts/ssl-certbot.sh "${@:2}"; then
    error "گرفتن گواهی انجام نشد. سایت همچنان روی HTTP بالاست."
    exit 1
  fi
  case " ${*:2} " in
    *" --dry-run "*|*" --staging "*" --dry-run "*)
      info "تست انجام شد؛ برای صدور واقعی: sudo ./scripts/ssl-certbot.sh"
      return 0 ;;
  esac
  info "ری‌استارت nginx برای فعال‌سازی HTTPS…"
  start_nginx --force-recreate || warn "nginx بالا نیامد؛ لاگ را ببینید."
  sleep 2
  do_status
}

do_seed() {
  need_root_hint
  $COMPOSE exec -T api node src/seed.js "${2:-}"
}

do_ssl_check() {
  resolve_domain
  if [ -f "${LETSENCRYPT_DIR}/live/${DOMAIN}/fullchain.pem" ]; then
    info "گواهی SSL موجود است (${LETSENCRYPT_DIR}/live/${DOMAIN})."
    return 0
  fi
  warn "گواهی SSL یافت نشد — nginx در حالت HTTP کار می‌کند (سایت بالا است)."
  return 1
}

case "${1:-}" in
  up)      do_up ;;
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
  destroy) do_destroy "$@" ;;
  *)
    echo "استفاده: $0 {up|install|update|backup|restart|status|logs|seed|ssl|doctor|clean|destroy}"
    echo "  up       یک دستور: بیلد + دیتابیس + seed + nginx روی HTTP (بدون نیاز به SSL)"
    echo "  install  مثل up ولی با گزارش کامل‌تر نصب"
    echo "  update   دریافت کد جدید و بیلد مجدد با بکاپ خودکار"
    echo "  backup   بکاپ دیتابیس و تصاویر آپلودی"
    echo "  restart  ری‌استارت سرویس‌ها"
    echo "  status   وضعیت سرویس‌ها و سلامت API"
    echo "  logs     مشاهده لاگ‌ها (اختیاری: نام سرویس)"
    echo "  seed     اجرای داده دمو (اختیاری: --force)"
    echo "  ssl      گرفتن گواهی Let's Encrypt با certbot و سوییچ nginx به HTTPS"
    echo "  doctor   بررسی کامل سلامت نصب (Docker، DNS، SSL، کانتینرها، پاسخ‌ها)"
    echo "  clean    فقط کانتینرهای همین پروژه را حذف می‌کند"
    echo ""
    echo "  destroy  پاک‌سازی کامل هرچه ساخته شد: کانتینر، ایمیج، volume، گواهی، nginx، پوشهٔ پروژه"
    echo "             sudo ./deploy.sh destroy                       # با تأیید تایپی"
    echo "             sudo ./deploy.sh destroy --yes                 # بدون سؤال (همه‌چیز)"
    echo "             sudo ./deploy.sh destroy --keep-code           # کد و .env بماند"
    echo "             sudo ./deploy.sh destroy --yes --keep-code"
    exit 1
    ;;
esac
