# گزارش URLهای سئو — اندازه‌گیری محلی و وضعیت زنده

## روش و هشدار درباره داده

تمام عددها، canonical و sitemap جداول زیر با درخواست GET به **پیش‌نمایش محلی** Next.js در `127.0.0.1:3000` با API مجزای PGlite آزمایشی در `127.0.0.1:4000` اندازه‌گیری شده‌اند. پایگاه آزمایشی فقط seed و داده حاصل تست دارد و شامل ۲۰ کالای نمونه است؛ وجود و اصالت این کالاها، قیمت‌ها و نظرها در تولید تأیید نشده است. دامنه کامل در جدول از `NEXT_PUBLIC_SITE_URL` می‌آید؛ چاپ `https://lift-tire.com` در HTML محلی **به معنی انتشار زنده نیست**. «مجاز در HTML» یعنی noindex در پاسخ محلی دیده نشد؛ این عبارت به معنی ایندکس، کشف یا رتبه نیست. «همان URL» در ستون canonical یعنی canonical مشاهده‌شده دقیقاً برابر URL مطلق همان سطر است. sitemap محلی 48 URL داشت.

جداول صفحاتی را که در این دور اضافه یا از نظر قالب، محتوای مجله، متادیتا، دسته، فهرست یا محصول به‌طور معنادار تحت تأثیر قرار گرفته‌اند پوشش می‌دهند. «جدید» نسبت به مبنای این دور (`7c7475d`) است: رپورتاژ، چهار مقاله تحریریه و چهار دسته مجله قبلاً در همین شاخه ساخته شده‌اند و در جدول صفحات موجود آمده‌اند؛ این طبقه‌بندی به‌تنهایی وضعیت زنده آن‌ها را ثابت نمی‌کند. فیلترها و صفحه دوم فروشگاه برای شفافیت اضافه شده‌اند؛ نبود صفحه‌بندی فروشگاه در sitemap به معنی بسته بودن آن برای خزیدن نیست. مقالات مدیر و محصولات واقعی تولید ممکن است مجموعه متفاوتی داشته باشند؛ پس از استقرار، گزارش باید با API واقعی و داده صاحب فروشگاه تکرار شود.

## URLهای جدید؛ هنوز استقرار این شاخه تأیید نشده

| عنوان صفحه (H1) | عنوان HTML | URL مطلق | نوع | کلیدواژه اصلی هدف | HTTP محلی | canonical محلی | ایندکس‌پذیری محلی | در sitemap محلی |
|---|---|---|---|---|---|---|---|---|
| لاستیک بارز؛ راهنمای انتخاب و بررسی محصولات | لاستیک بارز؛ راهنمای انتخاب و بررسی محصولات \| لیفت تایر | `https://lift-tire.com/brands/barz` | راهنمای برند | لاستیک بارز | 200 | همان URL | مجاز در HTML | بله |
| لاستیک کویر تایر؛ راهنمای انتخاب و بررسی محصولات | لاستیک کویر تایر؛ راهنمای انتخاب و بررسی محصولات \| لیفت تایر | `https://lift-tire.com/brands/kavir` | راهنمای برند | لاستیک کویر تایر | 200 | همان URL | مجاز در HTML | بله |
| شاخص بار و سرعت لاستیک چیست؟ راهنمای خواندن و انتخاب | شاخص بار و سرعت لاستیک چیست؟ راهنمای خواندن و انتخاب \| لیفت تایر | `https://lift-tire.com/blog/tire-load-speed-index-guide` | مقاله جدید | شاخص بار و سرعت لاستیک | 200 | همان URL | مجاز در HTML | بله |
| سایش نامنظم لاستیک؛ نشانه‌ها و زمان مراجعه به متخصص | سایش نامنظم لاستیک؛ نشانه‌ها و زمان مراجعه به متخصص \| لیفت تایر | `https://lift-tire.com/blog/tire-wear-pattern-guide` | مقاله جدید | سایش نامنظم لاستیک | 200 | همان URL | مجاز در HTML | بله |

دو مقاله تازه عمداً فاقد تاریخ انتشار در schema و صفحه‌اند؛ زمان انتشار واقعی هنوز معلوم نیست. در بررسی عمومی قبلی، محتوای صفحه ۴۰۴ برای این چهار آدرس دیده شد؛ ابزار دریافت صفحه کد HTTP عددی یا canonical زنده را گزارش نکرد.

## صفحه‌های موجود و صفحه‌بندی/فیلتر؛ سنجش محلی

| عنوان صفحه (H1) | عنوان HTML | URL مطلق | نوع | کلیدواژه اصلی هدف | HTTP محلی | canonical محلی | ایندکس‌پذیری محلی | در sitemap محلی |
|---|---|---|---|---|---|---|---|---|
| لاستیک اصل، ایمنی واقعی | خرید و بررسی لاستیک خودرو \| لیفت تایر | `https://lift-tire.com/` | صفحه اصلی؛ اصلاح فنی غیرظاهری | خرید لاستیک | 200 | `https://lift-tire.com` | مجاز در HTML | بله |
| فروشگاه لاستیک لیفت تایر | فروشگاه لاستیک \| لیفت تایر | `https://lift-tire.com/products` | فهرست فروشگاه | خرید لاستیک | 200 | همان URL | مجاز در HTML | بله |
| فروشگاه لاستیک لیفت تایر | فروشگاه لاستیک، صفحه 2 \| لیفت تایر | `https://lift-tire.com/products?page=2` | صفحه دوم فروشگاه | خرید لاستیک | 200 | همان URL | مجاز در HTML | خیر |
| فروشگاه لاستیک لیفت تایر | فروشگاه لاستیک \| لیفت تایر | `https://lift-tire.com/products?brand=barz` | فیلتر برند؛ noindex | فیلتر محصولات بارز | 200 | همان URL | noindex | خیر |
| لاستیک سواری | لاستیک سواری \| لیفت تایر | `https://lift-tire.com/category/passenger` | دسته | لاستیک سواری | 200 | همان URL | مجاز در HTML | بله |
| لاستیک سواری | لاستیک سواری \| لیفت تایر | `https://lift-tire.com/category/passenger?brand=barz` | فیلتر دسته؛ noindex | لاستیک سواری بارز | 200 | همان URL | noindex | خیر |
| آفرود و شاسی‌بلند | آفرود و شاسی‌بلند \| لیفت تایر | `https://lift-tire.com/category/offroad` | دسته | لاستیک آفرود | 200 | همان URL | مجاز در HTML | بله |
| لاستیک باری | لاستیک باری \| لیفت تایر | `https://lift-tire.com/category/truck` | دسته | لاستیک باری | 200 | همان URL | مجاز در HTML | بله |
| رینگ و تیوب | رینگ و تیوب \| لیفت تایر | `https://lift-tire.com/category/rim` | دسته | رینگ و تیوب | 200 | همان URL | مجاز در HTML | بله |
| لوازم جانبی | لوازم جانبی \| لیفت تایر | `https://lift-tire.com/category/accessories` | دسته | لوازم جانبی خودرو | 200 | همان URL | مجاز در HTML | بله |
| مجله لیفت تایر | مجله خودرو و لاستیک \| لیفت تایر | `https://lift-tire.com/blog` | فهرست مجله | مجله لاستیک | 200 | همان URL | مجاز در HTML | بله |
| مجله لیفت تایر | مجله خودرو و لاستیک، صفحه ۲ \| لیفت تایر | `https://lift-tire.com/blog?page=2` | صفحه دوم مجله | مجله لاستیک | 200 | همان URL | مجاز در HTML | بله |
| راهنمای خرید \| مجله لیفت تایر | راهنمای خرید \| مجله \| لیفت تایر | `https://lift-tire.com/blog/category/buying-guide` | دسته مجله | راهنمای خرید لاستیک | 200 | همان URL | مجاز در HTML | بله |
| نگهداری لاستیک \| مجله لیفت تایر | نگهداری لاستیک \| مجله \| لیفت تایر | `https://lift-tire.com/blog/category/tire-care` | دسته مجله | نگهداری لاستیک | 200 | همان URL | مجاز در HTML | بله |
| ایمنی و سفر \| مجله لیفت تایر | ایمنی و سفر \| مجله \| لیفت تایر | `https://lift-tire.com/blog/category/road-safety` | دسته مجله | ایمنی لاستیک و سفر | 200 | همان URL | مجاز در HTML | بله |
| خدمات خودرویی \| مجله لیفت تایر | خدمات خودرویی \| مجله \| لیفت تایر | `https://lift-tire.com/blog/category/automotive-services` | دسته مجله | خدمات خودرو | 200 | همان URL | مجاز در HTML | بله |
| خودرو چاره؛ سوپراپلیکیشن جامع و پروژه ملی خدمات خودرویی کشور | خودرو چاره؛ سوپراپلیکیشن جامع و پروژه ملی خدمات خودرویی کشور \| لیفت تایر | `https://lift-tire.com/blog/khodro-chare-national-automotive-services` | رپورتاژ موجود | خودرو چاره خدمات خودرویی | 200 | همان URL | مجاز در HTML | بله |
| راهنمای خرید لاستیک خودرو؛ از انتخاب سایز تا تاریخ تولید | راهنمای خرید لاستیک خودرو؛ از انتخاب سایز تا تاریخ تولید \| لیفت تایر | `https://lift-tire.com/blog/complete-tire-buying-guide` | مقاله موجود | راهنمای خرید لاستیک | 200 | همان URL | مجاز در HTML | بله |
| تنظیم باد لاستیک خودرو؛ فشار مناسب را از کجا پیدا کنیم؟ | تنظیم باد لاستیک خودرو؛ فشار مناسب را از کجا پیدا کنیم؟ \| لیفت تایر | `https://lift-tire.com/blog/tire-pressure-safety-guide` | مقاله موجود | فشار باد لاستیک | 200 | همان URL | مجاز در HTML | بله |
| تاریخ تولید لاستیک و کد DOT؛ چگونه سن تایر را بخوانیم؟ | تاریخ تولید لاستیک و کد DOT؛ چگونه سن تایر را بخوانیم؟ \| لیفت تایر | `https://lift-tire.com/blog/tire-dot-date-guide` | مقاله موجود | تاریخ تولید لاستیک | 200 | همان URL | مجاز در HTML | بله |
| پنچری لاستیک در جاده؛ اقدامات ایمن و راهنمای درخواست امداد | پنچری لاستیک در جاده؛ اقدامات ایمن و راهنمای درخواست امداد \| لیفت تایر | `https://lift-tire.com/blog/flat-tire-roadside-safety` | مقاله موجود | پنچری و ایمنی جاده | 200 | همان URL | مجاز در HTML | بله |
| خواندن سایز لاستیک در ۳ دقیقه | خواندن سایز لاستیک در ۳ دقیقه \| لیفت تایر | `https://lift-tire.com/blog/how-to-read-tire-size` | مقاله CMS نمونه | خواندن سایز لاستیک | 200 | همان URL | مجاز در HTML | بله |
| چه زمانی لاستیک را عوض کنیم؟ | چه زمانی لاستیک را عوض کنیم؟ \| لیفت تایر | `https://lift-tire.com/blog/when-to-change-tires` | مقاله CMS نمونه | زمان تعویض لاستیک | 200 | همان URL | مجاز در HTML | بله |
| تابستانی یا چهارفصل؟ انتخاب درست برای آب‌وهوای ایران | تابستانی یا چهارفصل؟ انتخاب درست برای آب‌وهوای ایران \| لیفت تایر | `https://lift-tire.com/blog/summer-or-all-season` | مقاله CMS نمونه | لاستیک تابستانی یا چهارفصل | 200 | همان URL | مجاز در HTML | بله |

## محصول‌های موجود در پایگاه آزمایشی — نه تأیید کاتالوگ زنده

قالب همه محصولات تغییر کرده است؛ این جدول فقط ۲۰ slug پایگاه آزمایش را نشان می‌دهد و فهرست نهایی تولید یا پیشنهاد ثبت ۲۰ کالای نمونه در گوگل نیست. هر کالا باید با پایگاه واقعی، محتوای صحیح و قیمت/موجودی تأییدشده مجدداً سنجیده شود.

| عنوان صفحه (H1) | عنوان HTML | URL مطلق | نوع | کلیدواژه اصلی هدف | HTTP محلی | canonical محلی | ایندکس‌پذیری محلی | در sitemap محلی |
|---|---|---|---|---|---|---|---|---|
| تیوب و نوار لاستیک ۱۵ اینچ | تیوب و نوار لاستیک ۱۵ اینچ 15 اینچ \| لیفت تایر | `https://lift-tire.com/products/tire-20` | محصول داده نمایشی | خرید تیوب و نوار لاستیک ۱۵ اینچ | 200 | همان URL | مجاز در HTML | بله |
| رینگ آلومینیومی اسپرت ۱۶ اینچ | رینگ آلومینیومی اسپرت ۱۶ اینچ 16 اینچ \| لیفت تایر | `https://lift-tire.com/products/tire-19` | محصول داده نمایشی | خرید رینگ آلومینیومی اسپرت ۱۶ اینچ | 200 | همان URL | مجاز در HTML | بله |
| کنتیننتال وینترکانتکت | کنتیننتال وینترکانتکت 205/55 R16 \| لیفت تایر | `https://lift-tire.com/products/tire-18` | محصول داده نمایشی | خرید کنتیننتال وینترکانتکت | 200 | همان URL | مجاز در HTML | بله |
| پیرلی اسکورپیون ورد | پیرلی اسکورپیون ورد 255/55 R18 \| لیفت تایر | `https://lift-tire.com/products/tire-17` | محصول داده نمایشی | خرید پیرلی اسکورپیون ورد | 200 | همان URL | مجاز در HTML | بله |
| بارز باری RA08 | بارز باری RA08 195/70 R15 \| لیفت تایر | `https://lift-tire.com/products/tire-16` | محصول داده نمایشی | خرید بارز باری RA08 | 200 | همان URL | مجاز در HTML | بله |
| هانکوک دیناپرو باری | هانکوک دیناپرو باری 195/70 R15 \| لیفت تایر | `https://lift-tire.com/products/tire-15` | محصول داده نمایشی | خرید هانکوک دیناپرو باری | 200 | همان URL | مجاز در HTML | بله |
| کومهو رود ونچر MT | کومهو رود ونچر MT 265/65 R17 \| لیفت تایر | `https://lift-tire.com/products/tire-14` | محصول داده نمایشی | خرید کومهو رود ونچر MT | 200 | همان URL | مجاز در HTML | بله |
| گودیر رانگلر AT | گودیر رانگلر AT 265/65 R17 \| لیفت تایر | `https://lift-tire.com/products/tire-13` | محصول داده نمایشی | خرید گودیر رانگلر AT | 200 | همان URL | مجاز در HTML | بله |
| بریجستون دوئلر AT ۶۹۴ | بریجستون دوئلر AT ۶۹۴ 265/65 R17 \| لیفت تایر | `https://lift-tire.com/products/tire-12` | محصول داده نمایشی | خرید بریجستون دوئلر AT ۶۹۴ | 200 | همان URL | مجاز در HTML | بله |
| میشلن پیلوت اسپرت ۵ | میشلن پیلوت اسپرت ۵ 245/40 R18 \| لیفت تایر | `https://lift-tire.com/products/tire-11` | محصول داده نمایشی | خرید میشلن پیلوت اسپرت ۵ | 200 | همان URL | مجاز در HTML | بله |
| کویر تایر P6000 | کویر تایر P6000 185/65 R15 \| لیفت تایر | `https://lift-tire.com/products/tire-10` | محصول داده نمایشی | خرید کویر تایر P6000 | 200 | همان URL | مجاز در HTML | بله |
| بارز B250 ایرانی | بارز B250 ایرانی 205/55 R16 \| لیفت تایر | `https://lift-tire.com/products/tire-09` | محصول داده نمایشی | خرید بارز B250 ایرانی | 200 | همان URL | مجاز در HTML | بله |
| یوکوهاما Advan Sport | یوکوهاما Advan Sport 225/45 R17 \| لیفت تایر | `https://lift-tire.com/products/tire-08` | محصول داده نمایشی | خرید یوکوهاما Advan Sport | 200 | همان URL | مجاز در HTML | بله |
| کومهو ECSTA HS51 | کومهو ECSTA HS51 195/65 R15 \| لیفت تایر | `https://lift-tire.com/products/tire-07` | محصول داده نمایشی | خرید کومهو ECSTA HS51 | 200 | همان URL | مجاز در HTML | بله |
| هانکوک کینرژی اکو | هانکوک کینرژی اکو 185/65 R15 \| لیفت تایر | `https://lift-tire.com/products/tire-06` | محصول داده نمایشی | خرید هانکوک کینرژی اکو | 200 | همان URL | مجاز در HTML | بله |
| پیرلی P Zero | پیرلی P Zero 245/40 R18 \| لیفت تایر | `https://lift-tire.com/products/tire-05` | محصول داده نمایشی | خرید پیرلی P Zero | 200 | همان URL | مجاز در HTML | بله |
| کنتیننتال اکوکانتکت ۶ | کنتیننتال اکوکانتکت ۶ 215/60 R16 \| لیفت تایر | `https://lift-tire.com/products/tire-04` | محصول داده نمایشی | خرید کنتیننتال اکوکانتکت ۶ | 200 | همان URL | مجاز در HTML | بله |
| گودیر ایگل F1 اسپرت | گودیر ایگل F1 اسپرت 225/45 R17 \| لیفت تایر | `https://lift-tire.com/products/tire-03` | محصول داده نمایشی | خرید گودیر ایگل F1 اسپرت | 200 | همان URL | مجاز در HTML | بله |
| بریجستون تورانزا T005 | بریجستون تورانزا T005 205/55 R16 \| لیفت تایر | `https://lift-tire.com/products/tire-02` | محصول داده نمایشی | خرید بریجستون تورانزا T005 | 200 | همان URL | مجاز در HTML | بله |
| میشلن پریماسی ۴ | میشلن پریماسی ۴ 205/55 R16 \| لیفت تایر | `https://lift-tire.com/products/tire-01` | محصول داده نمایشی | خرید میشلن پریماسی ۴ | 200 | همان URL | مجاز در HTML | بله |

## آنچه درباره سایت زنده واقعاً مشاهده شد

- صفحه اصلی، `/blog`، دسته سواری، `robots.txt` و `sitemap.xml` در بررسی عمومی قبلی قابل خواندن بودند. متن رپورتاژ، لوگو و لینک مقصد خودرو چاره روی سایت زنده مشاهده شد؛ این مشاهده اثبات HTTP عددی، canonical یا ایندکس نیست و `rel` زنده نیازمند بررسی HTML خام است.
- چهار URL جدید بالا خروجی صفحه «۴۰۴» داشتند، اما کد عددی HTTP توسط ابزار ثبت نشد. وضعیت زنده سایر URLهای جدول و اعمال تغییرات این شاخه، اندازه‌گیری یا تأیید نشده است. پس از انتشار، HTTP، canonical، noindex، sitemap و محتوای واقعی را از اینترنت دوباره بررسی کنید.
- هیچ property، sitemap یا درخواستی در Search Console از طرف مالک ثبت نشده و ایندکس بودن هیچ URL تأیید نشده است. [راهنمای مالک](seo-search-console.md) و [رانبوک انتشار](seo-deploy-runbook.md) را ببینید.

## فهرست یک‌خطی آدرس‌های جدید برای اقدام دستی بعد از انتشار و تأیید ۲۰۰

```text
https://lift-tire.com/brands/barz
https://lift-tire.com/brands/kavir
https://lift-tire.com/blog/tire-load-speed-index-guide
https://lift-tire.com/blog/tire-wear-pattern-guide
```

## فهرست سایر صفحات محلی قابل ایندکس برای بازبینی دستی

این‌ها داده محلی‌اند، نه گواهی انتشار یا درخواست ایندکس؛ URLهای noindex عمداً از فهرست اقدام حذف شده‌اند. پیش از هر اقدام همه را روی سایت زنده بررسی کنید.

```text
https://lift-tire.com/
https://lift-tire.com/products
https://lift-tire.com/products?page=2
https://lift-tire.com/category/passenger
https://lift-tire.com/category/offroad
https://lift-tire.com/category/truck
https://lift-tire.com/category/rim
https://lift-tire.com/category/accessories
https://lift-tire.com/blog
https://lift-tire.com/blog?page=2
https://lift-tire.com/blog/category/buying-guide
https://lift-tire.com/blog/category/tire-care
https://lift-tire.com/blog/category/road-safety
https://lift-tire.com/blog/category/automotive-services
https://lift-tire.com/blog/khodro-chare-national-automotive-services
https://lift-tire.com/blog/complete-tire-buying-guide
https://lift-tire.com/blog/tire-pressure-safety-guide
https://lift-tire.com/blog/tire-dot-date-guide
https://lift-tire.com/blog/flat-tire-roadside-safety
https://lift-tire.com/blog/how-to-read-tire-size
https://lift-tire.com/blog/when-to-change-tires
https://lift-tire.com/blog/summer-or-all-season
```

## فهرست یک‌خطی محصول‌های نمونه محلی — برای ثبت در تولید استفاده نشود

```text
https://lift-tire.com/products/tire-20
https://lift-tire.com/products/tire-19
https://lift-tire.com/products/tire-18
https://lift-tire.com/products/tire-17
https://lift-tire.com/products/tire-16
https://lift-tire.com/products/tire-15
https://lift-tire.com/products/tire-14
https://lift-tire.com/products/tire-13
https://lift-tire.com/products/tire-12
https://lift-tire.com/products/tire-11
https://lift-tire.com/products/tire-10
https://lift-tire.com/products/tire-09
https://lift-tire.com/products/tire-08
https://lift-tire.com/products/tire-07
https://lift-tire.com/products/tire-06
https://lift-tire.com/products/tire-05
https://lift-tire.com/products/tire-04
https://lift-tire.com/products/tire-03
https://lift-tire.com/products/tire-02
https://lift-tire.com/products/tire-01
```
