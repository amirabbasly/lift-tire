import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { many, one, query } from '../db.js';
import { fail, ok, toInt, toBool, str, slugify, paginate } from '../helpers.js';
import { compare, hash, requireAdmin, signToken } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'));
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      const e = new Error('فقط تصاویر jpg، png و webp مجاز هستند.');
      e.publicMessage = e.message;
      e.status = 415;
      return cb(e);
    }
    cb(null, true);
  },
});

const router = Router();

/* ---------------------------------- auth ---------------------------------- */
router.post('/login', async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  const password = str(req.body.password);
  if (!email || !password) return fail(res, 'ایمیل و رمز عبور را وارد کنید.');
  const admin = await one('SELECT * FROM admins WHERE LOWER(email) = $1', [email]);
  if (!admin || !compare(password, admin.password_hash)) return fail(res, 'ایمیل یا رمز عبور نادرست است.', 401);
  const token = signToken({ id: admin.id, role: 'admin', email: admin.email });
  ok(res, { token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

router.get('/me', requireAdmin, async (req, res) => ok(res, req.admin));

router.use(requireAdmin);

/* --------------------------------- upload --------------------------------- */
router.post('/upload', upload.array('files', 10), (req, res) => {
  const files = req.files || [];
  if (!files.length) return fail(res, 'فایلی انتخاب نشده است.');
  ok(res, { files: files.map((f) => ({ url: `/uploads/${f.filename}`, name: f.originalname, size: f.size })) }, 201);
});

/* -------------------------------- dashboard ------------------------------- */
router.get('/dashboard', async (_req, res) => {
  const [totals, revenue, byStatus, top, recent, daily, customersCount, messages] = await Promise.all([
    one('SELECT COUNT(*)::int AS c FROM orders'),
    one("SELECT COALESCE(SUM(total),0)::int AS s FROM orders WHERE status NOT IN ('cancelled')"),
    many('SELECT status, COUNT(*)::int AS c FROM orders GROUP BY status'),
    many(`SELECT oi.name, oi.size, SUM(oi.qty)::int AS qty, SUM(oi.qty * oi.price)::int AS revenue
          FROM order_items oi GROUP BY oi.name, oi.size ORDER BY qty DESC LIMIT 5`),
    many('SELECT id, code, customer_name, phone, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 6'),
    many(`SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COALESCE(SUM(total),0)::int AS total
          FROM orders WHERE created_at > now() - interval '14 days' GROUP BY day ORDER BY day`),
    one('SELECT COUNT(*)::int AS c FROM customers'),
    one('SELECT COUNT(*)::int AS c FROM contact_messages WHERE is_read = false'),
  ]);
  const [productsCount, lowStock, pendingReviews] = await Promise.all([
    one('SELECT COUNT(*)::int AS c FROM products'),
    many('SELECT id, name, stock, size FROM products WHERE stock <= 2 ORDER BY stock ASC LIMIT 5'),
    one("SELECT COUNT(*)::int AS c FROM reviews WHERE status = 'pending'"),
  ]);
  ok(res, {
    total_orders: totals.c,
    total_revenue: revenue.s,
    total_customers: customersCount.c,
    total_products: productsCount.c,
    unread_messages: messages.c,
    pending_reviews: pendingReviews.c,
    by_status: byStatus,
    top_products: top,
    recent_orders: recent,
    daily,
    low_stock: lowStock,
  });
});

/* --------------------------------- products ------------------------------- */
async function fullProduct(id) {
  const row = await one('SELECT * FROM products WHERE id = $1', [id]);
  if (!row) return null;
  row.images = await many('SELECT id, url, alt, sort FROM product_images WHERE product_id = $1 ORDER BY sort, id', [id]);
  row.specs = await many('SELECT id, label, value, sort FROM product_specs WHERE product_id = $1 ORDER BY sort, id', [id]);
  return row;
}

router.get('/products', async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const where = [];
  const params = [];
  const push = (v) => { params.push(v); return `$${params.length}`; };
  if (req.query.q) {
    const t = push(`%${str(req.query.q)}%`);
    where.push(`(p.name ILIKE ${t} OR p.slug ILIKE ${t} OR p.size ILIKE ${t})`);
  }
  if (req.query.active === 'true') where.push('p.is_active = true');
  if (req.query.active === 'false') where.push('p.is_active = false');
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = await one(`SELECT COUNT(*)::int AS c FROM products p ${w}`, params);
  const rows = await many(
    `SELECT p.*, b.name_fa AS brand_name,
      (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort, id LIMIT 1) AS image
     FROM products p LEFT JOIN brands b ON b.id = p.brand_id ${w}
     ORDER BY p.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );
  ok(res, { items: rows, total: total.c, page, limit, pages: Math.max(1, Math.ceil(total.c / limit)) });
});

router.get('/products/:id', async (req, res) => {
  const p = await fullProduct(toInt(req.params.id));
  if (!p) return fail(res, 'محصول یافت نشد.', 404);
  ok(res, p);
});

function productPayload(b) {
  return {
    name: str(b.name),
    slug: str(b.slug) || slugify(b.name),
    brand_id: toInt(b.brand_id),
    category_id: toInt(b.category_id),
    width: toInt(b.width),
    ratio: toInt(b.ratio),
    rim: toInt(b.rim),
    size: str(b.size) || (b.width && b.ratio && b.rim ? `${b.width}/${b.ratio} R${b.rim}` : ''),
    season: str(b.season) || 'چهارفصل',
    price: toInt(b.price, 0),
    old_price: toInt(b.old_price),
    stock: toInt(b.stock, 0),
    sku: str(b.sku) || `LT-${Date.now().toString().slice(-6)}`,
    rating: Number(b.rating || 4.5),
    rating_count: toInt(b.rating_count, 0),
    sold_count: toInt(b.sold_count, 0),
    is_active: b.is_active === undefined ? true : toBool(b.is_active),
    is_featured: toBool(b.is_featured),
    badge: str(b.badge) || null,
    country: str(b.country),
    made_year: toInt(b.made_year),
    warranty: str(b.warranty),
    tread_depth: str(b.tread_depth),
    fuel_label: str(b.fuel_label),
    wet_grip: str(b.wet_grip),
    noise: str(b.noise),
    weight: str(b.weight),
    compatible_cars: str(b.compatible_cars),
    short_desc: str(b.short_desc),
    description: str(b.description),
  };
}

async function saveImages(productId, images) {
  await query('DELETE FROM product_images WHERE product_id = $1', [productId]);
  const list = Array.isArray(images) ? images.filter((u) => str(u)) : [];
  for (let i = 0; i < list.length; i++) {
    await query('INSERT INTO product_images (product_id, url, sort) VALUES ($1,$2,$3)', [productId, str(list[i]), i]);
  }
}
async function saveSpecs(productId, specs) {
  await query('DELETE FROM product_specs WHERE product_id = $1', [productId]);
  const list = Array.isArray(specs) ? specs.filter((s) => s && str(s.label) && str(s.value)) : [];
  for (let i = 0; i < list.length; i++) {
    await query('INSERT INTO product_specs (product_id, label, value, sort) VALUES ($1,$2,$3,$4)', [
      productId, str(list[i].label), str(list[i].value), i,
    ]);
  }
}

router.post('/products', async (req, res) => {
  const b = req.body || {};
  if (str(b.name).length < 3) return fail(res, 'نام محصول حداقل ۳ کاراکتر باشد.');
  if (toInt(b.price, 0) <= 0) return fail(res, 'قیمت محصول را وارد کنید.');
  if (!toInt(b.category_id)) return fail(res, 'دسته‌بندی محصول را انتخاب کنید.');
  const d = productPayload(b);
  let slug = d.slug;
  let n = 1;
  while (await one('SELECT id FROM products WHERE slug = $1', [slug])) slug = `${d.slug}-${++n}`;
  const row = await one(
    `INSERT INTO products (name, slug, brand_id, category_id, width, ratio, rim, size, season, price, old_price, stock, sku,
      rating, rating_count, sold_count, is_active, is_featured, badge, country, made_year, warranty, tread_depth, fuel_label,
      wet_grip, noise, weight, compatible_cars, short_desc, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
     RETURNING *`,
    [d.name, slug, d.brand_id, d.category_id, d.width, d.ratio, d.rim, d.size, d.season, d.price, d.old_price, d.stock, d.sku,
      d.rating, d.rating_count, d.sold_count, d.is_active, d.is_featured, d.badge, d.country, d.made_year, d.warranty,
      d.tread_depth, d.fuel_label, d.wet_grip, d.noise, d.weight, d.compatible_cars, d.short_desc, d.description],
  );
  await saveImages(row.id, b.images);
  await saveSpecs(row.id, b.specs);
  ok(res, await fullProduct(row.id), 201);
});

router.put('/products/:id', async (req, res) => {
  const id = toInt(req.params.id);
  const existing = await one('SELECT * FROM products WHERE id = $1', [id]);
  if (!existing) return fail(res, 'محصول یافت نشد.', 404);
  const b = req.body || {};
  if (str(b.name).length < 3) return fail(res, 'نام محصول حداقل ۳ کاراکتر باشد.');
  if (toInt(b.price, 0) <= 0) return fail(res, 'قیمت محصول را وارد کنید.');
  const d = productPayload(b);
  await query(
    `UPDATE products SET name=$1, slug=$2, brand_id=$3, category_id=$4, width=$5, ratio=$6, rim=$7, size=$8, season=$9,
      price=$10, old_price=$11, stock=$12, sku=$13, rating=$14, rating_count=$15, sold_count=$16, is_active=$17,
      is_featured=$18, badge=$19, country=$20, made_year=$21, warranty=$22, tread_depth=$23, fuel_label=$24, wet_grip=$25,
      noise=$26, weight=$27, compatible_cars=$28, short_desc=$29, description=$30 WHERE id=$31`,
    [d.name, d.slug || existing.slug, d.brand_id, d.category_id, d.width, d.ratio, d.rim, d.size, d.season, d.price,
      d.old_price, d.stock, d.sku, d.rating, d.rating_count, d.sold_count, d.is_active, d.is_featured, d.badge, d.country,
      d.made_year, d.warranty, d.tread_depth, d.fuel_label, d.wet_grip, d.noise, d.weight, d.compatible_cars, d.short_desc,
      d.description, id],
  );
  if (b.images !== undefined) await saveImages(id, b.images);
  if (b.specs !== undefined) await saveSpecs(id, b.specs);
  ok(res, await fullProduct(id));
});

router.delete('/products/:id', async (req, res) => {
  const id = toInt(req.params.id);
  const r = await query('DELETE FROM products WHERE id = $1', [id]);
  if (!r.rowCount) return fail(res, 'محصول یافت نشد.', 404);
  ok(res, { message: 'محصول حذف شد.' });
});

/* -------------------------------- categories ------------------------------ */
router.get('/categories', async (_req, res) => {
  ok(res, await many('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id)::int AS product_count FROM categories c ORDER BY c.sort, c.id'));
});
router.post('/categories', async (req, res) => {
  const b = req.body || {};
  if (str(b.name).length < 2) return fail(res, 'نام دسته‌بندی را وارد کنید.');
  const slug = str(b.slug) || slugify(b.name);
  const row = await one(
    'INSERT INTO categories (slug, name, parent_id, image, description, sort, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [slug, str(b.name), toInt(b.parent_id), str(b.image) || null, str(b.description), toInt(b.sort, 0), b.is_active === undefined ? true : toBool(b.is_active)],
  );
  ok(res, row, 201);
});
router.put('/categories/:id', async (req, res) => {
  const b = req.body || {};
  if (str(b.name).length < 2) return fail(res, 'نام دسته‌بندی را وارد کنید.');
  const row = await one(
    'UPDATE categories SET slug=$1, name=$2, parent_id=$3, image=$4, description=$5, sort=$6, is_active=$7 WHERE id=$8 RETURNING *',
    [str(b.slug) || slugify(b.name), str(b.name), toInt(b.parent_id), str(b.image) || null, str(b.description), toInt(b.sort, 0),
      b.is_active === undefined ? true : toBool(b.is_active), toInt(req.params.id)],
  );
  if (!row) return fail(res, 'دسته‌بندی یافت نشد.', 404);
  ok(res, row);
});
router.delete('/categories/:id', async (req, res) => {
  const r = await query('DELETE FROM categories WHERE id = $1', [toInt(req.params.id)]);
  if (!r.rowCount) return fail(res, 'دسته‌بندی یافت نشد.', 404);
  ok(res, { message: 'دسته‌بندی حذف شد.' });
});

/* ---------------------------------- brands -------------------------------- */
router.get('/brands', async (_req, res) => ok(res, await many('SELECT * FROM brands ORDER BY sort, id')));
router.post('/brands', async (req, res) => {
  const b = req.body || {};
  if (str(b.name_fa).length < 2 || str(b.name_en).length < 2) return fail(res, 'نام فارسی و لاتین برند الزامی است.');
  const row = await one(
    `INSERT INTO brands (slug, name_fa, name_en, logo, cover, description, sort, is_active, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [str(b.slug) || slugify(b.name_en), str(b.name_fa), str(b.name_en), str(b.logo) || null, str(b.cover) || null,
      str(b.description), toInt(b.sort, 0), b.is_active === undefined ? true : toBool(b.is_active), toBool(b.is_featured)],
  );
  ok(res, row, 201);
});
router.put('/brands/:id', async (req, res) => {
  const b = req.body || {};
  if (str(b.name_fa).length < 2 || str(b.name_en).length < 2) return fail(res, 'نام فارسی و لاتین برند الزامی است.');
  const row = await one(
    `UPDATE brands SET slug=$1, name_fa=$2, name_en=$3, logo=$4, cover=$5, description=$6, sort=$7, is_active=$8, is_featured=$9
     WHERE id=$10 RETURNING *`,
    [str(b.slug) || slugify(b.name_en), str(b.name_fa), str(b.name_en), str(b.logo) || null, str(b.cover) || null,
      str(b.description), toInt(b.sort, 0), b.is_active === undefined ? true : toBool(b.is_active), toBool(b.is_featured), toInt(req.params.id)],
  );
  if (!row) return fail(res, 'برند یافت نشد.', 404);
  ok(res, row);
});
router.delete('/brands/:id', async (req, res) => {
  const r = await query('DELETE FROM brands WHERE id = $1', [toInt(req.params.id)]);
  if (!r.rowCount) return fail(res, 'برند یافت نشد.', 404);
  ok(res, { message: 'برند حذف شد.' });
});

/* ---------------------------------- banners -------------------------------- */
router.get('/banners', async (_req, res) => ok(res, await many('SELECT * FROM banners ORDER BY placement, sort, id')));
router.post('/banners', async (req, res) => {
  const b = req.body || {};
  if (!str(b.image)) return fail(res, 'تصویر بنر را آپلود کنید.');
  const row = await one(
    `INSERT INTO banners (title, subtitle, badge, image, mobile_image, link, cta_text, placement, stat1_value, stat1_label,
      stat2_value, stat2_label, sort, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [str(b.title), str(b.subtitle), str(b.badge), str(b.image), str(b.mobile_image) || null, str(b.link) || '/products',
      str(b.cta_text) || 'مشاهده محصولات', str(b.placement) || 'hero', str(b.stat1_value), str(b.stat1_label),
      str(b.stat2_value), str(b.stat2_label), toInt(b.sort, 0), b.is_active === undefined ? true : toBool(b.is_active)],
  );
  ok(res, row, 201);
});
router.put('/banners/:id', async (req, res) => {
  const b = req.body || {};
  if (!str(b.image)) return fail(res, 'تصویر بنر را آپلود کنید.');
  const row = await one(
    `UPDATE banners SET title=$1, subtitle=$2, badge=$3, image=$4, mobile_image=$5, link=$6, cta_text=$7, placement=$8,
      stat1_value=$9, stat1_label=$10, stat2_value=$11, stat2_label=$12, sort=$13, is_active=$14 WHERE id=$15 RETURNING *`,
    [str(b.title), str(b.subtitle), str(b.badge), str(b.image), str(b.mobile_image) || null, str(b.link) || '/products',
      str(b.cta_text) || 'مشاهده محصولات', str(b.placement) || 'hero', str(b.stat1_value), str(b.stat1_label),
      str(b.stat2_value), str(b.stat2_label), toInt(b.sort, 0), b.is_active === undefined ? true : toBool(b.is_active), toInt(req.params.id)],
  );
  if (!row) return fail(res, 'بنر یافت نشد.', 404);
  ok(res, row);
});
router.delete('/banners/:id', async (req, res) => {
  const r = await query('DELETE FROM banners WHERE id = $1', [toInt(req.params.id)]);
  if (!r.rowCount) return fail(res, 'بنر یافت نشد.', 404);
  ok(res, { message: 'بنر حذف شد.' });
});

/* ----------------------------------- posts --------------------------------- */
router.get('/posts', async (_req, res) => ok(res, await many('SELECT * FROM posts ORDER BY created_at DESC')));
router.post('/posts', async (req, res) => {
  const b = req.body || {};
  if (str(b.title).length < 5) return fail(res, 'عنوان مقاله حداقل ۵ کاراکتر باشد.');
  const row = await one(
    `INSERT INTO posts (slug, title, excerpt, content, cover, author, tag, read_time, is_published)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [str(b.slug) || slugify(b.title), str(b.title), str(b.excerpt), str(b.content), str(b.cover) || null,
      str(b.author) || 'تیم لیفت تایر', str(b.tag) || 'راهنمای خرید', toInt(b.read_time, 5), toBool(b.is_published)],
  );
  ok(res, row, 201);
});
router.put('/posts/:id', async (req, res) => {
  const b = req.body || {};
  if (str(b.title).length < 5) return fail(res, 'عنوان مقاله حداقل ۵ کاراکتر باشد.');
  const row = await one(
    `UPDATE posts SET slug=$1, title=$2, excerpt=$3, content=$4, cover=$5, author=$6, tag=$7, read_time=$8, is_published=$9
     WHERE id=$10 RETURNING *`,
    [str(b.slug) || slugify(b.title), str(b.title), str(b.excerpt), str(b.content), str(b.cover) || null,
      str(b.author) || 'تیم لیفت تایر', str(b.tag) || 'راهنمای خرید', toInt(b.read_time, 5), toBool(b.is_published), toInt(req.params.id)],
  );
  if (!row) return fail(res, 'مقاله یافت نشد.', 404);
  ok(res, row);
});
router.delete('/posts/:id', async (req, res) => {
  const r = await query('DELETE FROM posts WHERE id = $1', [toInt(req.params.id)]);
  if (!r.rowCount) return fail(res, 'مقاله یافت نشد.', 404);
  ok(res, { message: 'مقاله حذف شد.' });
});

/* ---------------------------------- coupons -------------------------------- */
router.get('/coupons', async (_req, res) => ok(res, await many('SELECT * FROM coupons ORDER BY id DESC')));
router.post('/coupons', async (req, res) => {
  const b = req.body || {};
  const code = str(b.code).toUpperCase();
  if (!code) return fail(res, 'کد تخفیف را وارد کنید.');
  if (await one('SELECT id FROM coupons WHERE UPPER(code) = $1', [code])) return fail(res, 'این کد تخفیف قبلاً ثبت شده است.');
  const row = await one(
    `INSERT INTO coupons (code, type, value, min_subtotal, max_discount, usage_limit, expires_at, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [code, str(b.type) || 'percent', toInt(b.value, 0), toInt(b.min_subtotal, 0), toInt(b.max_discount),
      toInt(b.usage_limit), str(b.expires_at) || null, b.is_active === undefined ? true : toBool(b.is_active)],
  );
  ok(res, row, 201);
});
router.put('/coupons/:id', async (req, res) => {
  const b = req.body || {};
  const row = await one(
    `UPDATE coupons SET code=$1, type=$2, value=$3, min_subtotal=$4, max_discount=$5, usage_limit=$6, expires_at=$7,
      is_active=$8 WHERE id=$9 RETURNING *`,
    [str(b.code).toUpperCase(), str(b.type) || 'percent', toInt(b.value, 0), toInt(b.min_subtotal, 0), toInt(b.max_discount),
      toInt(b.usage_limit), str(b.expires_at) || null, b.is_active === undefined ? true : toBool(b.is_active), toInt(req.params.id)],
  );
  if (!row) return fail(res, 'کد تخفیف یافت نشد.', 404);
  ok(res, row);
});
router.delete('/coupons/:id', async (req, res) => {
  const r = await query('DELETE FROM coupons WHERE id = $1', [toInt(req.params.id)]);
  if (!r.rowCount) return fail(res, 'کد تخفیف یافت نشد.', 404);
  ok(res, { message: 'کد تخفیف حذف شد.' });
});

/* ---------------------------------- reviews -------------------------------- */
router.get('/reviews', async (req, res) => {
  const status = str(req.query.status);
  const rows = status
    ? await many("SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status = $1 ORDER BY r.created_at DESC", [status])
    : await many('SELECT r.*, p.name AS product_name FROM reviews r LEFT JOIN products p ON p.id = r.product_id ORDER BY r.created_at DESC');
  ok(res, rows);
});
router.patch('/reviews/:id', async (req, res) => {
  const status = str(req.body.status);
  if (!['approved', 'rejected', 'pending'].includes(status)) return fail(res, 'وضعیت نظر نامعتبر است.');
  const row = await one('UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *', [status, toInt(req.params.id)]);
  if (!row) return fail(res, 'نظر یافت نشد.', 404);
  ok(res, row);
});
router.delete('/reviews/:id', async (req, res) => {
  const r = await query('DELETE FROM reviews WHERE id = $1', [toInt(req.params.id)]);
  if (!r.rowCount) return fail(res, 'نظر یافت نشد.', 404);
  ok(res, { message: 'نظر حذف شد.' });
});

/* ---------------------------------- orders --------------------------------- */
const STATUS_LABEL = {
  pending_payment: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
};

router.get('/orders', async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const where = [];
  const params = [];
  const push = (v) => { params.push(v); return `$${params.length}`; };
  if (req.query.status) where.push(`status = ${push(str(req.query.status))}`);
  if (req.query.q) {
    const t = push(`%${str(req.query.q)}%`);
    where.push(`(code ILIKE ${t} OR customer_name ILIKE ${t} OR phone ILIKE ${t})`);
  }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = await one(`SELECT COUNT(*)::int AS c FROM orders ${w}`, params);
  const rows = await many(`SELECT * FROM orders ${w} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]);
  ok(res, { items: rows, total: total.c, page, limit, pages: Math.max(1, Math.ceil(total.c / limit)), status_labels: STATUS_LABEL });
});
router.get('/orders/:id', async (req, res) => {
  const id = toInt(req.params.id);
  const order = await one('SELECT * FROM orders WHERE id = $1', [id]);
  if (!order) return fail(res, 'سفارش یافت نشد.', 404);
  order.items = await many('SELECT * FROM order_items WHERE order_id = $1', [id]);
  ok(res, order);
});
router.patch('/orders/:id', async (req, res) => {
  const id = toInt(req.params.id);
  const b = req.body || {};
  if (b.status && !STATUS_LABEL[b.status]) return fail(res, 'وضعیت سفارش نامعتبر است.');
  const order = await one('SELECT * FROM orders WHERE id = $1', [id]);
  if (!order) return fail(res, 'سفارش یافت نشد.', 404);
  const row = await one(
    'UPDATE orders SET status = $1, tracking_code = $2, updated_at = now() WHERE id = $3 RETURNING *',
    [b.status || order.status, str(b.tracking_code) || order.tracking_code, id],
  );
  ok(res, row);
});
router.delete('/orders/:id', async (req, res) => {
  const r = await query('DELETE FROM orders WHERE id = $1', [toInt(req.params.id)]);
  if (!r.rowCount) return fail(res, 'سفارش یافت نشد.', 404);
  ok(res, { message: 'سفارش حذف شد.' });
});

/* -------------------------------- subscribers ------------------------------ */
router.get('/subscribers', async (_req, res) => ok(res, await many('SELECT * FROM subscribers ORDER BY created_at DESC')));
router.delete('/subscribers/:id', async (req, res) => {
  await query('DELETE FROM subscribers WHERE id = $1', [toInt(req.params.id)]);
  ok(res, { message: 'ایمیل حذف شد.' });
});

router.get('/messages', async (_req, res) => ok(res, await many('SELECT * FROM contact_messages ORDER BY created_at DESC')));
router.patch('/messages/:id', async (req, res) => {
  const row = await one('UPDATE contact_messages SET is_read = $1 WHERE id = $2 RETURNING *', [toBool(req.body.is_read), toInt(req.params.id)]);
  if (!row) return fail(res, 'پیام یافت نشد.', 404);
  ok(res, row);
});
router.delete('/messages/:id', async (req, res) => {
  await query('DELETE FROM contact_messages WHERE id = $1', [toInt(req.params.id)]);
  ok(res, { message: 'پیام حذف شد.' });
});

router.get('/customers', async (_req, res) => {
  ok(res, await many(`SELECT c.id, c.phone, c.name, c.email, c.created_at,
    (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id)::int AS orders_count FROM customers c ORDER BY c.id DESC`));
});

/* --------------------------------- settings -------------------------------- */
router.get('/settings', async (_req, res) => {
  const rows = await many('SELECT key, value FROM settings');
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  ok(res, out);
});
router.put('/settings', async (req, res) => {
  const body = req.body || {};
  for (const [key, value] of Object.entries(body)) {
    await query(
      'INSERT INTO settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = $2::jsonb',
      [key, JSON.stringify(value)],
    );
  }
  const rows = await many('SELECT key, value FROM settings');
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  ok(res, out);
});

export default router;
