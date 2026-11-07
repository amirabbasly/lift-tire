/**
 * ═══════════════════════════════════════════════════════════════
 *  Lift Tire — لیفت تایر  |  PM2 ecosystem
 *  api  = Express (بک‌اند)      → 127.0.0.1:4000
 *  web  = Next.js standalone    → 127.0.0.1:3000
 *  هر دو در برابر nginx روی ۸۰/۴۴۳ قرار می‌گیرند.
 *
 *  استفاده:
 *    pm2 start ecosystem.config.cjs
 *    pm2 logs lifttire-api
 *  یا ساده‌تر: sudo ./scripts/deploy-pm2.sh install
 * ═══════════════════════════════════════════════════════════════
 */
const path = require('node:path');
const fs = require('node:fs');

const ROOT = __dirname;
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const LOGS = path.join(ROOT, 'logs');

try { fs.mkdirSync(LOGS, { recursive: true }); } catch { /* ignore */ }

/**
 * .env را بدون وابستگی به dotenv می‌خوانیم و مقادیر را صریح به PM2 می‌دهیم.
 * (روی سرور تازه هیچ فایل دیگری جز .env وجود ندارد؛ این کار قطعی و قابل پیش‌بینی است.)
 */
function readEnvFile(file) {
  const out = {};
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return out; }
  for (let line of raw.split('\n')) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7);
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    // حذف کوتیشن‌های ابتدا/انتها
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    } else {
      // حذف کامنت انتهای خط (فقط وقتی فاصله قبلش باشد)
      const hash = val.indexOf(' #');
      if (hash !== -1) val = val.slice(0, hash).trim();
    }
    out[key] = val;
  }
  return out;
}

// اولویت: .env ریشه پروژه (منبع حقیقت استقرار) > .env داخل backend
const FILE_ENV = {
  ...readEnvFile(path.join(BACKEND, '.env')),
  ...readEnvFile(path.join(ROOT, '.env')),
};

const DOMAIN = FILE_ENV.DOMAIN || 'lift-tire.com';
const API_PORT = FILE_ENV.API_PORT || '4000';
const WEB_PORT = FILE_ENV.WEB_PORT || '3000';
/**
 * آدرس شنود (bind):
 *   • روی سرور واقعی: 127.0.0.1 — فقط nginx به آن دسترسی دارد (امن)
 *   • در محیط پیش‌نمایش/سندباکس: 0.0.0.0 لازم است تا پروکسی بتواند وصل شود
 * با BIND_HOST در .env قابل تغییر است.
 */
const BIND_HOST = FILE_ENV.BIND_HOST || '127.0.0.1';

/** مسیرهای .env ممکن است برای داکر نوشته شده باشند (/app/...) — اینجا برای PM2 اصلاح می‌شوند */
function fixPath(p, fallback) {
  if (!p) return fallback;
  // مسیرهای مخصوص کانتینر
  if (p.startsWith('/app/')) return path.join(BACKEND, p.slice('/app/'.length));
  if (p.startsWith('.')) return path.resolve(ROOT, p);
  return p;
}

/**
 * انتخاب دیتابیس — امن‌سازی مهم:
 * اگر .env اصلاً USE_PGLITE نداشت یا DATABASE_URL خالی/غیرقابل‌استفاده بود،
 * به PGlite برمی‌گردیم تا API هرگز کرش‌لوپ نشود (خطای رایج «postgres:5432» روی سرور بدون Postgres).
 */
const RAW_USE_PGLITE = String(FILE_ENV.USE_PGLITE ?? '').toLowerCase();
const DB_URL = (FILE_ENV.DATABASE_URL || '').trim().replace('@postgres:', '@127.0.0.1:');
const DB_USABLE = /^postgres(ql)?:\/\/.+@.+:\d+\//.test(DB_URL);

let USE_PGLITE;
if (RAW_USE_PGLITE === 'true') USE_PGLITE = true;
else if (RAW_USE_PGLITE === 'false') USE_PGLITE = DB_USABLE ? false : true; // صریحاً pg خواسته ولی آدرس ناقص است
else USE_PGLITE = !DB_USABLE; // تعیین‌نشده → اگر آدرس سالم نبود PGlite

const UPLOAD_PATH = fixPath(FILE_ENV.UPLOAD_DIR, path.join(BACKEND, 'uploads'));
const PG_PATH = fixPath(FILE_ENV.PGDATA, path.join(BACKEND, 'data', 'pglite'));

const common = {
  watch: false,
  autorestart: true,
  max_restarts: 20,
  min_uptime: '10s',
  restart_delay: 1000,
  kill_timeout: 8000,
  merge_logs: true,
  time: true,
  instances: 1,
  exec_mode: 'fork',
  env: {
    NODE_ENV: 'production',
    TZ: 'Asia/Tehran',
    ...FILE_ENV,
  },
};

module.exports = {
  apps: [
    {
      ...common,
      name: 'lifttire-api',
      cwd: BACKEND,
      script: 'src/server.js',
      node_args: '--enable-source-maps',
      out_file: path.join(LOGS, 'api-out.log'),
      error_file: path.join(LOGS, 'api-error.log'),
      env: {
        ...common.env,
        PORT: String(API_PORT),
        HOST: BIND_HOST, // پیش‌فرض 127.0.0.1 (nginx روی همان سرور)
        UPLOAD_DIR: UPLOAD_PATH,
        PGDATA: PG_PATH,
        USE_PGLITE: USE_PGLITE ? 'true' : 'false',
        // در PM2 دیتابیس روی همان ماشین است
        DATABASE_URL: DB_URL,
      },
    },
    {
      ...common,
      name: 'lifttire-web',
      cwd: path.join(FRONTEND, '.next', 'standalone'),
      script: 'server.js',
      out_file: path.join(LOGS, 'web-out.log'),
      error_file: path.join(LOGS, 'web-error.log'),
      env: {
        ...common.env,
        PORT: String(WEB_PORT),
        HOSTNAME: BIND_HOST,
        // در PM2، API روی همان هاست اجرا می‌شود (نه داخل شبکه داکر)
        API_INTERNAL_URL: `http://127.0.0.1:${API_PORT}`,
        NEXT_PUBLIC_API_BASE: '',
        NEXT_PUBLIC_SITE_URL: FILE_ENV.NEXT_PUBLIC_SITE_URL || `https://${DOMAIN}`,
      },
    },
  ],
};
