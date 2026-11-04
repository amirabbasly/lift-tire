/**
 * تست دودی API لیفت تایر
 * پیش‌نیاز: سرور روی PORT (پیش‌فرض 4000) در حال اجرا باشد.
 * اجرا: npm run test:api
 */
const BASE = process.env.API_URL || 'http://127.0.0.1:4000';

let pass = 0;
let fail = 0;
const results = [];

function ok(name, cond, extra = '') {
  if (cond) { pass++; results.push(`  ✅ ${name}`); }
  else { fail++; results.push(`  ❌ ${name} ${extra}`); }
}

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

(async () => {
  console.log(`\n🧪 تست API لیفت تایر — ${BASE}\n`);

  const health = await req('/api/health');
  ok('GET /api/health → 200', health.status === 200 && health.data?.status === 'ok');

  const home = await req('/api/home');
  ok('GET /api/home شامل محصولات', home.status === 200 && home.data?.bestsellers?.length > 0);
  ok('بنرهای هیرو موجود است', (home.data?.banners?.hero || []).length >= 3);

  const list = await req('/api/products?limit=5');
  ok('GET /api/products → 200 با صفحه‌بندی', list.status === 200 && list.data.items.length === 5 && list.data.total >= 20);
  const sizeFilter = await req('/api/products?width=205&ratio=55&rim=16');
  ok('فیلتر سایز 205/55 R16', sizeFilter.status === 200 && sizeFilter.data.items.every((p) => p.width === 205 && p.rim === 16));
  const search = await req('/api/products?q=' + encodeURIComponent('میشلن'));
  ok('جست‌وجوی متنی', search.status === 200 && search.data.items.length > 0);
  const cheap = await req('/api/products?sort=cheapest&limit=3');
  ok('مرتب‌سازی ارزان‌ترین', cheap.data.items[0].price <= cheap.data.items[1].price);

  const slug = list.data.items[0].slug;
  const detail = await req(`/api/products/${slug}`);
  ok('GET /api/products/:slug با مشخصات', detail.status === 200 && detail.data.specs.length > 0 && detail.data.images.length > 0);
  ok('محصول ناموجود 404 می‌دهد', (await req('/api/products/not-exist-xyz')).status === 404);

  const coupon = await req('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: 'LIFT10', subtotal: 5000000, shipping: 95000 }) });
  ok('کد تخفیف LIFT10', coupon.status === 200 && coupon.data.discount === 500000);
  const badCoupon = await req('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: 'NOPE', subtotal: 5000000 }) });
  ok('کد تخفیف نامعتبر → 422', badCoupon.status === 422 && !!badCoupon.data.error);

  const order = await req('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: 'تست خودکار',
      phone: '09120000000',
      shipping_method: 'post',
      payment_method: 'gateway',
      coupon_code: 'FREESHIP',
      address: { province: 'تهران', city: 'تهران', address: 'خیابان تست، پلاک ۱', receiver: 'تست خودکار', phone: '09120000000' },
      items: [{ product_id: list.data.items[0].id, qty: 1 }],
    }),
  });
  ok('ثبت سفارش → 201', order.status === 201 && !!order.data?.order?.code);
  const code = order.data?.order?.code;
  ok('FREESHIP فقط هزینه ارسال را صفر می‌کند', order.data?.order?.shipping_cost === 0 && order.data?.order?.discount === 0);

  const track = await req(`/api/orders/track?code=${code}&phone=09120000000`);
  ok('پیگیری سفارش با کد و موبایل', track.status === 200 && track.data.code === code);

  const verify = await req('/api/payments/verify', { method: 'POST', body: JSON.stringify({ token: order.data.payment.token, order: code }) });
  ok('پرداخت شبیه‌سازی‌شده موفق', verify.status === 200 && verify.data.ok === true);
  const afterPay = await req(`/api/orders/${code}`);
  ok('وضعیت سفارش بعد از پرداخت = paid', afterPay.data.status === 'paid');

  const login = await req('/api/customer/login', { method: 'POST', body: JSON.stringify({ phone: '09121234567', password: 'test1234' }) });
  ok('ورود مشتری دمو', login.status === 200 && !!login.data.token);
  const me = await req('/api/customer/me', { headers: { Authorization: `Bearer ${login.data.token}` } });
  ok('GET /api/customer/me', me.status === 200 && me.data.phone === '09121234567');

  const admin = await req('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: 'admin@lifttire.ir', password: 'Lift@12345' }) });
  ok('ورود ادمین', admin.status === 200 && !!admin.data.token);
  const token = admin.data.token;
  const dash = await req('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  ok('داشبورد ادمین', dash.status === 200 && typeof dash.data.total_orders === 'number');
  ok('دسترسی بدون توکن → 401', (await req('/api/admin/products')).status === 401);

  const created = await req('/api/admin/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: 'محصول تستی خودکار', price: 1234000, stock: 3, category_id: 1, brand_id: 1, width: 205, ratio: 55, rim: 16, size: '205/55 R16', images: ['/images/products/tire-passenger-a.png'], specs: [{ label: 'برند', value: 'تست' }] }),
  });
  ok('ایجاد محصول (ادمین)', created.status === 201 && created.data.id > 0);
  const updated = await req(`/api/admin/products/${created.data.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...created.data, price: 2222000, is_active: false }),
  });
  ok('ویرایش محصول', updated.status === 200 && updated.data.price === 2222000 && updated.data.is_active === false);
  ok('حذف محصول', (await req(`/api/admin/products/${created.data.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })).status === 200);

  const banner = await req('/api/admin/banners', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'بنر تست', image: '/images/hero/hero-1.jpg', placement: 'strip', is_active: true }),
  });
  ok('ایجاد بنر', banner.status === 201 && banner.data.placement === 'strip');
  ok('ویرایش بنر', (await req(`/api/admin/banners/${banner.data.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...banner.data, title: 'بنر ویرایش‌شده' }) })).data.title === 'بنر ویرایش‌شده');
  ok('حذف بنر', (await req(`/api/admin/banners/${banner.data.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })).status === 200);

  ok('عضویت خبرنامه', (await req('/api/newsletter', { method: 'POST', body: JSON.stringify({ email: `test${Date.now()}@example.com` }) })).status === 201);
  ok('فرم تماس اعتبارسنجی می‌کند', (await req('/api/contact', { method: 'POST', body: JSON.stringify({ name: 'ت', phone: '123', message: 'کوتاه' }) })).status === 400);

  console.log(results.join('\n'));
  console.log(`\n${fail === 0 ? '✅' : '❌'} نتیجه: ${pass} موفق، ${fail} ناموفق\n`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('خطای اجرای تست:', e);
  process.exit(1);
});
