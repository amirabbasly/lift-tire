# 🚀 راهنمای کامل دیپلوی «لیفت تایر» روی سرور تازه Ubuntu 24.04

این راهنما از صفر تا آنلاین‌شدن سایت را پوشش می‌دهد؛ فرض بر این است که یک VPS تازه با **Ubuntu 24.04 LTS** خریده‌اید و دامنه `lift-tire.com` را در اختیار دارید.

> ⚡ **خلاصهٔ سه‌دستوری:**
>
> ```bash
> ./deploy.sh install    # سایت همین حالا روی http://IP باز می‌شود (بدون گواهی)
> ./deploy.sh ssl        # certbot روی همان nginx، بدون API Token و بدون دسترسی Zone
> ./deploy.sh status     # وضعیت + حالت HTTP/HTTPS
> ```
>
> nginx هرگز به‌خاطر نبودن گواهی کرش/ری‌استارت نمی‌شود.

**اگر عجله دارید:**

| مشکل | بخش |
| --- | --- |
| سایت بالا نمی‌آید / nginx ری‌استارت می‌شود | ۱۹ و ۲۲ |
| certbot خطا می‌دهد | ۱۹ |
| دامنه پشت Cloudflare است | ۲۰ و ۲۱ (گام ۳) |
| از صفر و بدون دانش قبلی | ۲۱ (رانبوک کامل) |

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

> 🔁 **تغییر دامنه:** اگر دامنه‌تان چیز دیگری است، `DOMAIN` و `NEXT_PUBLIC_SITE_URL` را عوض کنید؛ `deploy.sh` هنگام `install`/`update`/`restart` هر دو کانفیگ nginx را از قالب می‌سازد (`sed` روی `nginx/site/http.conf.template` و `nginx/site/https.conf.template`).

> ⚠️ `ADMIN_PASSWORD` پیش‌فرض (`Lift@12345`) را حتماً عوض کنید — همان رمزی است که در `seed` ساخته می‌شود.

---

## ۸) یک دستور: سایت را روی HTTP بالا بیاور

```bash
cd /var/www/lift-tire.com/lift-tire
chmod +x deploy.sh scripts/*.sh nginx/entrypoint-mode.sh
./deploy.sh up
```

`up` این کارها را به‌ترتیب انجام می‌دهد:

1. `.env` را می‌سازد (اگر نبود) و `JWT_SECRET` تصادفی می‌گذارد
2. پوشه‌های `/var/www/certbot` و `/etc/letsencrypt` را روی سرور آماده می‌کند
3. ایمیج‌های `api` و `web` را بیلد می‌کند
4. `postgres` را بالا می‌آورد، رمز را با `.env` تطبیق می‌دهد، seed می‌زند
5. `api` و `web` را اجرا می‌کند
6. `nginx` را بالا می‌آورد — **بدون نیاز به گواهی، روی HTTP**

خروجی موفق:

```
✅ سایت روی HTTP بالاست:  http://lift-tire.com   (یا http://46.249.101.79)
```

همین‌جا در مرورگر با IP سرور باز کنید: `http://46.249.101.79`

> گواهی SSL هنوز لازم نیست؛ سایت کامل کار می‌کند.

---

## ۹) گرفتن گواهی SSL با certbot **نصبی روی سرور**

> ⚠️ این روش **certbot نصبی** است (با `apt`)، نه ایمیج داکر و نه Cloudflare API. هیچ توکن یا دسترسی Zone لازم نیست.

### نصب certbot روی سرور (یک‌بار)

```bash
apt update
apt install -y certbot
certbot --version
```

> اگر نسخه قدیمی دارید، `snap install certbot --classic` هم کار می‌کند.
> پلاگین `python3-certbot-nginx` **لازم نیست** — ما از روش webroot استفاده می‌کنیم که با nginx داخل کانتینر هم سازگار است.

### گرفتن گواهی

```bash
sudo ./scripts/ssl-certbot.sh --dry-run    # تست بدون مصرف سهمیه
sudo ./scripts/ssl-certbot.sh              # صدور واقعی
```

اسکریپت این کارها را می‌کند:

1. certbot را چک می‌کند (اگر نبود با `apt` نصب می‌کند)
2. `nginx` کانتینری را روی HTTP بالا می‌آورد
3. یک فایل تست در `/var/www/certbot/.well-known/acme-challenge/` می‌گذارد و **از اینترنت** می‌خواندش
4. `certbot certonly --webroot -w /var/www/certbot` را روی همان سرور اجرا می‌کند
5. nginx را با `--force-recreate` بالا می‌آورد → خودکار به HTTPS سوییچ می‌کند
6. `certbot.timer` را فعال و هوک `reload nginx` را نصب می‌کند

خروجی موفق:

```
✅ گواهی با موفقیت صادر شد: /etc/letsencrypt/live/lift-tire.com/
   ✓ nginx در حالت HTTPS کار می‌کند (کد 200).
```

### تمدید خودکار

پکیج certbot اوبونتو `certbot.timer` را نصب می‌کند (دو بار در روز) و خودش تمدید می‌کند. بررسی:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

هوک ری‌لود nginx کانتینری خودکار نصب می‌شود:
`/etc/letsencrypt/renewal-hooks/deploy/lifttire-reload-nginx.sh`

### اگر خطا داد

| پیام | معنی | راه‌حل |
| --- | --- | --- |
| `Timeout during connect` | پورت ۸۰ از بیرون بسته | `ufw allow 80/tcp && ufw allow 443/tcp` + فایروال پنل ارائه‌دهنده |
| `Invalid response ... 404` | رکورد A به سرور دیگری می‌رود | رکورد A `@` و `www` را به IP سرور اصلاح کنید |
| `too many certificates` | سهمیه هفتگی Let's Encrypt | یک ساعت صبر یا `--staging` برای تست |

---

## ۱۰) بررسی نهایی

**قبل از SSL** (سایت روی HTTP):

```bash
./deploy.sh status
curl -I http://lift-tire.com
curl -s http://lift-tire.com/api/health
```

**بعد از `./deploy.sh ssl`:**

```bash
curl -I  https://lift-tire.com
curl -s  https://lift-tire.com/api/health
curl -s  https://lift-tire.com/api/products?limit=1
curl -I  http://www.lift-tire.com          # باید 301 به https://lift-tire.com باشد
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
0 4 * * * certbot renew --webroot -w /var/www/certbot --quiet && cd /var/www/lift-tire.com/lift-tire && docker compose exec -T nginx nginx -s reload
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
sudo ./deploy.sh update
```

(بکاپ خودکار → `git pull` → بیلد → ری‌استارت؛ دیتابیس و تصاویر آپلودی دست‌نخورده می‌مانند)

### آوردن کد از یک شاخهٔ مشخص

اگر کد جدید روی شاخهٔ دیگری (غیر از شاخهٔ فعلی سرور) است:

```bash
sudo ./deploy.sh update --branch=arena/efe4c33f-lift-tire
```

### بروزرسانی بدون داکر (حالت PM2)

اگر سایت را با اسکریپت PM2 بالا آورده‌اید:

```bash
cd /var/www/lift-tire.com/frontend
git fetch origin arena/efe4c33f-lift-tire
git checkout arena/efe4c33f-lift-tire
git pull --ff-only origin arena/efe4c33f-lift-tire
npm ci
npm run build
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
pm2 restart lifttire-web
```

> کش مرورگر: بعد از بروزرسانی یک‌بار `Ctrl+Shift+R` بزنید تا فایل‌های قدیمی CSS/JS جایگزین شوند.

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

# گرفتن / تمدید گواهی SSL (بدون API Token)
./deploy.sh ssl

# حالت nginx
docker compose logs --tail=20 nginx | grep lifttire-nginx

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

## ۱۹) عیب‌یابی SSL و nginx

### دیگر «nginx در حال ری‌استارت» نداریم

نسخه‌های قبلی، کانفیگ nginx همیشه به فایل گواهی اشاره می‌کرد؛ پس بدون گواهی، nginx کرش می‌کرد و در حلقهٔ ری‌استارت می‌ماند. الان:

- `nginx/site/http.conf` → حالت بدون گواهی (سایت روی HTTP بالاست)
- `nginx/site/https.conf` → حالت با گواهی
- `nginx/entrypoint-mode.sh` هنگام استارت تصمیم می‌گیرد کدام فعال شود

```bash
docker compose logs --tail=20 nginx | grep lifttire-nginx
# [lifttire-nginx] حالت فعال: HTTP (بدون گواهی) — سایت بالاست...
```

### چرا certbot شکست می‌خورد؟

| پیام | معنی | راه‌حل |
| --- | --- | --- |
| `Timeout during connect` | پورت ۸۰ از بیرون بسته است یا IP اشتباه است | باز کردن ۸۰/۴۴۳ در ufw **و در فایروال پنل ارائه‌دهنده** |
| `Invalid response ... 404` با یک IP دیگر | رکورد A به سرور دیگری اشاره می‌کند | اصلاح رکورد A در پنل DNS |
| `unauthorized` برای دامنه اصلی ولی www سالم | معمولاً A یا AAAA دامنه اصلی اشتباه است | حذف AAAA/CNAME اشتباه، ست‌کردن A درست |
| `too many certificates already issued` | سهمیهٔ هفتگی Let's Encrypt | یک ساعت صبر یا تست با `--staging` |

بررسی سریع:

```bash
curl -4 -s https://api.ipify.org; echo          # IP واقعی این سرور
getent ahostsv4 lift-tire.com                     # دامنه اصلی به کجا می‌رود؟
getent ahostsv4 www.lift-tire.com                 # www به کجا می‌رود؟
ss -lntp | grep -E ':80|:443'                    # چه چیزی پورت‌ها را گرفته؟
ufw status
```

رکوردهای لازم:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | IP سرور |
| A | `www` | IP سرور |
| AAAA | `@` / `www` | ❌ حذف شود (اگر به این سرور اشاره نمی‌کند) |
| CNAME | `www` | ❌ حذف شود |

### تمدید خودکار

```cron
0 4 * * * certbot renew --webroot -w /var/www/certbot --quiet && cd /var/www/lift-tire.com/lift-tire && docker compose exec -T nginx nginx -s reload
```

---

## ۲۰) اگر دامنه پشت Cloudflare است (اختیاری)

این روش **هیچ نیاز به API Token یا Zone ندارد**. فقط باید پروکسی موقتاً خاموش شود تا Let's Encrypt بتواند فایل تأیید را بخواند:

1. Cloudflare → **DNS** → رکوردهای `@` و `www`:
   - **Proxy status = DNS only** (ابر خاکستری)
   - مقدار A = IP سرور:  `curl -4 -s https://api.ipify.org`
   - رکورد AAAA یا CNAME اضافی را حذف کنید
2. `sudo ./scripts/ssl-certbot.sh` — اسکریپت خودش تست می‌کند و تا ۳ دقیقه صبر می‌کند
3. بعد از موفقیت: پروکسی را روشن کنید و **SSL/TLS → Overview → Full (strict)**
4. **Always Use HTTPS** را روشن کنید

> ⚠️ حالت **Flexible** را نگه ندارید؛ چون nginx روی HTTP است و ریدایرکت به HTTPS نداریم، حلقهٔ ریدایرکت یا خطای ۵۲۱ می‌گیرید.

> 🚫 در نسخه فعلی هیچ اسکریپت DNS-01، `cloudflare.ini` یا API Token وجود ندارد. اگر کسی پیشنهاد داد، مربوط به نسخه قدیمی است.

---

## ۲۱) 🚀 رانبوک: از صفر تا سایت آنلاین (دستور کوتاه)

### گام ۰ — پاک‌سازی هر چیزی که قبلاً ساخته شد

اگر نصب‌های قبلی داشتی (کانتینر، ایمیج، volume، گواهی، کانفیگ nginx، پوشهٔ پروژه):

```bash
cd /var/www/lift-tire.com/lift-tire

# فقط کانتینرهای همین پروژه
./deploy.sh clean --yes

# یا پاک‌سازی کاملِ همه‌چیز (کانتینر + ایمیج + volume + گواهی + nginx)
sudo ./deploy.sh destroy --yes

# اگر می‌خواهی کد و .env بمانند:
sudo ./deploy.sh destroy --yes --keep-code
```

`destroy` این‌ها را حذف می‌کند:

```
✓ کانتینرها و شبکهٔ lifttire
✓ ایمیج‌های lifttire-api / lifttire-web
✓ volumeهای lifttire_pgdata و lifttire_uploads
✓ گواهی /etc/letsencrypt/live/lift-tire.com
✓ /etc/nginx/sites-enabled/lift-tire.conf و /etc/nginx/lifttire
✓ /etc/cron.d/lifttire-certbot
✓ اپ‌های PM2 (اگر بودند)
✓ خودِ پوشهٔ پروژه (مگر با --keep-code)
```

### گام ۱ — کد + `.env`

```bash
cd /var/www
git clone <REPO_URL> lift-tire.com/lift-tire
cd lift-tire.com/lift-tire

cp .env.example .env
sed -i "s|CHANGE_ME_TO_A_LONG_RANDOM_SECRET|$(openssl rand -hex 32)|" .env
sed -i "s|CHANGE_ME_DB_PASSWORD|$(openssl rand -hex 16)|g" .env
nano .env      # ADMIN_PASSWORD را عوض کنید
```

حداقل مقادیر:

```env
DOMAIN=lift-tire.com
NEXT_PUBLIC_SITE_URL=https://lift-tire.com
JWT_SECRET=<تصادفی>
POSTGRES_PASSWORD=<تصادفی>
ADMIN_EMAIL=admin@lift-tire.com
ADMIN_PASSWORD=<رمز دلخواه>
LETSENCRYPT_DIR=/etc/letsencrypt
ACME_WEBROOT=/var/www/certbot
```

### گام ۲ — یک دستور: سایت روی HTTP

```bash
chmod +x deploy.sh scripts/*.sh nginx/entrypoint-mode.sh
./deploy.sh up
```

انتظار:

```
lifttire_db      Up (healthy)
lifttire_api     Up (healthy)
lifttire_web     Up (healthy)
lifttire_nginx   Up (healthy)

✅ سایت روی HTTP بالاست:  http://lift-tire.com   (یا http://IP)
```

**حالا در مرورگر `http://IP-سرور` را باز کن — سایت باید کامل بالا باشد.**

### گام ۳ — گواهی SSL با certbot نصبی (نه داکر، نه Cloudflare)

```bash
sudo apt install -y certbot          # اگر نصب نیست (اسکریپت خودش هم نصب می‌کند)

sudo ./scripts/ssl-certbot.sh --dry-run   # تست
sudo ./scripts/ssl-certbot.sh             # واقعی
```

اسکریپت خودش: nginx را HTTP نگه می‌دارد → مسیر ACME را از اینترنت تست می‌کند → گواهی می‌گیرد → nginx را به HTTPS سوییچ می‌کند → تایمر تمدید را فعال می‌کند.

خروجی موفق:

```
✅ گواهی با موفقیت صادر شد: /etc/letsencrypt/live/lift-tire.com/
   ✓ nginx در حالت HTTPS کار می‌کند (کد 200).
```

### گام ۴ — تأیید

```bash
curl -I https://lift-tire.com
curl -s https://lift-tire.com/api/health
```

### دستورهای روزمره

```bash
./deploy.sh up          # بالا آوردن همه‌چیز (HTTP اگر گواهی نباشد)
./deploy.sh status      # وضعیت + حالت HTTP/HTTPS
./deploy.sh doctor      # بررسی کامل (Docker، DNS، گواهی، پاسخ‌ها)
./deploy.sh logs api    # لاگ
./deploy.sh restart
./deploy.sh backup
sudo ./scripts/ssl-certbot.sh   # گرفتن/تمدید گواهی
./deploy.sh clean --yes --volumes    # حذف کانتینر + داده
sudo ./deploy.sh destroy             # پاک‌سازی کامل
```

---

## ۲۲) حالت‌های nginx و عیب‌یابی سریع

| کار | دستور |
| --- | --- |
| حالت فعلی | `docker compose logs --tail=20 nginx \| grep lifttire-nginx` |
| کانفیگ فعال | `docker compose exec nginx cat /etc/nginx/conf.d/default.conf \| head -20` |
| تست کانفیگ | `docker compose exec nginx nginx -t` |
| تعویض دستی حالت | `NGINX_MODE=http docker compose up -d --force-recreate nginx` |
| ری‌استارت امن | `./deploy.sh restart` |

### اگر nginx اصلاً بالا نیامد (خطای پورت)

پرتکرارترین دلیل «سایت روی HTTP هم بالا نمی‌آید» این است که پورت ۸۰ یا ۴۴۳ توسط سرویس دیگری گرفته شده است:

```bash
sudo ss -lntp | grep -E ':80|:443'
```

- اگر `nginx` یا `apache2` خودِ سیستم است → `systemctl disable --now nginx apache2`
- اگر کانتینر قدیمی است → `docker ps -a | grep -E ':80'` و سپس `./deploy.sh clean --yes`

`./deploy.sh restart` این حالت را تشخیص می‌دهد و پیام فارسی می‌دهد.

### اگر nginx بالا است ولی صفحه ۵۰۲ می‌دهد

یعنی nginx سالم است و `web`/`api` جواب نمی‌دهند:

```bash
docker compose ps
docker compose logs --tail=50 web
docker compose logs --tail=50 api
```

فایل‌ها:

| مسیر (روی هاست) | نقش |
| --- | --- |
| `nginx/site/http.conf` | حالت بدون گواهی (پورت ۸۰، بدون ریدایرکت) |
| `nginx/site/https.conf` | حالت با گواهی (۴۴۳ + ریدایرکت ۸۰→۴۴۳) |
| `nginx/site/locations.conf` | قواعد مشترک پروکسی (api، uploads، static) |
| `nginx/entrypoint-mode.sh` | تشخیص خودکار حالت در استارت |

`deploy.sh` هنگام `install`/`update`/`restart` هر دو فایل را از قالب (`*.template`) با `DOMAIN` می‌سازد.

---

## ۲۳) 🟢 اجرا با PM2 (بدون داکر برای api/web)

اگر می‌خواهید سایت با **PM2** بالا بیاید (نه کانتینر)، این مسیر کامل است.

### معماری

```
کاربر → nginx (روی سرور، 80/443) → 127.0.0.1:3000  Next.js  (PM2: lifttire-web)
                                   → 127.0.0.1:4000  Express  (PM2: lifttire-api)
                                                  ↓
                                     PGlite (فایل) یا PostgreSQL روی 127.0.0.1
```

مزیت: بدون بیلد ایمیج، مصرف رم کمتر، لاگ‌ها مستقیم با `pm2 logs`.

### گام ۱ — ابزارها

```bash
apt update
apt install -y nginx certbot python3-certbot-nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
node -v && nginx -v && pm2 -v
```

### گام ۲ — کد و `.env`

```bash
cd /var/www/lift-tire.com/lift-tire
git pull
cp .env.example .env
nano .env
```

حداقل مقادیر (بقیه پیش‌فرض درست است):

```env
DOMAIN=lift-tire.com
NEXT_PUBLIC_SITE_URL=https://lift-tire.com
JWT_SECRET=<openssl rand -hex 32>
ADMIN_EMAIL=admin@lift-tire.com
ADMIN_PASSWORD=<رمز دلخواه>
USE_PGLITE=true
API_INTERNAL_URL=http://127.0.0.1:4000
UPLOAD_DIR=./backend/uploads
```

> برای PostgreSQL روی خود سرور: `USE_PGLITE=false` و `DATABASE_URL=postgresql://lifttire:رمز@127.0.0.1:5432/lifttire`. اسکریپت خودش نقش و دیتابیس را می‌سازد.

### گام ۳ — نصب

```bash
chmod +x scripts/deploy-pm2.sh
sudo ./scripts/deploy-pm2.sh install
```

این دستور به‌ترتیب: وابستگی‌ها را نصب، Next.js را بیلد (standalone)، `public` و `_next/static` را داخل خروجی کپی، دیتابیس را آماده، PM2 را استارت، nginx را روی پورت ۸۰ بنویسد و seed را اجرا می‌کند.

### گام ۴ — استارت خودکار بعد از ری‌بوت

```bash
pm2 startup systemd -u root --hp /root     # خط چاپ‌شده را کپی و اجرا کنید
pm2 save
```

### گام ۵ — گواهی SSL با certbot (بدون API Token)

```bash
sudo ./scripts/deploy-pm2.sh ssl
```

چه می‌کند: nginx را روی حالت HTTP با مسیر ACME تنظیم می‌کند، یک فایل تست می‌گذارد و از اینترنت می‌خواندش، با `certbot certonly --webroot` گواهی می‌گیرد، nginx را به HTTPS سوییچ می‌کند و cron تمدید را در `/etc/cron.d/lifttire-certbot` می‌نویسد.

> اگر پشت Cloudflare هستید: رکوردهای `@` و `www` را موقتاً **DNS only** کنید، بعد از گرفتن گواهی پروکسی را روشن و SSL mode را **Full (strict)** کنید.

### دستورهای روزمره

```bash
sudo ./scripts/deploy-pm2.sh status      # وضعیت PM2 + کد پاسخ‌ها
sudo ./scripts/deploy-pm2.sh doctor      # بررسی کامل سلامت
sudo ./scripts/deploy-pm2.sh logs        # لاگ زنده
sudo ./scripts/deploy-pm2.sh logs lifttire-api
sudo ./scripts/deploy-pm2.sh restart
sudo ./scripts/deploy-pm2.sh update      # git pull + بیلد + ری‌استارت
sudo ./scripts/deploy-pm2.sh nginx http  # بازگشت اجباری به HTTP
sudo ./scripts/deploy-pm2.sh nginx https # سوییچ به HTTPS (اگر گواهی هست)
```

### فایل‌های مربوطه

| مسیر | نقش |
| --- | --- |
| `ecosystem.config.cjs` | تعریف دو اپ PM2 (`lifttire-api`, `lifttire-web`) |
| `scripts/deploy-pm2.sh` | نصب/بروزرسانی/SSL/وضعیت |
| `nginx/host/http.conf.template` | کانفیگ nginx حالت HTTP |
| `nginx/host/https.conf.template` | کانفیگ nginx حالت HTTPS |
| `nginx/host/locations.conf` | پروکسی مشترک به ۱۲۷.۰.۰.۱ |
| `/etc/nginx/sites-available/lift-tire.conf` | خروجی رندرشده روی سرور |
| `/etc/nginx/lifttire/locations.conf` | کپی قواعد مشترک |
| `/etc/cron.d/lifttire-certbot` | تمدید خودکار گواهی |

### عیب‌یابی PM2

| نشانه | علت | راه‌حل |
| --- | --- | --- |
| `pm2 list` → `errored` | پورت اشغال یا خطای دیتابیس | `pm2 logs lifttire-api --nostream --lines 40` |
| صفحه ۵۰۲ | PM2 بالا نیست | `pm2 list` سپس `pm2 start ecosystem.config.cjs` |
| صفحه ۴۰۴ روی همه مسیرها | `public`/`.next/static` کپی نشده | `sudo ./scripts/deploy-pm2.sh update` |
| `nginx: [emerg] bind() to 0.0.0.0:80 failed` | nginx/apache دیگر یا کانتینر قدیمی | `./deploy.sh clean --yes` و `systemctl stop apache2` |
| بعد از ری‌بوت سایت پایین است | `pm2 startup` اجرا نشده | گام ۴ را انجام دهید |
| `EACCES` روی `/var/www/...` | مالکیت پوشه | `chown -R root:root /var/www/lift-tire.com` (فقط ریشه لازم است) |

> **هر دو روش با هم نه!** اگر PM2 را بالا آورده‌اید، کانتینرهای `api` و `web` را خاموش کنید: `docker compose stop api web`. وگرنه هر دو روی ۳۰۰۰/۴۰۰۰ رقابت می‌کنند (خطای `EADDRINUSE`).
