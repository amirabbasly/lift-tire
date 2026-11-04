# 🚀 راهنمای کامل دیپلوی «لیفت تایر» روی سرور تازه Ubuntu 24.04

این راهنما از صفر تا آنلاین‌شدن سایت را پوشش می‌دهد؛ فرض بر این است که یک VPS تازه با **Ubuntu 24.04 LTS** خریده‌اید و دامنه `lifttire.com` را در اختیار دارید.

---

## ۰) چک‌لیست قبل از شروع

| مورد | مقدار لازم | توضیح |
| --- | --- | --- |
| IP سرور | مثلاً `185.x.x.x` | در پنل ارائه‌دهنده |
| دسترسی SSH | کاربر `root` یا کاربر sudo | رمز یا کلید SSH |
| دامنه | `lifttire.com` | قابل مدیریت DNS |
| رم سرور | حداقل ۲ گیگابایت | ۱ گیگ با swap هم کار می‌کند ولی بیلد کند است |

**رکوردهای DNS** (در پنل دامنه):

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | IP سرور | 300 |
| A | `www` | IP سرور | 300 |

بررسی انتشار DNS از سیستم خودتان:

```bash
dig +short lifttire.com
dig +short www.lifttire.com
```

> تا وقتی این دو دستور IP سرور را برنگردانند، مرحله SSL را انجام ندهید.

---

## ۱) اتصال به سرور

```bash
ssh root@IP_SERVER
```

اگر کاربر sudo دارید: `ssh youruser@IP_SERVER` و دستورهای زیر را با `sudo` اجرا کنید.

---

## ۲) بروزرسانی سیستم و نصب ابزارهای پایه

```bash
apt update && apt upgrade -y
apt install -y curl ca-certificates gnupg git ufw unzip htop nano cron rsync
```

| ابزار | چرا لازم است |
| --- | --- |
| `curl` | دانلود کلید و تست سلامت API |
| `git` | دریافت کد پروژه و بروزرسانی |
| `ufw` | فایروال ساده |
| `cron` | بکاپ خودکار و تمدید SSL |
| `htop` | پایش مصرف منابع |
| `nano` | ویرایش فایل‌ها |

---

## ۳) تنظیم منطقه زمانی و swap (برای سرورهای ۱ تا ۲ گیگ)

```bash
timedatectl set-timezone Asia/Tehran

# اگر رم سرور ۲ گیگ یا کمتر است، ۲ گیگ swap اضافه کنید
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

---

## ۴) نصب Docker Engine و Compose

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
> /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker
docker --version
docker compose version
```

> اگر با کاربر غیر root کار می‌کنید: `usermod -aG docker $USER && newgrp docker`

---

## ۵) فایروال

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose
```

> پورت‌های ۳۰۰۰ و ۴۰۰۰ در `docker-compose.yml` فقط روی `127.0.0.1` باز می‌شوند و از اینترنت در دسترس نیستند.

---

## ۶) دریافت کد پروژه

```bash
mkdir -p /var/www/lifttire.com
cd /var/www/lifttire.com
git clone <REPO_URL> .
```

مسیر استاندارد پروژه: **`/var/www/lifttire.com`**

---

## ۷) تنظیم متغیرهای محیطی

```bash
cd /var/www/lifttire.com
cp .env.example .env

# تولید JWT_SECRET و رمز دیتابیس
sed -i "s|CHANGE_ME_TO_A_LONG_RANDOM_SECRET|$(openssl rand -hex 32)|" .env
sed -i "s|CHANGE_ME_DB_PASSWORD|$(openssl rand -hex 16)|g" .env

nano .env
```

مقادیر مهم:

```env
DOMAIN=lifttire.com
NEXT_PUBLIC_SITE_URL=https://lifttire.com
JWT_SECRET=<رشته تصادفی ۶۴ کاراکتری>
POSTGRES_PASSWORD=<رمز قوی>
ADMIN_EMAIL=admin@lifttire.com
ADMIN_PASSWORD=<رمز دلخواه مدیر>
NEXT_PUBLIC_API_BASE=
API_INTERNAL_URL=http://api:4000
```

> 🔁 **تغییر دامنه:** اگر دامنه‌تان چیز دیگری است، `DOMAIN` و `NEXT_PUBLIC_SITE_URL` را عوض کنید؛ `deploy.sh` هنگام `install`/`restart` کانفیگ nginx را از قالب می‌سازد (`sed` روی `nginx/conf/lifttire.conf.template`).

> ⚠️ `ADMIN_PASSWORD` پیش‌فرض (`Lift@12345`) را حتماً عوض کنید — همان رمزی است که در `seed` ساخته می‌شود.

---

## ۸) گرفتن گواهی SSL

```bash
chmod +x deploy.sh scripts/ssl-certbot.sh
DOMAIN=lifttire.com EMAIL=you@example.com ./scripts/ssl-certbot.sh
```

خروجی موفق:

```
live/lifttire.com/fullchain.pem
live/lifttire.com/privkey.pem
```

---

## ۹) نصب و اجرا

```bash
./deploy.sh install
```

این اسکریپت به‌ترتیب انجام می‌دهد:

1. بیلد ایمیج‌های `api` و `web` (چندمرحله‌ای، خروجی standalone)
2. بالا آوردن PostgreSQL 16 و انتظار برای آماده‌شدن
3. اجرای API و اعمال `schema.sql` + داده دمو (۲۰ محصول، ۱۰ برند، ۳ بنر، ۳ مقاله، ۲ کوپن)
4. بالا آوردن Nginx با SSL
5. چاپ وضعیت سرویس‌ها

---

## ۱۰) بررسی نهایی

```bash
./deploy.sh status
curl -I https://lifttire.com
curl -s https://lifttire.com/api/health
curl -s https://lifttire.com/api/products?limit=1
```

انتظار می‌رود:

- `https://lifttire.com` → کد ۲۰۰ و صفحه فارسی
- `/api/health` → `{"status":"ok","db":"postgres",...}`
- پنل مدیریت: `https://lifttire.com/admin`
- `http://lifttire.com` و `https://www.lifttire.com` → ریدایرکت به `https://lifttire.com`

---

## ۱۱) بکاپ خودکار

```bash
mkdir -p backups
crontab -e
```

```cron
# بکاپ روزانه ۳ بامداد
0 3 * * * cd /var/www/lifttire.com && ./deploy.sh backup >> backups/cron.log 2>&1

# تمدید خودکار SSL (هر روز ۴ بامداد)
0 4 * * * cd /var/www/lifttire.com && docker run --rm -v $PWD/nginx/certbot/conf:/etc/letsencrypt -v $PWD/nginx/certbot/www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec -T nginx nginx -s reload
```

بکاپ‌ها در `backups/` ذخیره و ۱۴ نسخه آخر نگه داشته می‌شود. برای انتقال به فضای ابری:

```bash
# نمونه: کپی به سرور بکاپ
rsync -avz backups/ backup@other-server:/backups/lifttire/
```

---

## ۱۲) بروزرسانی سایت

```bash
cd /var/www/lifttire.com
./deploy.sh update
```

(بکاپ می‌گیرد → `git pull` → بیلد → ری‌استارت)

---

## ۱۳) لاگ و عیب‌یابی

```bash
./deploy.sh logs api        # لاگ API
./deploy.sh logs web        # لاگ Next.js
./deploy.sh logs nginx      # لاگ Nginx
docker compose ps
docker stats --no-stream
```

| نشانه | علت احتمالی | راه‌حل |
| --- | --- | --- |
| `502 Bad Gateway` | کانتینر web/api بالا نیست | `./deploy.sh logs web` و `restart` |
| nginx بالا نمی‌آید | نبود گواهی SSL | اجرای `scripts/ssl-certbot.sh` |
| صفحه سفید | `API_INTERNAL_URL` اشتباه | باید `http://api:4000` باشد |
| تصاویر آپلودی ۴۰۴ | volume مشترک mount نشده | `docker compose up -d` |
| `JWT_SECRET is required` | `.env` ناقص | مقداردهی و `restart` |
| کندی بیلد | رم کم | swap (مرحله ۳) |

---

## ۱۴) چک‌لیست امنیتی بعد از نصب

- [ ] رمز مدیر را از مقدار پیش‌فرض تغییر دادم (`/admin` → ورود → تنظیمات یا مستقیم در `.env` + seed)
- [ ] `JWT_SECRET` تصادفی و طولانی است
- [ ] رمز PostgreSQL تصادفی است و پورت ۵۴۳۲ از بیرون بسته است
- [ ] فقط پورت‌های ۲۲، ۸۰ و ۴۴۳ باز هستند (`ufw status`)
- [ ] ورود با کلید SSH و غیرفعال‌کردن ورود root با رمز (اختیاری)
- [ ] بکاپ روزانه فعال است و یک‌بار بازیابی را تست کرده‌ام
- [ ] `./deploy.sh backup` را در cron گذاشته‌ام
- [ ] نسخه Node/Next و پکیج‌ها را دوره‌ای بروزرسانی می‌کنم

---

## ۱۵) دستورهای پرکاربرد (خلاصه)

```bash
# وضعیت
cd /var/www/lifttire.com && ./deploy.sh status

# ری‌استارت
./deploy.sh restart

# بکاپ فوری
./deploy.sh backup

# بازسازی داده دمو (هشدار: داده‌های فعلی پاک می‌شوند)
./deploy.sh seed -- --force

# ورود به دیتابیس
docker compose exec postgres psql -U lifttire -d lifttire

# اجرای تست API روی سرور
docker compose exec api node test/api.test.js

# حجم دیسک
df -h && docker system df
```

---

## ۱۶) ابزارهایی که باید روی سرور داشته باشید — خلاصه

```bash
apt install -y curl ca-certificates gnupg git ufw unzip htop nano cron rsync
# + Docker Engine، Docker Compose Plugin (مرحله ۴)
```

چیز دیگری لازم نیست: PostgreSQL، Nginx، Node و Next همه داخل کانتینرها اجرا می‌شوند.

---

**پس از پایان:** آدرس سایت، پنل ادمین و حساب‌های ورود را با تیم خود به اشتراک بگذارید و اولین بکاپ را دانلود کنید.

```text
🌐 https://lifttire.com
🔐 https://lifttire.com/admin
📧 admin@lifttire.com  /  <ADMIN_PASSWORD>
```
