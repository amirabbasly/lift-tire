import { Router } from 'express';
import { many, one, query } from '../db.js';
import {
  fail, ok, toInt, toBool, str, like, paginate, orderCode, isEmail, isPhone, cleanPhone,
} from '../helpers.js';
import { optionalAuth } from '../auth.js';
import { createPaymentSession, verifyPaymentToken } from '../payments.js';

const router = Router();

const PRODUCT_SELECT = `
  SELECT p.*, b.name_fa AS brand_name, b.name_en AS brand_name_en, b.slug AS brand_slug, b.logo AS brand_logo,
         c.name AS category_name, c.slug AS category_slug
  FROM products p
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id`;

function shapeProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    size: row.size,
    width: row.width,
    ratio: row.ratio,
    rim: row.rim,
    season: row.season,
    price: Number(row.price),
    old_price: row.old_price ? Number(row.old_price) : null,
    discount: row.old_price && Number(row.old_price) > Number(row.price)
      ? Math.round((1 - Number(row.price) / Number(row.old_price)) * 100)
      : 0,
    stock: row.stock,
    sku: row.sku,
    rating: Number(row.rating || 0),
    rating_count: row.rating_count,
    sold_count: row.sold_count,
    badge: row.badge,
    country: row.country,
    made_year: row.made_year,
    warranty: row.warranty,
    tread_depth: row.tread_depth,
    fuel_label: row.fuel_label,
    wet_grip: row.wet_grip,
    noise: row.noise,
    weight: row.weight,
    compatible_cars: row.compatible_cars,
    short_desc: row.short_desc,
    description: row.description,
    is_featured: row.is_featured,
    created_at: row.created_at,
    brand: row.brand_id
      ? { id: row.brand_id, name_fa: row.brand_name, name_en: row.brand_name_en, slug: row.brand_slug, logo: row.brand_logo }
      : null,
    category: row.category_id
      ? { id: row.category_id, name: row.category_name, slug: row.category_slug }
      : null,
  };
}

async function attachMedia(products) {
  if (!products.length) return products;
  const ids = products.map((p) => p.id);
  const imgs = await many(
    'SELECT id, product_id, url, alt, sort FROM product_images WHERE product_id = ANY($1::int[]) ORDER BY sort, id',
    [ids],
  );
  const byProduct = new Map();
  for (const im of imgs) {
    if (!byProduct.has(im.product_id)) byProduct.set(im.product_id, []);
    byProduct.get(im.product_id).push({ id: im.id, url: im.url, alt: im.alt });
  }
  for (const p of products) {
    p.images = byProduct.get(p.id) || [];
    p.image = p.images[0]?.url || '/images/products/placeholder.png';
  }
  return products;
}

/* ---------------------------------- settings --------------------------------- */
router.get('/settings', async (_req, res) => {
  const rows = await many('SELECT key, value FROM settings');
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  ok(res, out);
});

/* --------------------------------- categories -------------------------------- */
router.get('/categories', async (req, res) => {
  const withCounts = toBool(req.query.counts);
  const rows = await many(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = true) AS product_count
     FROM categories c WHERE c.is_active = true ORDER BY c.sort, c.id`,
  );
  ok(res, rows.map((r) => ({ ...r, product_count: Number(r.product_count || 0) })).filter((r) => withCounts ? true : true));
});

router.get('/categories/:slug', async (req, res) => {
  const cat = await one('SELECT * FROM categories WHERE slug = $1 AND is_active = true', [req.params.slug]);
  if (!cat) return fail(res, 'دسته‌بندی یافت نشد.', 404);
  ok(res, cat);
});

/* ----------------------------------- brands ---------------------------------- */
router.get('/brands', async (req, res) => {
  const featured = req.query.featured;
  let sql = `SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = true) AS product_count
             FROM brands b WHERE b.is_active = true`;
  const params = [];
  if (toBool(featured)) sql += ' AND b.is_featured = true';
  sql += ' ORDER BY b.sort, b.id';
  const rows = await many(sql, params);
  ok(res, rows.map((r) => ({ ...r, product_count: Number(r.product_count || 0) })));
});

/* ---------------------------------- products --------------------------------- */
router.get('/products', async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const where = ['p.is_active = true'];
  const params = [];
  const push = (v) => {
    params.push(v);
    return `$${params.length}`;
  };

  if (req.query.category) {
    where.push(`(c.slug = ${push(str(req.query.category))} OR c.parent_id = (SELECT id FROM categories WHERE slug = ${push(str(req.query.category))}))`);
  }
  if (req.query.brand) {
    const brands = str(req.query.brand).split(',').map((s) => s.trim()).filter(Boolean);
    where.push(`b.slug = ANY(${push(brands)})`);
  }
  const width = toInt(req.query.width);
  const ratio = toInt(req.query.ratio);
  const rim = toInt(req.query.rim);
  if (width) where.push(`p.width = ${push(width)}`);
  if (ratio) where.push(`p.ratio = ${push(ratio)}`);
  if (rim) where.push(`p.rim = ${push(rim)}`);
  if (req.query.season) where.push(`p.season = ${push(str(req.query.season))}`);
  const min = toInt(req.query.min_price);
  const max = toInt(req.query.max_price);
  if (min) where.push(`p.price >= ${push(min)}`);
  if (max) where.push(`p.price <= ${push(max)}`);
  if (toBool(req.query.in_stock)) where.push('p.stock > 0');
  if (toBool(req.query.on_sale)) where.push('p.old_price IS NOT NULL AND p.old_price > p.price');
  if (req.query.q) {
    const term = push(like(str(req.query.q)));
    where.push(`(p.name ILIKE ${term} OR p.size ILIKE ${term} OR p.sku ILIKE ${term} OR b.name_fa ILIKE ${term} OR b.name_en ILIKE ${term})`);
  }
  const sortMap = {
    newest: 'p.created_at DESC, p.id DESC',
    cheapest: 'p.price ASC',
    expensive: 'p.price DESC',
    bestseller: 'p.sold_count DESC',
    popular: 'p.rating DESC, p.sold_count DESC',
    discount: 'discount_col DESC',
  };
  const orderBy = sortMap[str(req.query.sort, 'newest')] || sortMap.newest;
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const totalRow = await one(
    `SELECT COUNT(*)::int AS total FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`,
    params,
  );
  const listSql = `${PRODUCT_SELECT.replace('SELECT p.*,', 'SELECT p.*, CASE WHEN p.old_price > p.price THEN (p.old_price - p.price) * 1.0 / p.old_price ELSE 0 END AS discount_col,')} ${whereSql}
    ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const rows = await many(listSql, [...params, limit, offset]);
  const items = await attachMedia(rows.map(shapeProduct));
  ok(res, {
    items,
    total: Number(totalRow?.total || 0),
    page,
    limit,
    pages: Math.max(1, Math.ceil(Number(totalRow?.total || 0) / limit)),
  });
});

router.get('/products/:slug', async (req, res) => {
  const row = await one(`${PRODUCT_SELECT} WHERE p.slug = $1 AND p.is_active = true`, [req.params.slug]);
  if (!row) return fail(res, 'محصول یافت نشد.', 404);
  const product = shapeProduct(row);
  await attachMedia([product]);
  product.specs = await many('SELECT id, label, value FROM product_specs WHERE product_id = $1 ORDER BY sort, id', [product.id]);
  const related = await many(
    `${PRODUCT_SELECT} WHERE p.is_active = true AND p.id <> $1 AND (p.category_id = $2 OR p.brand_id = $3)
     ORDER BY p.sold_count DESC LIMIT 8`,
    [product.id, row.category_id, row.brand_id],
  );
  product.related = await attachMedia(related.map(shapeProduct));
  ok(res, product);
});

/* ------------------------------------ home ----------------------------------- */
router.get('/home', async (_req, res) => {
  const [banners, cats, brands, featured, bestsellers, newest, deals, posts] = await Promise.all([
    many('SELECT * FROM banners WHERE is_active = true ORDER BY sort, id'),
    many(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = true) AS product_count
          FROM categories c WHERE c.is_active = true AND c.parent_id IS NULL ORDER BY c.sort, c.id`),
    many(`SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = true) AS product_count
          FROM brands b WHERE b.is_active = true ORDER BY b.sort, b.id`),
    many(`${PRODUCT_SELECT} WHERE p.is_active = true AND p.is_featured = true ORDER BY p.sold_count DESC LIMIT 8`),
    many(`${PRODUCT_SELECT} WHERE p.is_active = true ORDER BY p.sold_count DESC LIMIT 8`),
    many(`${PRODUCT_SELECT} WHERE p.is_active = true ORDER BY p.created_at DESC LIMIT 8`),
    many(`${PRODUCT_SELECT} WHERE p.is_active = true AND p.old_price IS NOT NULL AND p.old_price > p.price ORDER BY p.old_price - p.price DESC LIMIT 8`),
    many('SELECT * FROM posts WHERE is_published = true ORDER BY created_at DESC LIMIT 3'),
  ]);
  const settingsRows = await many('SELECT key, value FROM settings');
  const settings = {};
  for (const r of settingsRows) settings[r.key] = r.value;
  ok(res, {
    settings,
    banners: {
      hero: banners.filter((b) => b.placement === 'hero'),
      strip: banners.filter((b) => b.placement === 'strip'),
      category: banners.filter((b) => b.placement === 'category'),
    },
    categories: cats,
    brands: brands.map((b) => ({ ...b, product_count: Number(b.product_count || 0) })),
    featured: await attachMedia(featured.map(shapeProduct)),
    bestsellers: await attachMedia(bestsellers.map(shapeProduct)),
    newest: await attachMedia(newest.map(shapeProduct)),
    deals: await attachMedia(deals.map(shapeProduct)),
    posts,
  });
});

/* ---------------------------------- banners ---------------------------------- */
router.get('/banners', async (req, res) => {
  const placement = str(req.query.placement);
  const rows = placement
    ? await many('SELECT * FROM banners WHERE is_active = true AND placement = $1 ORDER BY sort, id', [placement])
    : await many('SELECT * FROM banners WHERE is_active = true ORDER BY sort, id');
  ok(res, rows);
});

/* ----------------------------------- posts ----------------------------------- */
router.get('/posts', async (_req, res) => {
  ok(res, await many('SELECT * FROM posts WHERE is_published = true ORDER BY created_at DESC'));
});
router.get('/posts/:slug', async (req, res) => {
  const post = await one('SELECT * FROM posts WHERE slug = $1 AND is_published = true', [req.params.slug]);
  if (!post) return fail(res, 'مقاله یافت نشد.', 404);
  ok(res, post);
});

/* ---------------------------------- coupons ---------------------------------- */
async function validateCoupon(code, subtotal, shippingCost = 0) {
  const c = await one('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [code]);
  if (!c) return { error: 'کد تخفیف معتبر نیست.' };
  if (!c.is_active) return { error: 'این کد تخفیف غیرفعال است.' };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { error: 'این کد تخفیف منقضی شده است.' };
  if (c.usage_limit && c.used_count >= c.usage_limit) return { error: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.' };
  if (subtotal < c.min_subtotal) return { error: 'حداقل مبلغ سبد برای استفاده از این کد رعایت نشده است.' };
  let discount = 0;
  let shippingDiscount = 0;
  if (c.type === 'percent') {
    discount = Math.round((subtotal * c.value) / 100);
    if (c.max_discount) discount = Math.min(discount, c.max_discount);
  } else if (c.type === 'fixed') {
    discount = Math.min(c.value, subtotal);
  } else if (c.type === 'shipping') {
    shippingDiscount = shippingCost;
  }
  return { coupon: c, discount, shippingDiscount };
}

router.post('/coupons/validate', async (req, res) => {
  const code = str(req.body.code);
  const subtotal = toInt(req.body.subtotal, 0);
  const shipping = toInt(req.body.shipping, 0);
  if (!code) return fail(res, 'کد تخفیف را وارد کنید.');
  const r = await validateCoupon(code, subtotal, shipping);
  if (r.error) return fail(res, r.error, 422);
  ok(res, {
    code: r.coupon.code,
    type: r.coupon.type,
    discount: r.discount,
    shipping_discount: r.shippingDiscount,
    message: r.coupon.type === 'shipping' ? 'کد تخفیف ارسال اعمال شد.' : 'کد تخفیف اعمال شد.',
  });
});

/* ---------------------------------- shipping --------------------------------- */
const SHIPPING = {
  freight: { title: 'باربری (سراسر ایران)', cost: 180000, days: '۳ تا ۵ روز کاری' },
  post: { title: 'پست پیشتاز', cost: 95000, days: '۲ تا ۴ روز کاری' },
  courier: { title: 'پیک تهران', cost: 120000, days: 'همان روز' },
};

export function shippingOptions() {
  return Object.entries(SHIPPING).map(([id, v]) => ({ id, ...v }));
}
router.get('/shipping-options', (_req, res) => ok(res, shippingOptions()));

/* ----------------------------------- orders ---------------------------------- */
router.post('/orders', optionalAuth, async (req, res) => {
  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return fail(res, 'سبد خرید شما خالی است.');
  const name = str(body.customer_name);
  const phone = cleanPhone(body.phone);
  if (name.length < 3) return fail(res, 'نام و نام خانوادگی را کامل وارد کنید.');
  if (!isPhone(phone)) return fail(res, 'شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۱۲۳۴۵۶۷).');
  if (body.email && !isEmail(body.email)) return fail(res, 'ایمیل وارد شده معتبر نیست.');
  const method = SHIPPING[str(body.shipping_method)] ? str(body.shipping_method) : 'post';
  const paymentMethod = str(body.payment_method) === 'cod' ? 'cod' : 'gateway';

  const resolved = [];
  let subtotal = 0;
  for (const it of items) {
    const pid = toInt(it.product_id ?? it.id);
    const qty = Math.max(1, Math.min(20, toInt(it.qty, 1)));
    if (!pid) continue;
    const p = await one(
      `SELECT p.id, p.name, p.size, p.price, p.stock, b.name_fa AS brand_name,
        (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort, id LIMIT 1) AS image
       FROM products p LEFT JOIN brands b ON b.id = p.brand_id WHERE p.id = $1 AND p.is_active = true`,
      [pid],
    );
    if (!p) return fail(res, 'یکی از محصولات سبد خرید یافت نشد.');
    if (p.stock < qty) return fail(res, `موجودی «${p.name}» کافی نیست (${p.stock} عدد).`, 422);
    resolved.push({ ...p, qty });
    subtotal += Number(p.price) * qty;
  }
  if (!resolved.length) return fail(res, 'سبد خرید شما خالی است.');

  let shippingCost = SHIPPING[method].cost;
  let discount = 0;
  let shippingDiscount = 0;
  let couponCode = null;
  if (body.coupon_code) {
    const r = await validateCoupon(str(body.coupon_code), subtotal, shippingCost);
    if (r.error) return fail(res, r.error, 422);
    discount = r.discount;
    shippingDiscount = r.shippingDiscount;
    couponCode = r.coupon.code;
  }
  const payableShipping = Math.max(0, shippingCost - shippingDiscount);
  const total = Math.max(0, subtotal - discount) + payableShipping;

  const address = body.address && typeof body.address === 'object' ? {
    province: str(body.address.province),
    city: str(body.address.city),
    address: str(body.address.address),
    postal_code: str(body.address.postal_code),
    receiver: str(body.address.receiver) || name,
    phone: cleanPhone(body.address.phone) || phone,
  } : { receiver: name, phone, city: str(body.city), address: str(body.address_text) };
  if (!address.city || !address.address) return fail(res, 'آدرس ارسال سفارش را وارد کنید.');

  const code = orderCode();
  let customerId = req.user?.role === 'customer' ? req.user.id : null;
  if (!customerId) {
    const existing = await one('SELECT id FROM customers WHERE phone = $1', [phone]);
    customerId = existing?.id || null;
  }
  const status = paymentMethod === 'cod' ? 'processing' : 'pending_payment';

  const order = await one(
    `INSERT INTO orders (code, customer_id, customer_name, phone, email, address_snapshot, shipping_method, shipping_cost,
      payment_method, subtotal, discount, total, coupon_code, status, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [code, customerId, name, phone, str(body.email) || null, JSON.stringify(address), method, payableShipping,
      paymentMethod, subtotal, discount, total, couponCode, status, str(body.note) || null],
  );
  for (const it of resolved) {
    await query(
      `INSERT INTO order_items (order_id, product_id, name, size, brand, price, qty, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [order.id, it.id, it.name, it.size, it.brand_name, it.price, it.qty, it.image],
    );
    await query('UPDATE products SET stock = GREATEST(0, stock - $1), sold_count = sold_count + $1 WHERE id = $2', [it.qty, it.id]);
  }
  if (couponCode) {
    await query('UPDATE coupons SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)', [couponCode]);
  }

  const payload = { order: { ...order, subtotal, discount, total, shipping_cost: payableShipping }, payment: null };
  if (paymentMethod === 'gateway') {
    payload.payment = createPaymentSession({ orderCode: code, amount: total });
    payload.payment.redirect_url = `/payment/mock?token=${encodeURIComponent(payload.payment.token)}&order=${code}`;
  }
  ok(res, payload, 201);
});

router.get('/orders/track', async (req, res) => {
  const code = str(req.query.code).toUpperCase();
  const phone = cleanPhone(req.query.phone);
  if (!code || !isPhone(phone)) return fail(res, 'کد سفارش و شماره موبایل را کامل وارد کنید.');
  const order = await one('SELECT * FROM orders WHERE UPPER(code) = $1 AND phone = $2', [code, phone]);
  if (!order) return fail(res, 'سفارشی با این مشخصات یافت نشد.', 404);
  order.items = await many('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  ok(res, order);
});

router.get('/orders/:code', async (req, res) => {
  const code = str(req.params.code).toUpperCase();
  const order = await one('SELECT * FROM orders WHERE UPPER(code) = $1', [code]);
  if (!order) return fail(res, 'سفارش یافت نشد.', 404);
  order.items = await many('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  ok(res, order);
});

/* ---------------------------------- payments --------------------------------- */
router.post('/payments/verify', async (req, res) => {
  const token = str(req.body.token);
  const code = str(req.body.order);
  const order = await one('SELECT * FROM orders WHERE code = $1', [code]);
  if (!order) return fail(res, 'سفارش یافت نشد.', 404);
  if (order.status !== 'pending_payment' && order.status !== 'processing') return fail(res, 'این سفارش قبلاً پرداخت شده است.');
  if (str(req.body.cancel) === '1') {
    await query("UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = $1", [order.id]);
    return ok(res, { ok: false, cancelled: true, code: order.code });
  }
  const v = verifyPaymentToken(token, order);
  if (!v) return fail(res, 'تراکنش نامعتبر یا منقضی شده است.', 422);
  await query("UPDATE orders SET status = 'paid', payment_ref = $1, updated_at = now() WHERE id = $2", [v.ref, order.id]);
  ok(res, { ok: true, code: order.code, ref: v.ref });
});

/* ----------------------------------- reviews --------------------------------- */
router.get('/reviews', async (req, res) => {
  const pid = toInt(req.query.product_id);
  const rows = pid
    ? await many("SELECT id,name,rating,comment,created_at FROM reviews WHERE status = 'approved' AND product_id = $1 ORDER BY created_at DESC", [pid])
    : await many("SELECT r.id, r.name, r.rating, r.comment, r.created_at, p.name AS product_name, p.slug AS product_slug FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status = 'approved' ORDER BY r.created_at DESC LIMIT 12");
  ok(res, rows);
});

router.post('/reviews', async (req, res) => {
  const b = req.body || {};
  const pid = toInt(b.product_id);
  const name = str(b.name);
  const comment = str(b.comment);
  const rating = Math.min(5, Math.max(1, toInt(b.rating, 5)));
  if (!pid) return fail(res, 'محصول مشخص نیست.');
  if (name.length < 2) return fail(res, 'نام خود را وارد کنید.');
  if (comment.length < 5) return fail(res, 'متن نظر حداقل ۵ کاراکتر باشد.');
  const product = await one('SELECT id FROM products WHERE id = $1', [pid]);
  if (!product) return fail(res, 'محصول یافت نشد.', 404);
  await query(
    "INSERT INTO reviews (product_id, name, phone, rating, comment, status) VALUES ($1,$2,$3,$4,$5,'pending')",
    [pid, name, cleanPhone(b.phone) || null, rating, comment],
  );
  ok(res, { message: 'نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.' }, 201);
});

/* --------------------------------- newsletter -------------------------------- */
router.post('/newsletter', async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  if (!isEmail(email)) return fail(res, 'ایمیل وارد شده معتبر نیست.');
  const exists = await one('SELECT id FROM subscribers WHERE email = $1', [email]);
  if (exists) return ok(res, { message: 'این ایمیل قبلاً در خبرنامه ثبت شده است.' });
  await query('INSERT INTO subscribers (email) VALUES ($1)', [email]);
  ok(res, { message: 'عضویت شما در خبرنامه ثبت شد.' }, 201);
});

/* ----------------------------------- contact --------------------------------- */
router.post('/contact', async (req, res) => {
  const b = req.body || {};
  const name = str(b.name);
  const phone = cleanPhone(b.phone);
  const message = str(b.message);
  if (name.length < 2) return fail(res, 'نام خود را وارد کنید.');
  if (!isPhone(phone)) return fail(res, 'شماره موبایل معتبر وارد کنید.');
  if (message.length < 10) return fail(res, 'متن پیام حداقل ۱۰ کاراکتر باشد.');
  await query('INSERT INTO contact_messages (name, phone, email, subject, message) VALUES ($1,$2,$3,$4,$5)', [
    name, phone, str(b.email) || null, str(b.subject) || 'تماس با ما', message,
  ]);
  ok(res, { message: 'پیام شما ثبت شد. کارشناسان ما به‌زودی تماس می‌گیرند.' }, 201);
});

export default router;
