# 🚀 راهنمای کامل دیپلوی «لیفت تایر» روی سرور تازه Ubuntu 24.04

این راهنما از صفر تا آنلاین‌شدن سایت را پوشش می‌دهد؛ فرض بر این است که یک VPS تازه با **Ubuntu 24.04 LTS** خریده‌اید و دامنه `lift-tire.com` را در اختیار دارید.

---

## ۰) چک‌لیست قبل از شروع

| مورد | مقدار لازم | توضیح |
| --- | --- | --- |
| IP سرور | مثلاً `185.x.x.x` | در پنل ارائه‌دهنده |
| دسترسی SSH | کاربر `root` یا کاربر sudo | رمز یا کلید SSH |
| دامنه | `lift-tire.com` | قابل مدیریت DNS |
| رم سرور | حداقل ۲ گیگابایت | ۱ گیگ با swap هم کار می‌کند ولی بیلد کند است |

**رکوردهای DNS** (در پنل دامنه):

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | IP سرور | 300 |
| A | `www` | IP سرور | 300 |

بررسی انتشار DNS از سیستم خودتان:

```bash
dig +short lift-tire.com
dig +short www.lift-tire.com
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
mkdir -p /var/www/lift-tire.com
cd /var/www/lift-tire.com
git clone <REPO_URL> .
```

مسیر استاندارد پروژه: **`/var/www/lift-tire.com`**

---

## ۷) تنظیم متغیرهای محیطی

```bash
cd /var/www/lift-tire.com
cp .env.example .env

# تولید JWT_SECRET و رمز دیتابیس
sed -i "s|CHANGE_ME_TO_A_LONG_RANDOM_SECRET|$(openssl rand -hex 32)|" .env
sed -i "s|CHANGE_ME_DB_PASSWORD|$(openssl rand -hex 16)|g" .env

nano .env
```

مقادیر مهم:

```env
DOMAIN=lift-tire.com
NEXT_PUBLIC_SITE_URL=https://lift-tire.com
JWT_SECRET=<رشته تصادفی ۶۴ کاراکتری>
POSTGRES_PASSWORD=<رمز قوی>
ADMIN_EMAIL=admin@lift-tire.com
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
DOMAIN=lift-tire.com EMAIL=you@example.com ./scripts/ssl-certbot.sh
```

خروجی موفق:

```
live/lift-tire.com/fullchain.pem
live/lift-tire.com/privkey.pem
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
curl -I https://lift-tire.com
curl -s https://lift-tire.com/api/health
curl -s https://lift-tire.com/api/products?limit=1
```

انتظار می‌رود:

- `https://lift-tire.com` → کد ۲۰۰ و صفحه فارسی
- `/api/health` → `{"status":"ok","db":"postgres",...}`
- پنل مدیریت: `https://lift-tire.com/admin`
- `http://lift-tire.com` و `https://www.lift-tire.com` → ریدایرکت به `https://lift-tire.com`

---

## ۱۱) بکاپ خودکار

```bash
mkdir -p backups
crontab -e
```

```cron
# بکاپ روزانه ۳ بامداد
0 3 * * * cd /var/www/lift-tire.com && ./deploy.sh backup >> backups/cron.log 2>&1

# تمدید خودکار SSL (هر روز ۴ بامداد)
0 4 * * * cd /var/www/lift-tire.com && docker run --rm -v $PWD/nginx/certbot/conf:/etc/letsencrypt -v $PWD/nginx/certbot/www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec -T nginx nginx -s reload
```

بکاپ‌ها در `backups/` ذخیره و ۱۴ نسخه آخر نگه داشته می‌شود. برای انتقال به فضای ابری:

```bash
# نمونه: کپی به سرور بکاپ
rsync -avz backups/ backup@other-server:/backups/lifttire/
```

---

## ۱۲) بروزرسانی سایت

```bash
cd /var/www/lift-tire.com
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
cd /var/www/lift-tire.com && ./deploy.sh status

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
🌐 https://lift-tire.com
🔐 https://lift-tire.com/admin
📧 admin@lift-tire.com  /  <ADMIN_PASSWORD>
```

---

## ۱۹) عیب‌یابی SSL و «nginx در حال ری‌استارت»

اگر در `./deploy.sh install` این پیام را دیدید:

```
⚠ گواهی SSL یافت نشد — nginx تا زمان اجرای scripts/ssl-certbot.sh بالا نمی‌آید.
lifttire_nginx ... Restarting (1)
```

یعنی `nginx` دارد بالا می‌آید و چون فایل گواهی وجود ندارد، کرش می‌کند و دوباره تلاش می‌کند. **این طبیعی است**؛ تا گرفتن گواهی ادامه دارد. برای متوقف‌کردن حلقه:

```bash
cd /var/www/lift-tire.com/lift-tire
docker compose stop nginx
```

### چرا certbot شکست می‌خورد؟

خروجی certbot دقیقاً می‌گوید کدام دامنه مشکل دارد:

| پیام | معنی | راه‌حل |
| --- | --- | --- |
| `Timeout during connect` | پورت ۸۰ از بیرون بسته است یا IP اشتباه است | باز کردن ۸۰/۴۴۳ در ufw **و در فایروال پنل ارائه‌دهنده** |
| `Invalid response ... 404` با یک IP دیگر | رکورد A به سرور دیگری اشاره می‌کند | اصلاح رکورد A در پنل DNS |
| `unauthorized` برای دامنه اصلی ولی www سالم | معمولاً A یا AAAA دامنه اصلی اشتباه است | حذف AAAA/CNAME اشتباه، ست‌کردن A درست |

بررسی سریع:

```bash
curl -4 -s https://api.ipify.org; echo          # IP واقعی این سرور
getent ahostsv4 lift-tire.com                     # دامنه اصلی به کجا می‌رود؟
getent ahostsv4 www.lift-tire.com                 # www به کجا می‌رود؟
ss -lntp | grep ':80'                            # چه چیزی پورت ۸۰ را گرفته؟
ufw status
```

رکوردهای لازم:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | IP سرور |
| A | `www` | IP سرور |
| AAAA | `@` / `www` | ❌ حذف شود (اگر به این سرور اشاره نمی‌کند) |
| CNAME | `www` | ❌ حذف شود |

### گرفتن گواهی (نسخهٔ مقاوم اسکریپت)

از نسخهٔ جدید `scripts/ssl-certbot.sh` استفاده کنید؛ اول DNS را چک می‌کند، بعد یک nginx موقت روی پورت ۸۰ بالا می‌آورد و با روش **webroot** گواهی می‌گیرد (بدون درگیرشدن با پورت اشغال‌شده):

```bash
./scripts/ssl-certbot.sh --dry-run     # تست بدون مصرف سهمیه
./scripts/ssl-certbot.sh               # دریافت واقعی
./deploy.sh restart                    # بالا آمدن nginx با HTTPS
```

### اگر پشت Cloudflare هستید

مؤقتاً رکورد را روی **DNS only** (ابر خاکستری) بگذارید تا certbot کار کند؛ بعد از گرفتن گواهی می‌توانید Proxy را روشن کنید (حالت Full/Strict).

### تمدید خودکار

```cron
0 4 * * * cd /var/www/lift-tire.com/lift-tire && docker run --rm -v $PWD/nginx/certbot/conf:/etc/letsencrypt -v $PWD/nginx/certbot/www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose exec -T nginx nginx -s reload
```

> اگر مخزن را داخل `/var/www/lift-tire.com/lift-tire` کلون کرده‌اید، مسیرها در cron و بکاپ باید همان مسیر باشند.

---

## ۲۰) دامنهٔ پشت Cloudflare — روش درست SSL

اگر `getent ahostsv4 lift-tire.com` چیزی شبیه `104.21.x.x` یا `172.67.x.x` برگرداند، یعنی رکوردها **Proxied (ابر نارنجی)** هستند و ترافیک از Cloudflare می‌گذرد. در این حالت `certbot` نمی‌تواند چالش HTTP-01 را از سرور شما بخواند (چون درخواست به Cloudflare می‌رسد).

### راه ۱ (پیشنهادی) — Cloudflare Origin Certificate

رایگان، ۱۵ ساله، بدون تمدید و بدون cron:

1. پنل Cloudflare → **SSL/TLS → Origin Server → Create Certificate**
   - Hostnames: `lift-tire.com` و `*.lift-tire.com`
   - Validity: **15 years**
2. محتوای دو فایل را روی سرور ذخیره کنید (`/root/origin-cert.pem` و `/root/origin-key.pem`).
3. نصب روی nginx:

```bash
cd /var/www/lift-tire.com/lift-tire     # مسیر مخزن شما
./scripts/install-origin-cert.sh /root/origin-cert.pem /root/origin-key.pem
```

4. پنل Cloudflare → **SSL/TLS → Overview → Full (strict)**
5. **SSL/TLS → Edge Certificates → Always Use HTTPS: On**
6. رکوردهای DNS: `A @` و `A www` باید به **IP همین سرور** اشاره کنند (پروکسی می‌تواند روشن بماند).

بررسی:

```bash
curl -I https://lift-tire.com
docker compose ps
```

### راه ۲ — خاموش‌کردن موقت پروکسی و گرفتن گواهی Let's Encrypt

1. Cloudflare → **DNS** → برای `@` و `www` گزینهٔ **Proxy status = DNS only** (ابر خاکستری)
2. مقدار رکورد A = IP سرور (`curl -4 -s https://api.ipify.org`)
3. `./scripts/ssl-certbot.sh` (اسکریپت خودش DNS را چک می‌کند)
4. بعد از موفقیت، پروکسی را دوباره روشن کنید و SSL mode را **Full (strict)** بگذارید.

> با پروکسی روشن، تمدید خودکار هم باید از راه **webroot** انجام شود (نه standalone) — دستور cron بخش ۱۱ همین است.

### اشتباه‌های رایج

| نشانه | علت | راه‌حل |
| --- | --- | --- |
| `ERR_TOO_MANY_REDIRECTS` | SSL mode روی **Flexible** و ریدایرکت HTTPS در nginx | حالت را Full (strict) کنید |
| `502 Bad Gateway` | Cloudflare به origin می‌رسد ولی کانتینر web/api خاموش است | `docker compose ps` و `./deploy.sh logs web` |
| گواهی معتبر ولی سایت بالا نمی‌آید | nginx بدون گواهی بالا نیامده | `./deploy.sh restart` بعد از نصب Origin cert |
| خطای ۵۲۶ / ۵۲۵ | SSL mode Full ولی گواهی روی سرور نصب نیست | Origin cert را نصب کنید |

### پورت‌ها

Cloudflare در حالت Proxy فقط پورت‌های ۸۰ و ۴۴۳ (و چند پورت خاص) را فوروارد می‌کند؛ لازم نیست پورت ۳۰۰۰ یا ۴۰۰۰ را به اینترنت باز کنید — همان `127.0.0.1` در compose درست است.

### اگر خطای 521 یا 522 گرفتید

| کد | معنی | علت در این پروژه |
| --- | --- | --- |
| **521** | Cloudflare به origin وصل نمی‌شود | `nginx` بالا نیست (چون گواهی نصب نشده) یا پورت ۴۴۳/۸۰ بسته است |
| **522** | تایم‌اوت اتصال به origin | فایروال سرور یا پنل ارائه‌دهنده پورت‌ها را بسته |
| **526** | گواهی origin نامعتبر | gواهی Origin نصب نشده/منقضی است |

سریع‌ترین راه دیدن وضعیت:

```bash
docker compose ps
curl -I http://127.0.0.1          # از داخل سرور (بدون Cloudflare)
ss -lntp | grep -E ':80|:443'
```

اگر `nginx` خاموش است، یعنی گواهی نصب نشده. دو انتخاب دارید:

**الف) نصب Origin Certificate (امن، پیشنهادی)** → بخش بالا.

**ب) راه‌اندازی فوری با حالت Flexible:**

```bash
./scripts/cf-flexible.sh enable
# در Cloudflare: SSL/TLS → Overview → Flexible
curl -I https://lift-tire.com     # باید 200 بدهد
```

`cf-flexible.sh enable` کانفیگ HTTP-only را فعال می‌کند (بدون ریدایرکت به HTTPS تا حلقهٔ ریدایرکت نشود) و nginx را بالا می‌آورد. بعد از نصب Origin Certificate:

```bash
./scripts/install-origin-cert.sh /root/origin-cert.pem /root/origin-key.pem
# Cloudflare → Full (strict)
./scripts/cf-flexible.sh disable
```

> ⚠️ حالت Flexible فقط برای راه‌اندازی موقت است؛ در آن مسیر Cloudflare↔سرور رمزنگاری نشده است.
