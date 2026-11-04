import 'dotenv/config';
import db, { many, one, query } from './db.js';
import { hash } from './auth.js';

const IMG = {
  passA: '/images/products/tire-passenger-a.png',
  passB: '/images/products/tire-passenger-b.png',
  sport: '/images/products/tire-sport.png',
  suv: '/images/products/tire-suv.png',
  mud: '/images/products/tire-mud.png',
  truck: '/images/products/tire-truck.png',
  winter: '/images/products/tire-winter.png',
  rim: '/images/products/rim-alloy.png',
  acc: '/images/products/accessory-tube.png',
  tread: '/images/products/tire-detail.png',
};

const categories = [
  { slug: 'passenger', name: 'لاستیک سواری', image: IMG.passA, description: 'لاستیک خودروهای سواری و شهری با کیفیت بالا و گارانتی اصالت', sort: 1 },
  { slug: 'offroad', name: 'آفرود و شاسی‌بلند', image: IMG.mud, description: 'لاستیک آفرود، گل‌آج و شاسی‌بلند برای مسیرهای سخت', sort: 2 },
  { slug: 'truck', name: 'لاستیک باری', image: IMG.truck, description: 'لاستیک وانتی و باری با دوام بالا برای مسیرهای طولانی', sort: 3 },
  { slug: 'rim', name: 'رینگ و تیوب', image: IMG.rim, description: 'رینگ آلومینیومی، تیوب و نوار لاستیک', sort: 4 },
  { slug: 'accessories', name: 'لوازم جانبی', image: IMG.acc, description: 'لوازم جانبی و تجهیزات نگهداری لاستیک', sort: 5 },
];

const brands = [
  { slug: 'michelin', name_fa: 'میشلن', name_en: 'MICHELIN', sort: 1, featured: true },
  { slug: 'bridgestone', name_fa: 'بریجستون', name_en: 'BRIDGESTONE', sort: 2, featured: true },
  { slug: 'goodyear', name_fa: 'گودیر', name_en: 'GOODYEAR', sort: 3, featured: true },
  { slug: 'continental', name_fa: 'کنتیننتال', name_en: 'CONTINENTAL', sort: 4, featured: true },
  { slug: 'pirelli', name_fa: 'پیرلی', name_en: 'PIRELLI', sort: 5, featured: true },
  { slug: 'hankook', name_fa: 'هانکوک', name_en: 'HANKOOK', sort: 6, featured: true },
  { slug: 'kumho', name_fa: 'کومهو', name_en: 'KUMHO', sort: 7, featured: false },
  { slug: 'yokohama', name_fa: 'یوکوهاما', name_en: 'YOKOHAMA', sort: 8, featured: false },
  { slug: 'barz', name_fa: 'بارز', name_en: 'BARZ', sort: 9, featured: true },
  { slug: 'kavir', name_fa: 'کویر تایر', name_en: 'KAVIR', sort: 10, featured: true },
];

// name, brand, category, width/ratio/rim, price, old, stock, season, extra
const products = [
  ['میشلن پریماسی ۴', 'michelin', 'passenger', 205, 55, 16, 8750000, 9600000, 12, 'چهارفصل', { badge: 'پرفروش', img: IMG.passA, country: 'فرانسه', made_year: 2024, featured: true }],
  ['بریجستون تورانزا T005', 'bridgestone', 'passenger', 205, 55, 16, 8200000, null, 8, 'چهارفصل', { img: IMG.passB, country: 'ژاپن', made_year: 2024 }],
  ['گودیر ایگل F1 اسپرت', 'goodyear', 'passenger', 225, 45, 17, 11400000, 12800000, 6, 'تابستانی', { badge: 'اسپرت', img: IMG.sport, country: 'آلمان', made_year: 2023, featured: true }],
  ['کنتیننتال اکوکانتکت ۶', 'continental', 'passenger', 215, 60, 16, 9900000, null, 10, 'چهارفصل', { img: IMG.passA, country: 'آلمان', made_year: 2024, featured: true }],
  ['پیرلی P Zero', 'pirelli', 'passenger', 245, 40, 18, 16800000, 18500000, 4, 'تابستانی', { badge: 'ویژه', img: IMG.sport, country: 'ایتالیا', made_year: 2024 }],
  ['هانکوک کینرژی اکو', 'hankook', 'passenger', 185, 65, 15, 5250000, 5900000, 18, 'چهارفصل', { img: IMG.passB, country: 'کره جنوبی', made_year: 2024 }],
  ['کومهو ECSTA HS51', 'kumho', 'passenger', 195, 65, 15, 5450000, null, 15, 'چهارفصل', { img: IMG.passA, country: 'کره جنوبی', made_year: 2023 }],
  ['یوکوهاما Advan Sport', 'yokohama', 'passenger', 225, 45, 17, 11900000, 13200000, 5, 'تابستانی', { img: IMG.sport, country: 'ژاپن', made_year: 2024 }],
  ['بارز B250 ایرانی', 'barz', 'passenger', 205, 55, 16, 3980000, 4350000, 30, 'چهارفصل', { badge: 'اقتصادی', img: IMG.passB, country: 'ایران', made_year: 2024, featured: true }],
  ['کویر تایر P6000', 'kavir', 'passenger', 185, 65, 15, 3350000, 3790000, 40, 'چهارفصل', { img: IMG.passA, country: 'ایران', made_year: 2024 }],
  ['میشلن پیلوت اسپرت ۵', 'michelin', 'passenger', 245, 40, 18, 18700000, null, 3, 'تابستانی', { img: IMG.sport, country: 'فرانسه', made_year: 2024, featured: true }],
  ['بریجستون دوئلر AT ۶۹۴', 'bridgestone', 'offroad', 265, 65, 17, 14900000, 16400000, 7, 'آفرود', { badge: 'آفرود', img: IMG.suv, country: 'ژاپن', made_year: 2024, featured: true }],
  ['گودیر رانگلر AT', 'goodyear', 'offroad', 265, 65, 17, 13400000, null, 6, 'آفرود', { img: IMG.mud, country: 'آلمان', made_year: 2023 }],
  ['کومهو رود ونچر MT', 'kumho', 'offroad', 265, 65, 17, 11200000, 12500000, 5, 'آفرود', { img: IMG.mud, country: 'کره جنوبی', made_year: 2023 }],
  ['هانکوک دیناپرو باری', 'hankook', 'truck', 195, 70, 15, 6400000, 7100000, 14, 'چهارفصل', { img: IMG.truck, country: 'کره جنوبی', made_year: 2024 }],
  ['بارز باری RA08', 'barz', 'truck', 195, 70, 15, 3980000, null, 22, 'چهارفصل', { img: IMG.truck, country: 'ایران', made_year: 2024 }],
  ['پیرلی اسکورپیون ورد', 'pirelli', 'offroad', 255, 55, 18, 17200000, 18900000, 4, 'چهارفصل', { badge: 'لوکس', img: IMG.suv, country: 'ایتالیا', made_year: 2024 }],
  ['کنتیننتال وینترکانتکت', 'continental', 'passenger', 205, 55, 16, 9500000, null, 9, 'زمستانی', { img: IMG.winter, country: 'آلمان', made_year: 2023 }],
  ['رینگ آلومینیومی اسپرت ۱۶ اینچ', 'barz', 'rim', 205, 55, 16, 9850000, 11200000, 6, 'چهارفصل', { img: IMG.rim, country: 'تایوان', made_year: 2024 }],
  ['تیوب و نوار لاستیک ۱۵ اینچ', 'kavir', 'accessories', 15, 0, 15, 690000, null, 60, 'چهارفصل', { img: IMG.acc, country: 'ایران', made_year: 2024 }],
];

const posts = [
  {
    slug: 'when-to-change-tires', title: 'چه زمانی لاستیک را عوض کنیم؟', tag: 'نگهداری',
    excerpt: 'عمق آج، ترک‌های جانبی و تاریخ تولید؛ سه نشانه‌ای که می‌گوید وقت تعویض لاستیک رسیده است.',
    cover: '/images/blog/blog-1.jpg', read_time: 6,
    content: `<p>لاستیک تنها نقطه تماس خودرو با جاده است؛ بنابراین سلامت آن مستقیماً روی ایمنی شما اثر می‌گذارد. بسیاری از رانندگان تنها زمانی به فکر تعویض لاستیک می‌افتند که باد لاستیک خوابیده یا فرمان کشیده شود، در حالی که نشانه‌های زودتر و ظریف‌تری هم وجود دارد.</p>
<h2>۱. عمق آج کمتر از ۱.۶ میلی‌متر</h2><p>حد قانونی عمق آج ۱.۶ میلی‌متر است، اما کارشناسان توصیه می‌کنند در عمق ۳ میلی‌متر برنامه تعویض را شروع کنید. با یک سکه می‌توانید عمق آج را تخمین بزنید: اگر لبه سکه روی زبانه‌های آج شناور باشد، زمان تعویض فرا رسیده است.</p>
<h2>۲. ترک‌های ریز و خشکی دیواره</h2><p>قرار گرفتن طولانی در آفتاب و استفاده از مواد شوینده نامناسب باعث خشکی و ترک دیواره لاستیک می‌شود. ترک‌های ریز سطحی خطر جدی نیستند اما اگر ترک عمیق دیدید، لاستیک باید فوراً تعویض شود.</p>
<h2>۳. تاریخ تولید بالای ۵ سال</h2><p>حتی لاستیک کم‌کارکرد هم با گذشت زمان سخت و بی‌کشش می‌شود. تاریخ تولید روی دیواره لاستیک (چهار رقم هفته و سال) را بررسی کنید؛ لاستیک بالای پنج سال حتی با آج سالم توصیه نمی‌شود.</p>
<h2>۴. لرزش و صدای غیرعادی</h2><p>لرزش فرمان در سرعت‌های بالا یا صدای زوزه ممکن است نشانه نامیزانی، تاب برداشتن رینگ یا سایش نامتقارن باشد. در لیفت تایر این موارد در سرویس نصب رایگان بررسی می‌شود.</p>`,
  },
  {
    slug: 'how-to-read-tire-size', title: 'خواندن سایز لاستیک در ۳ دقیقه', tag: 'آموزش',
    excerpt: '۲۰۵/۵۵ R16 یعنی چه؟ راهنمای کامل اعداد روی دیواره لاستیک، شاخص بار و شاخص سرعت.',
    cover: '/images/blog/blog-2.jpg', read_time: 4,
    content: `<p>روی دیواره هر لاستیک مجموعه‌ای از اعداد و حروف حک شده است. با دانستن معنی آن‌ها می‌توانید دقیقاً همان لاستیکی را بخرید که خودروساز برای خودروی شما در نظر گرفته است.</p>
<h2>عدد اول: عرض مقطع</h2><p>در سایز 205/55 R16 عدد ۲۰۵ عرض مقطع لاستیک بر حسب میلی‌متر است.</p>
<h2>عدد دوم: نسبت منظر</h2><p>عدد ۵۵ نشان می‌دهد ارتفاع دیواره ۵۵ درصد عرض مقطع است (حدود ۱۱۲ میلی‌متر). عدد کمتر یعنی لاستیک پهن‌تر و اسپرت‌تر.</p>
<h2>R و قطر رینگ</h2><p>حرف R ساختار رادیال و عدد ۱۶ قطر رینگ بر حسب اینچ است.</p>
<h2>شاخص بار و سرعت</h2><p>مثلاً ۹۴V یعنی حداکثر بار ۶۷۰ کیلوگرم برای هر لاستیک و حداکثر سرعت ۲۴۰ کیلومتر بر ساعت.</p>`,
  },
  {
    slug: 'summer-or-all-season', title: 'تابستانی یا چهارفصل؟ انتخاب درست برای آب‌وهوای ایران', tag: 'راهنمای خرید',
    excerpt: 'در بیشتر شهرهای ایران لاستیک چهارفصل انتخاب منطقی است؛ اما برای مسیرهای برفی و کویری چه؟',
    cover: '/images/blog/blog-3.jpg', read_time: 5,
    content: `<p>انتخاب بین لاستیک تابستانی و چهارفصل به سه عامل بستگی دارد: دمای میانگین شهر شما، میزان بارش برف و سبک رانندگی.</p>
<h2>لاستیک تابستانی</h2><p>ترکیب لاستیکی سخت‌تر و آج با کانال‌های تخلیه آب زیاد؛ در دمای بالای ۷ درجه بهترین چسبندگی و کمترین فاصله ترمز را می‌دهد. برای شهرهای گرم و رانندگی شهری مناسب است.</p>
<h2>لاستیک چهارفصل</h2><p>ترکیبی متعادل با آج‌های ریز شیار برای بارش‌های سبک. برای اکثر رانندگان ایرانی که سالی چند بار با باران و یخبندان روبه‌رو می‌شوند، گزینه منطقی و اقتصادی است.</p>
<h2>لاستیک زمستانی</h2><p>ترکیب نرم و آج عمیق با لایه‌های سیفونی برای برف و یخ. در سفرهای زمستانی به مناطق کوهستانی حتماً از این نوع استفاده کنید.</p>`,
  },
];

const settings = {
  site_name: 'لیفت تایر',
  site_name_en: 'Lift Tire',
  tagline: 'لاستیک اصل، ایمنی واقعی',
  tagline_en: 'LIFT TIRE — GRIP THE ROAD',
  phone: '021-91001234',
  mobile: '0912-123-4567',
  email: 'info@lift-tire.com',
  address: 'تهران، بزرگراه شهید همت، مجتمع تجاری لاستیک، پلاک ۱۲',
  work_hours: 'شنبه تا پنجشنبه ۹ تا ۱۹',
  instagram: 'https://instagram.com/lifttire',
  telegram: 'https://t.me/lifttire',
  whatsapp: 'https://wa.me/989121234567',
  footer_text: 'لیفت تایر از سال ۱۳۸۴ با تمرکز بر فروش لاستیک اصل و مشاوره تخصصی، همراه رانندگان ایرانی است. ارسال به سراسر ایران با باربری و پست پیشتاز.',
  meta_description: 'فروشگاه اینترنتی لیفت تایر؛ خرید لاستیک اصل خودرو با ضمانت اصالت، ارسال به سراسر ایران و مشاوره تخصصی رایگان.',
  shipping: [
    { id: 'freight', title: 'باربری (سراسر ایران)', cost: 180000, days: '۳ تا ۵ روز کاری' },
    { id: 'post', title: 'پست پیشتاز', cost: 95000, days: '۲ تا ۴ روز کاری' },
    { id: 'courier', title: 'پیک تهران', cost: 120000, days: 'همان روز' },
  ],
  services: [
    { title: 'ارسال به سراسر ایران', desc: 'باربری و پست پیشتاز', icon: '/images/icons/service-shipping.png' },
    { title: 'ضمانت اصالت و تاریخ تولید', desc: 'لاستیک با گارانتی کتبی', icon: '/images/icons/service-authentic.png' },
    { title: 'پرداخت امن', desc: 'درگاه بانکی و پرداخت در محل', icon: '/images/icons/service-payment.png' },
    { title: 'مشاوره تخصصی لاستیک', desc: 'کارشناس رایگان سایز و برند', icon: '/images/icons/service-consult.png' },
    { title: '۷ روز ضمانت بازگشت', desc: 'بدون قید و شرط', icon: '/images/icons/service-return.png' },
  ],
  social: [
    { id: 'instagram', title: 'اینستاگرام', url: 'https://instagram.com/lifttire', icon: '/images/social/instagram.png' },
    { id: 'telegram', title: 'تلگرام', url: 'https://t.me/lifttire', icon: '/images/social/telegram.png' },
    { id: 'whatsapp', title: 'واتساپ', url: 'https://wa.me/989121234567', icon: '/images/social/whatsapp.png' },
  ],
  stats: [
    { value: 4000, suffix: '+', label: 'مشتری راضی' },
    { value: 20, suffix: '', label: 'سال تجربه' },
    { value: 12000, suffix: '+', label: 'لاستیک فروخته‌شده' },
    { value: 10, suffix: '', label: 'برند معتبر' },
  ],
};

function specsFor(p) {
  const [name, brand, cat, w, r, rim, price, , , season, extra] = p;
  const brandName = brands.find((b) => b.slug === brand)?.name_fa || '';
  const label = cat === 'rim' ? 'رینگ' : cat === 'accessories' ? 'لوازم جانبی' : 'لاستیک';
  const specs = [
    { label: 'برند', value: brandName },
    { label: 'مدل / الگو', value: name.replace(brandName, '').trim() },
  ];
  if (cat !== 'accessories') {
    specs.push(
      { label: 'سایز', value: cat === 'rim' ? `${rim} اینچ` : `${w}/${r} R${rim}` },
      { label: 'عرض مقطع', value: `${w} میلی‌متر` },
      { label: 'نسبت منظر', value: r ? `${r}٪` : '-' },
      { label: 'قطر رینگ', value: `${rim} اینچ` },
      { label: 'شاخص بار', value: `${86 + (rim % 5) * 2}` },
      { label: 'شاخص سرعت', value: season === 'تابستانی' ? 'V (۲۴۰ km/h)' : 'H (۲۱۰ km/h)' },
      { label: 'نوع فصل', value: season },
      { label: 'ساخت کشور', value: extra.country },
      { label: 'سال تولید', value: String(extra.made_year) },
      { label: 'گارانتی', value: '۱۸ ماه ضمانت اصالت لیفت تایر' },
      { label: 'عمق آج', value: '۷.۸ میلی‌متر' },
      { label: 'برچسب مصرف سوخت', value: 'B' },
      { label: 'چسبندگی در خیس', value: 'A' },
      { label: 'صدای عبور', value: '۷۱ دسی‌بل' },
      { label: 'خودروهای سازگار', value: 'سمند، پژو ۲۰۶، دنا، تیبا، کوییک، ساینا' },
      { label: 'وزن', value: '۹.۲ کیلوگرم' },
    );
  } else {
    specs.push({ label: 'نوع', value: 'لوازم جانبی لاستیک' }, { label: 'گارانتی', value: '۷ روز ضمانت بازگشت' });
  }
  return specs;
}

async function run() {
  await db.init();
  const force = process.argv.includes('--force');
  const existing = await one('SELECT COUNT(*)::int AS c FROM products');
  if (existing.c > 0 && !force) {
    console.log(`ℹ️  داده دمو از قبل موجود است (${existing.c} محصول). برای بازسازی: npm run seed -- --force`);
    return;
  }
  if (force) {
    for (const t of ['order_items', 'orders', 'wishlist', 'reviews', 'product_specs', 'product_images', 'products',
      'categories', 'brands', 'coupons', 'posts', 'banners', 'subscribers', 'contact_messages', 'addresses', 'customers', 'admins']) {
      await query(`DELETE FROM ${t}`);
    }
  }

  // admin
  await query(
    'INSERT INTO admins (email, name, password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO UPDATE SET password_hash = $3',
    [process.env.ADMIN_EMAIL || 'admin@lift-tire.com', 'مدیر لیفت تایر', hash(process.env.ADMIN_PASSWORD || 'Lift@12345')],
  );

  // demo customer
  const cust = await one(
    `INSERT INTO customers (phone, name, email, password_hash) VALUES ($1,$2,$3,$4)
     ON CONFLICT (phone) DO UPDATE SET name = $2 RETURNING id`,
    ['09121234567', 'کاربر دمو', 'demo@lift-tire.com', hash('test1234')],
  );
  await query(
    `INSERT INTO addresses (customer_id, title, province, city, address, postal_code, receiver, phone, is_default)
     SELECT $1,'خانه','تهران','تهران','خیابان ولیعصر، کوچه بهار، پلاک ۱۲، واحد ۳','1968753141','کاربر دمو','09121234567',true
     WHERE NOT EXISTS (SELECT 1 FROM addresses WHERE customer_id = $1)`,
    [cust.id],
  );

  // categories
  const catIds = {};
  for (const c of categories) {
    const row = await one(
      'INSERT INTO categories (slug, name, image, description, sort, is_active) VALUES ($1,$2,$3,$4,$5,true) RETURNING id',
      [c.slug, c.name, c.image, c.description, c.sort],
    );
    catIds[c.slug] = row.id;
  }

  // brands
  const brandIds = {};
  for (const b of brands) {
    const row = await one(
      `INSERT INTO brands (slug, name_fa, name_en, logo, cover, description, sort, is_active, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8) RETURNING id`,
      [b.slug, b.name_fa, b.name_en, `/images/brands/${b.slug}.png`, `/images/brands/${b.slug}-cover.jpg`, `${b.name_fa} (${b.name_en}) از برندهای معتبر لاستیک با گارانتی اصالت در لیفت تایر.`, b.sort, b.featured],
    );
    brandIds[b.slug] = row.id;
  }

  // products
  let i = 0;
  for (const p of products) {
    i++;
    const [name, brand, cat, w, r, rim, price, old, stock, season, extra] = p;
    const size = cat === 'accessories' ? `${rim} اینچ` : cat === 'rim' ? `${rim} اینچ` : `${w}/${r} R${rim}`;
    const slug = 'tire-' + String(i).padStart(2, '0');
    const row = await one(
      `INSERT INTO products (slug, name, brand_id, category_id, width, ratio, rim, size, season, price, old_price, stock, sku,
        rating, rating_count, sold_count, is_active, is_featured, badge, country, made_year, warranty, tread_depth,
        fuel_label, wet_grip, noise, weight, compatible_cars, short_desc, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
       RETURNING id`,
      [slug, name, brandIds[brand], catIds[cat], w, r, rim, size, season, price, old, stock, `LT-${1000 + i}`,
        (4.2 + ((i * 7) % 8) / 10).toFixed(2), 12 + ((i * 13) % 90), 30 + ((i * 37) % 420), !!extra.featured,
        extra.badge || null, extra.country, extra.made_year, '۱۸ ماه ضمانت اصالت', '۷.۸ میلی‌متر', 'B', 'A', '۷۱ دسی‌بل',
        '۹.۲ کیلوگرم', 'سمند، پژو ۲۰۶، دنا، تیبا، کوییک، ساینا',
        `${name} با سایز ${size}، ${season}، ساخت ${extra.country} و گارانتی اصالت لیفت تایر.`,
        `<p>${name} یکی از انتخاب‌های محبوب در دسته ${categories.find((c) => c.slug === cat)?.name} است. این ${cat === 'rim' ? 'رینگ' : cat === 'accessories' ? 'محصول' : 'لاستیک'} با سایز <strong>${size}</strong> و ساخت ${extra.country} در سال ${extra.made_year}، تعادل خوبی بین دوام، چسبندگی و راحتی سواری ارائه می‌دهد.</p>
<p>تمام محصولات لیفت تایر با ضمانت اصالت و تاریخ تولید ارائه می‌شوند. برای اطمینان از انتخاب درست، کارشناسان ما آماده مشاوره رایگان هستند.</p>`,
      ],
    );
    const imgs = [extra.img, IMG.tread];
    for (let k = 0; k < imgs.length; k++) {
      await query('INSERT INTO product_images (product_id, url, sort) VALUES ($1,$2,$3)', [row.id, imgs[k], k]);
    }
    const specs = specsFor(p);
    for (let k = 0; k < specs.length; k++) {
      await query('INSERT INTO product_specs (product_id, label, value, sort) VALUES ($1,$2,$3,$4)', [row.id, specs[k].label, specs[k].value, k]);
    }
  }

  // banners
  const heroBanners = [
    {
      title: 'لاستیک اصل، ایمنی واقعی', subtitle: 'مجموعه‌ای از معتبرترین برندهای جهان با ضمانت اصالت و تاریخ تولید',
      badge: 'فروشگاه تخصصی لاستیک لیفت تایر', image: '/images/hero/hero-1.jpg', link: '/products',
      cta_text: 'مشاهده محصولات', stat1_value: '۴۰۰۰+', stat1_label: 'مشتری راضی', stat2_value: '۲۰', stat2_label: 'سال تجربه', sort: 1,
    },
    {
      title: 'فرمان را بسپار به آج', subtitle: 'لاستیک‌های اسپرت و پرفورمنس با چسبندگی بالا برای رانندگی مطمئن',
      badge: 'پیشنهاد ویژه ماه', image: '/images/hero/hero-2.jpg', link: '/products?season=تابستانی',
      cta_text: 'خرید لاستیک اسپرت', stat1_value: '۱۰', stat1_label: 'برند معتبر', stat2_value: '۱۲۰۰۰+', stat2_label: 'لاستیک فروخته‌شده', sort: 2,
    },
    {
      title: 'برای جاده‌های سخت ساخته شده', subtitle: 'لاستیک آفرود و شاسی‌بلند با دنده‌های درشت و مقاومت بالا در مسیرهای ناهموار',
      badge: 'دسته آفرود و شاسی‌بلند', image: '/images/hero/hero-3.jpg', link: '/category/offroad',
      cta_text: 'مشاهده لاستیک آفرود', stat1_value: '۷ روز', stat1_label: 'ضمانت بازگشت', stat2_value: '۱۹۲', stat2_label: 'سایز موجود', sort: 3,
    },
  ];
  for (const b of heroBanners) {
    await query(
      `INSERT INTO banners (title, subtitle, badge, image, link, cta_text, placement, stat1_value, stat1_label, stat2_value,
        stat2_label, sort, is_active) VALUES ($1,$2,$3,$4,$5,$6,'hero',$7,$8,$9,$10,$11,true)`,
      [b.title, b.subtitle, b.badge, b.image, b.link, b.cta_text, b.stat1_value, b.stat1_label, b.stat2_value, b.stat2_label, b.sort],
    );
  }
  await query(
    `INSERT INTO banners (title, subtitle, image, link, cta_text, placement, sort, is_active)
     VALUES ($1,$2,$3,$4,$5,'category',1,true)`,
    ['لاستیک سواری شهری', 'نرم، بی‌صدا و کم‌مصرف', '/images/banners/category-passenger.jpg', '/category/passenger', 'خرید لاستیک سواری'],
  );
  await query(
    `INSERT INTO banners (title, subtitle, image, link, cta_text, placement, sort, is_active)
     VALUES ($1,$2,$3,$4,$5,'category',2,true)`,
    ['آفرود و شاسی‌بلند', 'آماده هر مسیر و هر زمین', '/images/banners/category-offroad.jpg', '/category/offroad', 'خرید لاستیک آفرود'],
  );
  await query(
    `INSERT INTO banners (title, subtitle, image, link, cta_text, placement, sort, is_active)
     VALUES ($1,$2,$3,$4,$5,'strip',1,true)`,
    ['تخفیف ویژه لاستیک‌های اسپرت', 'تا ۲۰ درصد تخفیف روی برندهای منتخب', '/images/banners/strip-offer.jpg', '/products?on_sale=1', 'مشاهده پیشنهادها'],
  );

  // posts
  for (const p of posts) {
    await query(
      `INSERT INTO posts (slug, title, excerpt, content, cover, author, tag, read_time, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
      [p.slug, p.title, p.excerpt, p.content, p.cover, 'تیم محتوای لیفت تایر', p.tag, p.read_time],
    );
  }

  // coupons
  await query(
    `INSERT INTO coupons (code, type, value, min_subtotal, max_discount, usage_limit, expires_at, is_active)
     VALUES ('LIFT10','percent',10,3000000,1500000,500, now() + interval '180 days', true)`,
  );
  await query(
    `INSERT INTO coupons (code, type, value, min_subtotal, max_discount, usage_limit, expires_at, is_active)
     VALUES ('FREESHIP','shipping',0,0,null,500, now() + interval '180 days', true)`,
  );

  // reviews (approved)
  const prods = await many('SELECT id FROM products ORDER BY id LIMIT 4');
  const demos = [
    { name: 'مهدی رضایی', rating: 5, comment: 'لاستیک کاملاً اصل بود و تاریخ تولید ۱۴۰۳ داشت. بسته‌بندی و ارسال هم عالی.' },
    { name: 'سارا محمدی', rating: 4, comment: 'کیفیت خوبی داره، صدای جاده کمتر شد. فقط ارسال یک روز دیرتر رسید.' },
    { name: 'امیر کاظمی', rating: 5, comment: 'مشاوره سایز خیلی کمک کرد، دقیقاً مناسب پراید ۱۳۱ خریدم.' },
    { name: 'نگار احمدی', rating: 5, comment: 'برای مسیرهای آفرود عالیه، گِل‌آج درست عمل می‌کنه.' },
  ];
  for (let k = 0; k < prods.length; k++) {
    await query(
      'INSERT INTO reviews (product_id, customer_id, name, phone, rating, comment, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [prods[k].id, k === 0 ? cust.id : null, demos[k].name, '0912000000' + k, demos[k].rating, demos[k].comment, 'approved'],
    );
  }
  await query(
    'INSERT INTO reviews (product_id, name, phone, rating, comment, status) VALUES ($1,$2,$3,$4,$5,$6)',
    [prods[0].id, 'کاربر جدید', '09129999999', 4, 'درخواست قیمت برای خرید عمده دارم.', 'pending'],
  );

  // settings
  for (const [key, value] of Object.entries(settings)) {
    await query(
      'INSERT INTO settings (key, value) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb',
      [key, JSON.stringify(value)],
    );
  }

  const counts = await many(`SELECT 'products' AS t, COUNT(*)::int AS c FROM products UNION ALL
    SELECT 'brands', COUNT(*)::int FROM brands UNION ALL SELECT 'categories', COUNT(*)::int FROM categories UNION ALL
    SELECT 'banners', COUNT(*)::int FROM banners UNION ALL SELECT 'posts', COUNT(*)::int FROM posts`);
  console.log('✅ داده دمو آماده شد:', counts.map((r) => `${r.t}=${r.c}`).join(' · '));
  console.log('   ادمین: admin@lift-tire.com / Lift@12345');
  console.log('   مشتری: 09121234567 / test1234');
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
