import { Router } from 'express';
import { many, one, query } from '../db.js';
import { cleanPhone, fail, isEmail, isPhone, ok, str, toBool, toInt } from '../helpers.js';
import { compare, hash, requireCustomer, signToken } from '../auth.js';

const router = Router();

/* ---------------------------------- auth ---------------------------------- */
router.post('/register', async (req, res) => {
  const name = str(req.body.name);
  const phone = cleanPhone(req.body.phone);
  const password = str(req.body.password);
  if (name.length < 3) return fail(res, 'نام و نام خانوادگی را کامل وارد کنید.');
  if (!isPhone(phone)) return fail(res, 'شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۱۲۳۴۵۶۷).');
  if (password.length < 6) return fail(res, 'رمز عبور باید حداقل ۶ کاراکتر باشد.');
  if (await one('SELECT id FROM customers WHERE phone = $1', [phone])) {
    return fail(res, 'این شماره موبایل قبلاً ثبت‌نام کرده است. وارد شوید.', 409);
  }
  const customer = await one(
    'INSERT INTO customers (phone, name, email, password_hash) VALUES ($1,$2,$3,$4) RETURNING id, phone, name, email',
    [phone, name, str(req.body.email) || null, hash(password)],
  );
  const token = signToken({ id: customer.id, role: 'customer', phone: customer.phone });
  ok(res, { token, customer }, 201);
});

router.post('/login', async (req, res) => {
  const phone = cleanPhone(req.body.phone);
  const password = str(req.body.password);
  if (!isPhone(phone) || !password) return fail(res, 'شماره موبایل و رمز عبور را وارد کنید.');
  const customer = await one('SELECT * FROM customers WHERE phone = $1', [phone]);
  if (!customer || !compare(password, customer.password_hash)) return fail(res, 'شماره موبایل یا رمز عبور نادرست است.', 401);
  const token = signToken({ id: customer.id, role: 'customer', phone: customer.phone });
  ok(res, {
    token,
    customer: { id: customer.id, phone: customer.phone, name: customer.name, email: customer.email, cart: customer.cart || [] },
  });
});

router.use(requireCustomer);

router.get('/me', async (req, res) => {
  const [ordersCount, wishlistCount] = await Promise.all([
    one('SELECT COUNT(*)::int AS c FROM orders WHERE customer_id = $1', [req.customer.id]),
    one('SELECT COUNT(*)::int AS c FROM wishlist WHERE customer_id = $1', [req.customer.id]),
  ]);
  ok(res, { ...req.customer, orders_count: ordersCount.c, wishlist_count: wishlistCount.c });
});

router.put('/me', async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email);
  if (name.length < 3) return fail(res, 'نام و نام خانوادگی را کامل وارد کنید.');
  if (email && !isEmail(email)) return fail(res, 'ایمیل وارد شده معتبر نیست.');
  const row = await one('UPDATE customers SET name = $1, email = $2 WHERE id = $3 RETURNING id, phone, name, email', [
    name, email || null, req.customer.id,
  ]);
  ok(res, row);
});

router.put('/password', async (req, res) => {
  const current = str(req.body.current_password);
  const next = str(req.body.new_password);
  if (next.length < 6) return fail(res, 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
  const row = await one('SELECT password_hash FROM customers WHERE id = $1', [req.customer.id]);
  if (!compare(current, row.password_hash)) return fail(res, 'رمز عبور فعلی نادرست است.', 422);
  await query('UPDATE customers SET password_hash = $1 WHERE id = $2', [hash(next), req.customer.id]);
  ok(res, { message: 'رمز عبور با موفقیت تغییر کرد.' });
});

/* --------------------------------- orders --------------------------------- */
router.get('/orders', async (req, res) => {
  const orders = await many('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [req.customer.id]);
  for (const o of orders) {
    o.items = await many('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
  }
  ok(res, orders);
});

/* -------------------------------- addresses ------------------------------- */
router.get('/addresses', async (req, res) => {
  ok(res, await many('SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, id DESC', [req.customer.id]));
});

function addressValid(b) {
  if (!str(b.province) || !str(b.city) || !str(b.address) || !str(b.receiver)) return 'استان، شهر، آدرس و نام گیرنده الزامی است.';
  if (!isPhone(cleanPhone(b.phone))) return 'شماره تماس گیرنده معتبر نیست.';
  return null;
}

router.post('/addresses', async (req, res) => {
  const b = req.body || {};
  const err = addressValid(b);
  if (err) return fail(res, err);
  const count = await one('SELECT COUNT(*)::int AS c FROM addresses WHERE customer_id = $1', [req.customer.id]);
  const isDefault = toBool(b.is_default) || count.c === 0;
  if (isDefault) await query('UPDATE addresses SET is_default = false WHERE customer_id = $1', [req.customer.id]);
  const row = await one(
    `INSERT INTO addresses (customer_id, title, province, city, address, postal_code, receiver, phone, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.customer.id, str(b.title) || 'آدرس من', str(b.province), str(b.city), str(b.address), str(b.postal_code),
      str(b.receiver), cleanPhone(b.phone), isDefault],
  );
  ok(res, row, 201);
});

router.put('/addresses/:id', async (req, res) => {
  const b = req.body || {};
  const err = addressValid(b);
  if (err) return fail(res, err);
  const id = toInt(req.params.id);
  const existing = await one('SELECT * FROM addresses WHERE id = $1 AND customer_id = $2', [id, req.customer.id]);
  if (!existing) return fail(res, 'آدرس یافت نشد.', 404);
  if (toBool(b.is_default)) await query('UPDATE addresses SET is_default = false WHERE customer_id = $1', [req.customer.id]);
  const row = await one(
    `UPDATE addresses SET title=$1, province=$2, city=$3, address=$4, postal_code=$5, receiver=$6, phone=$7, is_default=$8
     WHERE id=$9 RETURNING *`,
    [str(b.title) || 'آدرس من', str(b.province), str(b.city), str(b.address), str(b.postal_code), str(b.receiver),
      cleanPhone(b.phone), b.is_default === undefined ? existing.is_default : toBool(b.is_default), id],
  );
  ok(res, row);
});

router.delete('/addresses/:id', async (req, res) => {
  await query('DELETE FROM addresses WHERE id = $1 AND customer_id = $2', [toInt(req.params.id), req.customer.id]);
  ok(res, { message: 'آدرس حذف شد.' });
});

/* -------------------------------- wishlist -------------------------------- */
router.get('/wishlist', async (req, res) => {
  const rows = await many(
    `SELECT w.id AS wish_id, p.*, b.name_fa AS brand_name,
      (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort, id LIMIT 1) AS image
     FROM wishlist w JOIN products p ON p.id = w.product_id LEFT JOIN brands b ON b.id = p.brand_id
     WHERE w.customer_id = $1 ORDER BY w.id DESC`,
    [req.customer.id],
  );
  ok(res, rows);
});

router.post('/wishlist', async (req, res) => {
  const pid = toInt(req.body.product_id);
  if (!pid) return fail(res, 'محصول مشخص نیست.');
  const exists = await one('SELECT id FROM wishlist WHERE customer_id = $1 AND product_id = $2', [req.customer.id, pid]);
  if (exists) {
    await query('DELETE FROM wishlist WHERE id = $1', [exists.id]);
    return ok(res, { added: false, message: 'از علاقه‌مندی‌ها حذف شد.' });
  }
  await query('INSERT INTO wishlist (customer_id, product_id) VALUES ($1,$2)', [req.customer.id, pid]);
  ok(res, { added: true, message: 'به علاقه‌مندی‌ها اضافه شد.' });
});

/* ---------------------------------- cart ---------------------------------- */
router.get('/cart', async (req, res) => {
  const row = await one('SELECT cart FROM customers WHERE id = $1', [req.customer.id]);
  ok(res, row?.cart || []);
});

router.put('/cart', async (req, res) => {
  const cart = Array.isArray(req.body.items) ? req.body.items.slice(0, 60) : [];
  await query('UPDATE customers SET cart = $1::jsonb WHERE id = $2', [JSON.stringify(cart), req.customer.id]);
  ok(res, cart);
});

export default router;
