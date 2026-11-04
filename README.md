<div align="center">

# 🛞 لیفت تایر — Lift Tire

**لاستیک اصل، ایمنی واقعی**
`LIFT TIRE — GRIP THE ROAD`

فروشگاه اینترنتی کامل لاستیک خودرو — Next.js 15 + Express + PostgreSQL

</div>

---

> 📘 **راهنمای گام‌به‌گام نصب روی سرور تازه Ubuntu 24.04:** [`docs/DEPLOY-ubuntu.md`](docs/DEPLOY-ubuntu.md)

## فهرست

1. [معرفی و امکانات](#معرفی-و-امکانات)
2. [استک فنی](#استک-فنی)
3. [ساختار پروژه](#ساختار-پروژه)
4. [پیش‌نیازها](#پیشنیازها)
5. [اجرای لوکال (توسعه)](#اجرای-لوکال-توسعه)
6. [بیلد پروداکشن و اجرای standalone](#بیلد-پروداکشن-و-اجرای-standalone)
7. [متغیرهای محیطی](#متغیرهای-محیطی)
8. [دیپلوی روی سرور Ubuntu 24.04](#دیپلوی-روی-سرور-ubuntu-2404)
9. [SSL و دامنه](#ssl-و-دامنه)
10. [بکاپ و بازیابی](#بکاپ-و-بازیابی)
11. [خلاصه API](#خلاصه-api)
12. [حساب‌های نمایشی](#حسابهای-نمایشی)
13. [عیب‌یابی](#عیبیابی)

---

## معرفی و امکانات

لیفت تایر یک فروشگاه اینترنتی تخصصی لاستیک خودرو است؛ کاملاً فارسی و راست‌به‌چپ، با طراحی صنعتی/اسپرت و داده دموی واقعی‌نما.

**فروشگاه (Frontend)**

- هیرو اسلایدر انیمیشن‌دار با افکت Ken Burns، لاستیک چرخان با پارالاکس، شمارنده‌های عددی و نوار پیشرفت
- مارکی بی‌نهایت برندها + ویجت «سایز لاستیک خودت را پیدا کن»
- کاروسل پیشنهاد لحظه‌ای با شمارش معکوس، تب‌های پرفروش‌ترین/جدیدترین، بنرهای دسته‌بندی
- لیست محصولات با فیلتر دسته/برند/سایز/فصل/قیمت/موجودی/تخفیف، مرتب‌سازی، صفحه‌بندی و حالت گرید/لیست
- صفحه محصول: گالری با زوم، انتخاب تعداد، مشخصات کامل لاستیک، تب‌ها، نظرات، محصولات مرتبط
- سبد خرید (localStorage + سینک با سرور)، کد تخفیف، تسویه چندمرحله‌ای، درگاه شبیه‌سازی‌شده
- صفحه سفارش با تایم‌لاین وضعیت، پیگیری با کد سفارش + موبایل
- حساب کاربری (سفارش‌ها، آدرس‌ها، علاقه‌مندی‌ها، تغییر رمز)
- مجله (۳ مقاله)، درباره ما، تماس، سوالات متداول، صفحه ۴۰۴ اختصاصی
- منوی موبایل با آیکون‌های تصویری + BottomNav + تب عمودی پشتیبانی

**پنل مدیریت (`/admin`)**

- داشبورد آماری با نمودار فروش ۱۴ روز، پرفروش‌ها، هشدار موجودی
- CRUD کامل محصولات (با آپلود چند تصویر و مشخصات لاستیک)، دسته‌بندی‌ها، برندها، بنرها، مقالات، کدهای تخفیف
- سفارش‌ها با فیلتر وضعیت، تغییر وضعیت و کد رهگیری
- تأیید/رد نظرات، خبرنامه، پیام‌های تماس، تنظیمات سایت

**بک‌اند**

- Express 4 (ESM) + JWT با نقش `admin` / `customer` + bcrypt
- PostgreSQL 16 در پروداکشن و **PGlite** در توسعه/تست (بدون نیاز به نصب دیتابیس)
- آپلود تصویر با multer (jpg/png/webp، حداکثر ۵ مگابایت) در `/uploads`
- پاسخ خطای یکدست: `{ error: "پیام فارسی" }`

---

## استک فنی

| لایه | تکنولوژی |
| --- | --- |
| Frontend | Next.js 15 (App Router، JavaScript)، Tailwind CSS 3، framer-motion |
| Backend | Node.js 22، Express 4 (ESM)، JWT، bcryptjs، multer |
| Database | PostgreSQL 16 (پروداکشن) / PGlite (توسعه) |
| Fonts | Vazirmatn + Barlow Condensed — **لوکال** با `next/font/local` |
| Deploy | Docker Compose + Nginx + Let's Encrypt |

---

## ساختار پروژه

```
lift-tire/
├── backend/
│   ├── src/
│   │   ├── server.js          # نقطه ورود API
│   │   ├── db.js              # لایه دیتابیس (Postgres / PGlite)
│   │   ├── schema.sql         # اسکیمای ایدمپوتنت
│   │   ├── seed.js            # داده دمو
│   │   ├── auth.js            # JWT + bcrypt + middleware
│   │   ├── helpers.js
│   │   ├── payments.js        # درگاه شبیه‌سازی‌شده (HMAC)
│   │   └── routes/{public,admin,customer}.js
│   ├── test/api.test.js       # تست دودی API
│   ├── uploads/               # تصاویر آپلودی
│   └── Dockerfile
├── frontend/
│   ├── app/(site)/…           # صفحات فروشگاه
│   ├── app/admin/(dash)/…     # پنل مدیریت
│   ├── app/fonts/             # فونت‌های لوکال
│   ├── components/…           # کامپوننت‌های UI
│   ├── lib/{api,adminApi,format,constants,demo}.js
│   ├── public/images/…        # تصاویر تولیدشده
│   └── Dockerfile             # چندمرحله‌ای (standalone)
├── nginx/conf/lifttire.conf   # reverse proxy + gzip + کش
├── scripts/{ssl-certbot.sh, dump-demo.mjs, make-*.py}
├── docker-compose.yml
├── deploy.sh
├── .env.example
└── README.md
```

---

## پیش‌نیازها

**برای توسعه لوکال**

| ابزار | نسخه پیشنهادی | بررسی |
| --- | --- | --- |
| Node.js | 22 LTS | `node -v` |
| npm | 10+ | `npm -v` |
| Git | 2.4+ | `git --version` |

> برای توسعه به PostgreSQL نیاز ندارید؛ بک‌اند به‌صورت پیش‌فرض روی **PGlite** (Postgres داخل Node) اجرا می‌شود.

**برای پروداکشن**

- Ubuntu 22.04/24.04، ۲ گیگ رم یا بیشتر
- Docker Engine 26+ و Docker Compose v2
- دامنه با رکورد `A` به IP سرور

---

## اجرای لوکال (توسعه)

### ۱) کلون پروژه

```bash
git clone <REPO_URL> lift-tire
cd lift-tire
```

### ۲) بک‌اند (API روی پورت ۴۰۰۰)

```bash
cd backend
npm install

# فایل محیطی توسعه
cat > .env <<'ENV'
PORT=4000
USE_PGLITE=true
PGDATA=./data/pglite
JWT_SECRET=dev-secret-change-me
ADMIN_EMAIL=admin@lifttire.ir
ADMIN_PASSWORD=Lift@12345
UPLOAD_DIR=./uploads
ENV

npm run seed     # ساخت اسکیما + داده دمو (۲۰ محصول، ۱۰ برند، ۳ بنر، ۳ مقاله)
npm run dev      # یا: npm start
```

بررسی سلامت: `curl http://localhost:4000/api/health`

### ۳) فرانت‌اند (روی پورت ۳۰۰۰)

در ترمینال دوم:

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

> فرانت‌اند درخواست‌های `/api` و `/uploads` را با rewrite نکست به `API_INTERNAL_URL` (پیش‌فرض `http://127.0.0.1:4000`) پروکسی می‌کند؛ بنابراین CORS و آدرس مطلق لازم نیست.

### ۴) آدرس‌ها

| بخش | آدرس |
| --- | --- |
| فروشگاه | http://localhost:3000 |
| پنل مدیریت | http://localhost:3000/admin |
| API | http://localhost:4000/api |
| سلامت | http://localhost:4000/api/health |

### ۵) بازسازی داده دمو

```bash
cd backend && npm run seed -- --force
```

### ۶) تست API

```bash
cd backend && npm run test:api
```

---

## بیلد پروداکشن و اجرای standalone

```bash
cd frontend
npm run build          # خروجی: .next/standalone
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cd .next/standalone
NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

بک‌اند پروداکشن:

```bash
cd backend
NODE_ENV=production USE_PGLITE=false \
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/lifttire \
JWT_SECRET=$(openssl rand -hex 32) node src/server.js
```

---

## متغیرهای محیطی

| متغیر | پیش‌فرض | توضیح |
| --- | --- | --- |
| `DATABASE_URL` | — | رشته اتصال PostgreSQL؛ اگر خالی باشد PGlite فعال می‌شود |
| `USE_PGLITE` | `true` در توسعه | `false` برای PostgreSQL |
| `PGDATA` | `./data/pglite` | محل ذخیره PGlite |
| `JWT_SECRET` | — | **الزامی در پروداکشن** (حداقل ۳۲ کاراکتر) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@lifttire.ir` / `Lift@12345` | حساب مدیر اولیه (seed) |
| `UPLOAD_DIR` | `./uploads` | مسیر ذخیره تصاویر آپلودی |
| `NEXT_PUBLIC_API_BASE` | خالی | آدرس API در سمت مرورگر؛ خالی = هم‌مبدأ |
| `API_INTERNAL_URL` | `http://127.0.0.1:4000` | آدرس داخلی API برای رندر سمت سرور |
| `PORT` | `4000` | پورت API |

---

## دیپلوی روی سرور Ubuntu 24.04

### ⚙️ آماده‌سازی سرور (فقط یک‌بار)

**۱. بروزرسانی سیستم و ابزارهای پایه**

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl ca-certificates gnupg git ufw unzip htop
```

**۲. نصب Docker Engine و Compose Plugin (روش رسمی)**

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER && newgrp docker

docker --version && docker compose version
```

**۳. فایروال**

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

> پورت‌های ۳۰۰۰ و ۴۰۰۰ در `docker-compose.yml` فقط به `127.0.0.1` بایند شده‌اند و از بیرون در دسترس نیستند؛ ترافیک از Nginx عبور می‌کند.

**۴. تنظیم DNS دامنه**

در پنل دامنه، دو رکورد بسازید و منتظر انتشار بمانید (`dig lifttire.ir +short`):

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | IP سرور |
| A | `www` | IP سرور |

### 🚀 نصب پروژه

```bash
sudo mkdir -p /var/www/lifttire.ir
sudo chown -R $USER:$USER /var/www/lifttire.ir
cd /var/www/lifttire.ir

git clone <REPO_URL> .
cp .env.example .env

# تولید رمزها
sed -i "s|CHANGE_ME_TO_A_LONG_RANDOM_SECRET|$(openssl rand -hex 32)|" .env
sed -i "s|CHANGE_ME_DB_PASSWORD|$(openssl rand -hex 16)|g" .env
nano .env   # مقادیر ADMIN_PASSWORD و ... را بررسی کنید
```

**گرفتن گواهی SSL (قبل از بالا آوردن nginx):**

```bash
chmod +x scripts/ssl-certbot.sh deploy.sh
DOMAIN=lifttire.ir EMAIL=you@example.com ./scripts/ssl-certbot.sh
```

**نصب کامل:**

```bash
./deploy.sh install
```

این دستور: ایمیج‌ها را بیلد می‌کند، PostgreSQL را بالا می‌آورد، اسکیما و داده دمو را اعمال می‌کند، API و وب و Nginx را اجرا می‌کند.

**بررسی:**

```bash
./deploy.sh status
curl -I https://lifttire.ir
curl -s https://lifttire.ir/api/health
```

### 🔄 بروزرسانی

```bash
cd /var/www/lifttire.ir
./deploy.sh update     # بکاپ خودکار → git pull → بیلد → ری‌استارت
```

### 📜 دستورهای دیگر

```bash
./deploy.sh backup     # بکاپ دیتابیس + آپلودها
./deploy.sh restart
./deploy.sh logs api   # لاگ یک سرویس
./deploy.sh seed --force
```

---

## SSL و دامنه

- گواهی با `scripts/ssl-certbot.sh` (Let's Encrypt، حالت standalone) گرفته می‌شود.
- مسیر گواهی در کانتینر: `/etc/letsencrypt/live/lifttire.ir/` (روی هاست: `nginx/certbot/conf/…`).
- **تمدید خودکار** را با cron اضافه کنید:

```bash
sudo crontab -e
```

```cron
0 3 * * * cd /var/www/lifttire.ir && docker run --rm -v $PWD/nginx/certbot/conf:/etc/letsencrypt -v $PWD/nginx/certbot/www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec -T nginx nginx -s reload
```

---

## بکاپ و بازیابی

**بکاپ دستی**

```bash
./deploy.sh backup
# backups/lifttire-20250101-030000.sql.gz
# backups/uploads-20250101-030000.tar.gz
```

**بکاپ زمان‌بندی‌شده (روزانه ۳ بامداد)**

```cron
0 3 * * * cd /var/www/lifttire.ir && ./deploy.sh backup >> backups/cron.log 2>&1
```

**بازیابی دیتابیس**

```bash
gunzip -c backups/lifttire-YYYYMMDD-HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U lifttire -d lifttire
```

**بازیابی آپلودها**

```bash
docker run --rm -v lifttire_uploads:/data -v $PWD/backups:/backup alpine \
  sh -c "cd /data && tar xzf /backup/uploads-YYYYMMDD-HHMMSS.tar.gz"
```

---

## خلاصه API

**عمومی (`/api`)**

```
GET  /health
GET  /settings | /categories | /categories/:slug | /brands | /banners | /posts | /posts/:slug
GET  /products?category=&brand=&width=&ratio=&rim=&season=&min_price=&max_price=&in_stock=&on_sale=&q=&sort=&page=&limit=
GET  /products/:slug
GET  /home
POST /coupons/validate        { code, subtotal, shipping }
GET  /shipping-options
POST /orders                  { items, customer_name, phone, address, shipping_method, payment_method, coupon_code }
GET  /orders/track?code=&phone=
GET  /orders/:code
POST /payments/verify         { token, order }
GET  /reviews?product_id=  |  POST /reviews
POST /newsletter | /contact
```

**مشتری (`/api/customer`)**

```
POST /register | /login
GET  /me | /orders | /addresses | /wishlist | /cart
PUT  /me | /password | /cart        POST /addresses   PUT|DELETE /addresses/:id   POST /wishlist
```

**مدیر (`/api/admin`)**

```
POST /login            GET /me | /dashboard
CRUD:  /products  /categories  /brands  /banners  /posts  /coupons
GET/PATCH/DELETE: /orders/:id  /reviews  /messages
GET /subscribers | /customers | /settings      PUT /settings
POST /upload (multipart: files[])
```

---

## حساب‌های نمایشی

| نقش | ورود | رمز |
| --- | --- | --- |
| مدیر | `admin@lifttire.ir` | `Lift@12345` |
| مشتری | `09121234567` | `test1234` |

کدهای تخفیف دمو: **`LIFT10`** (۱۰٪ تا سقف ۱٬۵۰۰٬۰۰۰ تومان) و **`FREESHIP`** (فقط هزینه ارسال).

---

## عیب‌یابی

| مشکل | راه‌حل |
| --- | --- |
| `JWT_SECRET is required` | در `.env` مقدار JWT_SECRET تنظیم نشده است |
| تصاویر آپلودی ۴۰۴ می‌دهند | volume `uploads` بین `api` و `nginx` مشترک است؛ `docker compose up -d` را دوباره اجرا کنید |
| nginx بالا نمی‌آید | گواهی SSL وجود ندارد → `./scripts/ssl-certbot.sh` |
| صفحه سفید در فرانت | `API_INTERNAL_URL` باید از داخل کانتینر `web` قابل دسترس باشد (`http://api:4000`) |
| خطای دیتابیس در پروداکشن | `USE_PGLITE=false` و `DATABASE_URL` را بررسی کنید |
| پورت ۸۰ اشغال است | `sudo ss -lptn 'sport = :80'` و سرویس متضاد (مثلاً apache) را متوقف کنید |
| seed تکراری اجرا نمی‌شود | `./deploy.sh seed -- --force` |

---

<div align="center">

**لیفت تایر** — لاستیک اصل، ایمنی واقعی
ساخته‌شده با ❤️ برای رانندگان ایرانی

</div>
