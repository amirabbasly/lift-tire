/** Integration tests against a production Next build and an isolated fake API. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const expectedSite = (process.env.EXPECTED_SITE_URL || 'https://lift-tire.com').replace(/\/+$/, '');
const verification = process.env.EXPECTED_GOOGLE_VERIFICATION || '';
const products = Array.from({ length: 65 }, (_, index) => ({
  id: index + 1, slug: `test-tire-${String(index + 1).padStart(2, '0')}`,
  name: `لاستیک آزمایشی ${index + 1}`, short_desc: 'توضیح نمونه', price: 12000,
  stock: index === 0 ? 0 : 1, sku: `TEST-${index + 1}`, size: '205/55 R16',
  season: 'چهارفصل', image: '/images/products/tire-passenger-a.png',
  images: [{ id: 1, url: '/images/products/tire-passenger-a.png', alt: 'تایر' }],
  specs: [], related: [], brand: { name_fa: 'نمونه' }, category: { slug: 'passenger', name: 'سواری' },
  rating: 0, rating_count: 0,
}));
let apiAvailable = true;
let cmsPosts = [
  { id: 201, slug: 'cms-unsafe', title: 'خبر </script><script>alert(1)</script>', tag: 'آموزش', excerpt: 'یک مطلب مدیر', created_at: '2026-11-12T10:00:00Z', content: '<p>متن مدیر</p><script>alert(123)</script><img src="/images/blog/blog-1.jpg" onerror="alert(1)"><a href="javascript:alert(2)">بد</a>', cover: '/images/blog/blog-1.jpg', read_time: 2 },
  { id: 202, slug: 'cms-second', title: 'مطلب دیگر مدیر', tag: 'نگهداری', excerpt: 'نمونه', created_at: '2026-11-12T09:00:00Z', content: '<p>محتوای دوم</p>', cover: '/images/blog/blog-2.jpg', read_time: 3 },
  { id: 203, slug: 'how-to-read-tire-size', title: 'عنوان ویرایش‌شده مدیر', tag: 'آموزش', excerpt: 'محتوای ویرایش‌شده باید حفظ شود', created_at: '2026-11-10T09:00:00Z', content: '<p>نسخه اختصاصی مدیر</p>', cover: '/images/blog/blog-2.jpg', read_time: 4 },
];

const api = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  if (!apiAvailable) return json(503, { error: 'unavailable' });
  if (url.pathname === '/api/posts') return json(200, cmsPosts);
  if (url.pathname === '/api/categories') return json(200, [{ id: 1, slug: 'passenger', name: 'سواری', description: 'تایر سواری' }]);
  if (url.pathname === '/api/categories/passenger') return json(200, { id: 1, slug: 'passenger', name: 'سواری', description: 'تایر سواری' });
  if (url.pathname === '/api/brands') return json(200, []);
  if (url.pathname === '/api/products') {
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Math.min(60, Number(url.searchParams.get('limit') || 12));
    return json(200, { items: products.slice((page - 1) * limit, page * limit), total: products.length, page, limit, pages: Math.ceil(products.length / limit) });
  }
  if (url.pathname.startsWith('/api/products/')) {
    const product = products.find((item) => url.pathname === `/api/products/${item.slug}`);
    return product ? json(200, product) : json(404, { error: 'not found' });
  }
  return json(503, { error: 'use frontend fallback' });
});
const listen = (server) => new Promise((resolve) => server.listen(0, '0.0.0.0', () => resolve(server.address().port)));
const apiPort = await listen(api);
const probe = createServer();
const port = await listen(probe);
await new Promise((resolve) => probe.close(resolve));
const next = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '0.0.0.0', '-p', String(port)], {
  cwd: process.cwd(),
  env: { ...process.env, API_INTERNAL_URL: `http://127.0.0.1:${apiPort}`, NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
next.stdout.on('data', (data) => { logs += data; });
next.stderr.on('data', (data) => { logs += data; });
const origin = `http://127.0.0.1:${port}`;
const get = async (path) => {
  const res = await fetch(origin + path, { headers: { 'user-agent': 'Googlebot' } });
  return { status: res.status, text: await res.text() };
};
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]?.replaceAll('&amp;', '&');
const schemas = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));
let passed = 0;
async function check(name, fn) { await fn(); console.log(`✓ ${name}`); passed++; }

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (next.exitCode !== null) throw new Error(`Next exited early: ${logs}`);
    try { if ((await fetch(origin + '/robots.txt')).ok) { ready = true; break; } } catch {}
    await delay(100);
  }
  if (!ready) throw new Error(`Next did not start: ${logs}`);

  await check('مجله، موضوعات، صفحه‌بندی و canonical', async () => {
    const root = await get('/blog');
    assert.equal(root.status, 200);
    assert.equal(canonical(root.text), `${expectedSite}/blog`);
    assert.match(root.text, /موضوعات مجله/);
    for (const slug of ['buying-guide', 'tire-care', 'road-safety', 'automotive-services']) assert.ok(root.text.includes(`/blog/category/${slug}`));
    assert.ok(root.text.includes('href="/blog?page=2"'));
    assert.ok(root.text.includes('cms-unsafe'));
    assert.ok(root.text.includes('khodro-chare-national-automotive-services'));
    const second = await get('/blog?page=2');
    assert.equal(second.status, 200);
    assert.equal(canonical(second.text), `${expectedSite}/blog?page=2`);
    assert.equal((await get('/blog?page=999')).status, 404);
    assert.equal((await get('/blog/category/no-such-topic')).status, 404);
  });
  await check('رپورتاژ با نشان اصلی، بک‌لینک sponsored و schema', async () => {
    const result = await get('/blog/khodro-chare-national-automotive-services');
    assert.equal(result.status, 200);
    assert.equal(canonical(result.text), `${expectedSite}/blog/khodro-chare-national-automotive-services`);
    assert.match(result.text, /نشان رسمی خودرو چاره/);
    assert.match(result.text, /href="https:\/\/khodrochare\.ir\/"[^>]*rel="[^"]*sponsored/);
    assert.match(result.text, /این مطلب یک رپورتاژ/);
    assert.ok(schemas(result.text).some((item) => item['@type'] === 'BlogPosting' && item.datePublished));
    assert.ok(schemas(result.text).some((item) => item['@type'] === 'BreadcrumbList'));
    assert.equal((await get('/images/partners/khodrochare-logo.webp')).status, 200);
  });
  await check('مقاله‌های تازه و دسته‌بندی قابل دسترسی‌اند', async () => {
    for (const slug of ['complete-tire-buying-guide', 'tire-pressure-safety-guide', 'tire-dot-date-guide', 'flat-tire-roadside-safety']) {
      const page = await get(`/blog/${slug}`);
      assert.equal(page.status, 200, slug);
      assert.equal(canonical(page.text), `${expectedSite}/blog/${slug}`);
      assert.ok(schemas(page.text).some((item) => item['@type'] === 'BlogPosting'));
    }
    const category = await get('/blog/category/tire-care');
    assert.equal(category.status, 200);
    assert.ok(category.text.includes('tire-dot-date-guide'));
    assert.equal((await get('/blog/not-a-post')).status, 404);
  });
  await check('حفظ محتوای ویرایش‌شده مدیر و پالایش HTML', async () => {
    const edited = await get('/blog/how-to-read-tire-size');
    assert.ok(edited.text.includes('نسخه اختصاصی مدیر'));
    assert.ok(!edited.text.includes('نسبت کمتر به‌معنی ارتفاع نسبی'));
    const unsafe = await get('/blog/cms-unsafe');
    const prose = unsafe.text.match(/<div class="prose-fa .*?>(.*?)<\/div>/s)?.[1];
    assert.ok(prose);
    assert.ok(prose.includes('متن مدیر'));
    assert.ok(!prose.includes('<script'));
    assert.ok(!prose.includes('onerror'));
    assert.ok(!prose.includes('javascript:'));
    const article = schemas(unsafe.text).find((item) => item['@type'] === 'BlogPosting');
    assert.ok(article.headline.includes('</script>'));
    assert.ok(unsafe.text.includes('\\u003c/script>'));
  });
  await check('نقشه سایت شامل همه محصولات API و بدون صفحات خصوصی', async () => {
    const map = await get('/sitemap.xml');
    assert.equal(map.status, 200);
    assert.ok(map.text.includes(`${expectedSite}/products/test-tire-65`));
    assert.ok(map.text.includes(`${expectedSite}/blog/khodro-chare-national-automotive-services`));
    assert.ok(map.text.includes(`${expectedSite}/blog?page=2`));
    assert.ok(map.text.includes(`${expectedSite}/blog/category/tire-care`));
    assert.ok(!map.text.includes(`${expectedSite}/cart`));
    assert.ok(!map.text.includes(`${expectedSite}/account`));
    assert.equal((map.text.match(/\/products\/test-tire-/g) || []).length, 65);
    const robots = await get('/robots.txt');
    assert.ok(robots.text.includes(`Sitemap: ${expectedSite}/sitemap.xml`));
    assert.ok(!robots.text.includes('Disallow: /cart'));
  });
  await check('محصول، قیمت ریالی، موجودی و صفحات فیلتر/خصوصی', async () => {
    const product = await get('/products/test-tire-01');
    assert.equal(product.status, 200);
    const structured = schemas(product.text).find((item) => item['@type'] === 'Product');
    assert.equal(structured.offers.priceCurrency, 'IRR');
    assert.equal(structured.offers.price, 120000);
    assert.equal(structured.offers.availability, 'https://schema.org/OutOfStock');
    assert.equal(structured.aggregateRating, undefined);
    assert.ok(product.text.includes('ناموجود'));
    const productsPage = await get('/products');
    assert.ok(productsPage.text.includes('href="/products?page=2"'));
    assert.equal(canonical((await get('/products?page=2')).text), `${expectedSite}/products?page=2`);
    assert.match((await get('/products?brand=sample')).text, /name="robots" content="noindex, follow"/);
    for (const path of ['/cart', '/account', '/checkout', '/track']) assert.match((await get(path)).text, /name="robots" content="noindex, follow"/);
  });
  await check('property گوگل فقط در صورت تنظیم منتشر می‌شود', async () => {
    const home = await get('/');
    assert.equal(home.status, 200);
    if (verification) assert.ok(home.text.includes(`name="google-site-verification" content="${verification}"`));
    else assert.ok(!home.text.includes('name="google-site-verification"'));
  });
  await check('API خالی یا قطع‌شده باعث حذف مطلب جدید و URL محصول ساختگی نمی‌شود', async () => {
    cmsPosts = [];
    const empty = await get('/blog');
    assert.ok(empty.text.includes('khodro-chare-national-automotive-services'));
    assert.ok(!empty.text.includes('cms-unsafe'));
    apiAvailable = false;
    const offlinePost = await get('/blog/tire-dot-date-guide');
    assert.equal(offlinePost.status, 200);
    const offlineMap = await get('/sitemap.xml');
    assert.ok(offlineMap.text.includes(`${expectedSite}/blog/tire-dot-date-guide`));
    assert.ok(!offlineMap.text.includes('/products/test-tire-'));
    assert.ok(!offlineMap.text.includes('/products/tire-01'));
    const corrected = await get('/blog/when-to-change-tires');
    assert.ok(corrected.text.includes('پنج‌سالگی به‌تنهایی به معنی خرابی قطعی نیست'));
  });
  console.log(`\n${passed} آزمون ادغامی SEO موفق بود.`);
} catch (error) {
  console.error('\nآزمون ناموفق:', error);
  console.error('Next logs:', logs.slice(-5000));
  process.exitCode = 1;
} finally {
  next.kill('SIGTERM');
  await new Promise((resolve) => api.close(resolve));
}
