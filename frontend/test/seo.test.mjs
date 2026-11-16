/** Integration tests against a production Next build and an isolated fake API. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const expectedSite = (process.env.EXPECTED_SITE_URL || 'https://lift-tire.com').replace(/\/+$/, '');
const verification = process.env.EXPECTED_GOOGLE_VERIFICATION || '';
const demoSeeds = JSON.parse(readFileSync(new URL('../lib/demo-data.json', import.meta.url), 'utf8')).posts;
const products = Array.from({ length: 65 }, (_, index) => ({
  id: index + 1, slug: `test-tire-${String(index + 1).padStart(2, '0')}`,
  name: `لاستیک آزمایشی ${index + 1}`, short_desc: 'توضیح نمونه', price: index === 2 ? null : 12000,
  old_price: index === 2 ? 15000 : null,
  stock: index === 0 ? 0 : index === 1 ? null : 1, sku: `TEST-${index + 1}`, size: '205/55 R16',
  season: 'چهارفصل', image: '/images/products/tire-passenger-a.png',
  images: [{ id: 1, url: '/images/products/tire-passenger-a.png', alt: 'تایر' }],
  specs: [], related: [], brand: { name_fa: index % 3 === 0 ? 'بارز' : index % 3 === 1 ? 'کویر تایر' : 'نمونه', slug: index % 3 === 0 ? 'barz' : index % 3 === 1 ? 'kavir' : 'sample' },
  category: { slug: index === 5 ? 'offroad' : index === 6 ? 'truck' : 'passenger', name: 'سواری' },
  rating: 4.9, rating_count: 999,
}));
let apiAvailable = true;
let postsAvailable = true;
let categoryExists = true;
let failFirstProductPage = false;
let failSecondProductPage = false;
let invalidProductPagination = false;
let cmsPosts = [
  { id: 201, slug: 'cms-unsafe', title: 'خبر </script><script>alert(1)</script>', tag: 'آموزش', excerpt: 'یک مطلب مدیر', created_at: '2026-11-12T10:00:00Z', content: '<p>متن مدیر</p><script>alert(123)</script><img src="/images/blog/blog-1.jpg" onerror="alert(1)"><a href="javascript:alert(2)">بد</a>', cover: '/images/blog/blog-1.jpg', read_time: 2 },
  { id: 202, slug: 'cms-second', title: 'مطلب دیگر مدیر', tag: 'نگهداری', excerpt: 'نمونه', created_at: '2026-11-12T09:00:00Z', content: '<p>محتوای دوم</p>', cover: '/images/blog/blog-2.jpg', read_time: 3 },
  { id: 203, slug: 'how-to-read-tire-size', title: 'عنوان ویرایش‌شده مدیر', tag: 'آموزش', excerpt: 'محتوای ویرایش‌شده باید حفظ شود', created_at: '2026-11-10T09:00:00Z', content: '<p>نسخه اختصاصی مدیر</p>', cover: '/images/blog/blog-2.jpg', read_time: 4 },
];

const api = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  if (!apiAvailable) return json(503, { error: 'unavailable' });
  if (url.pathname === '/api/posts') return postsAvailable ? json(200, cmsPosts) : json(503, { error: 'posts unavailable' });
  const categories = [
    { id: 1, slug: 'passenger', name: 'سواری', description: 'تایر سواری' },
    { id: 2, slug: 'offroad', name: 'آفرود' },
    { id: 3, slug: 'truck', name: 'باری' },
    { id: 4, slug: 'custom-category', name: 'دسته آزمایشی مدیر' },
  ];
  if (url.pathname === '/api/categories') return json(200, categories);
  if (url.pathname.startsWith('/api/categories/')) {
    const category = categories.find((item) => url.pathname === `/api/categories/${item.slug}`);
    return category && categoryExists ? json(200, category) : json(404, { error: 'not found' });
  }
  if (url.pathname === '/api/brands') return json(200, [{ id: 1, slug: 'barz', name_fa: 'بارز' }, { id: 2, slug: 'kavir', name_fa: 'کویر تایر' }]);
  if (url.pathname === '/api/reviews') return json(200, url.searchParams.get('product_id') === '1' ? [
    { name: 'مهدی رضایی', rating: 5, comment: 'لاستیک کاملاً اصل بود و تاریخ تولید ۱۴۰۳ داشت. بسته‌بندی و ارسال هم عالی.' },
    { name: 'نظر آزمایشی واقعی', rating: 4, comment: 'متن آزمایشی برای بررسی میانگین.' },
  ] : []);
  if (url.pathname === '/api/products') {
    const page = Number(url.searchParams.get('page') || 1);
    const limit = Math.min(60, Number(url.searchParams.get('limit') || 12));
    if ((failFirstProductPage && limit === 60 && page === 1) || (failSecondProductPage && limit === 60 && page === 2)) return json(503, { error: 'page unavailable' });
    let matching = products;
    if (url.searchParams.has('brand')) matching = matching.filter((item) => item.brand.slug === url.searchParams.get('brand'));
    if (url.searchParams.has('category')) matching = matching.filter((item) => item.category.slug === url.searchParams.get('category'));
    return json(200, { items: matching.slice((page - 1) * limit, page * limit), total: matching.length, page, limit, pages: invalidProductPagination && limit === 60 ? null : Math.max(1, Math.ceil(matching.length / limit)) });
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
    assert.match(result.text, /متن آن هنگام بررسی قابل دریافت نبود/);
    assert.ok(schemas(result.text).some((item) => item['@type'] === 'BlogPosting' && item.datePublished));
    assert.ok(schemas(result.text).some((item) => item['@type'] === 'BreadcrumbList'));
    assert.equal((await get('/images/partners/khodrochare-logo.webp')).status, 200);
  });
  await check('مقاله‌های تازه و دسته‌بندی قابل دسترسی‌اند', async () => {
    for (const slug of ['complete-tire-buying-guide', 'tire-pressure-safety-guide', 'tire-dot-date-guide', 'flat-tire-roadside-safety', 'tire-load-speed-index-guide', 'tire-wear-pattern-guide']) {
      const page = await get(`/blog/${slug}`);
      assert.equal(page.status, 200, slug);
      assert.equal(canonical(page.text), `${expectedSite}/blog/${slug}`);
      assert.ok(schemas(page.text).some((item) => item['@type'] === 'BlogPosting'));
    }
    for (const slug of ['tire-load-speed-index-guide', 'tire-wear-pattern-guide']) {
      const draft = await get(`/blog/${slug}`);
      const article = schemas(draft.text).find((item) => item['@type'] === 'BlogPosting');
      assert.equal(article.datePublished, undefined, 'unreleased article must not claim a publication date');
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
    const originalPosts = cmsPosts;
    cmsPosts = [...cmsPosts, demoSeeds.find((post) => post.slug === 'when-to-change-tires')];
    assert.ok((await get('/blog/when-to-change-tires')).text.includes('پنج‌سالگی به‌تنهایی به معنی خرابی قطعی نیست'));
    cmsPosts = originalPosts;
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
    for (const path of ['/brands/barz', '/brands/kavir', '/blog/tire-load-speed-index-guide', '/blog/tire-wear-pattern-guide']) assert.ok(map.text.includes(`${expectedSite}${path}`), path);
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
  await check('صفحات برند مستند، محصولات فیلترشده و پیوندهای داخلی', async () => {
    for (const slug of ['barz', 'kavir']) {
      const page = await get(`/brands/${slug}`);
      assert.equal(page.status, 200, slug);
      assert.equal(canonical(page.text), `${expectedSite}/brands/${slug}`);
      assert.ok(!page.text.includes('name="robots" content="noindex'));
      assert.ok(page.text.includes(`/products?brand=${slug}`));
      assert.ok(page.text.includes('/blog/tire-load-speed-index-guide'));
      assert.ok(schemas(page.text).some((item) => item['@type'] === 'BreadcrumbList'));
    }
    const barz = await get('/brands/barz');
    assert.ok(barz.text.includes('href="/products/test-tire-01"'));
    assert.ok(!barz.text.includes('href="/products/test-tire-02"'));
    assert.equal((await get('/brands/not-a-brand')).status, 404);
    assert.ok((await get('/products')).text.includes('href="/brands/barz"'));
    assert.ok((await get('/category/passenger')).text.includes('href="/brands/kavir"'));
  });
  await check('دسته‌ها، صفحه‌بندی نامعتبر و ۴۰۴ واقعی دسته', async () => {
    for (const [slug, text] of [['passenger', 'برای انتخاب لاستیک سواری'], ['offroad', 'انتخاب تایر برای شاسی‌بلند'], ['truck', 'نکات انتخاب تایر باری']]) {
      const page = await get(`/category/${slug}`);
      assert.equal(page.status, 200);
      assert.ok(page.text.includes(text));
      assert.equal(canonical(page.text), `${expectedSite}/category/${slug}`);
    }
    assert.equal((await get('/category/custom-category')).status, 200);
    assert.equal((await get('/products/not-a-product')).status, 404);
    assert.equal((await get('/products?page=999')).status, 404);
    assert.equal((await get('/category/passenger?page=999')).status, 404);
    assert.equal(canonical((await get('/category/passenger?page=2')).text), `${expectedSite}/category/passenger?page=2`);
    assert.match((await get('/category/passenger?brand=barz')).text, /name="robots" content="noindex, follow"/);
    categoryExists = false;
    assert.equal((await get('/category/passenger')).status, 404);
    categoryExists = true;
  });
  await check('موجودی و قیمت نامشخص، و نظرهای seed', async () => {
    const first = await get('/products/test-tire-01');
    assert.ok(first.text.includes('میانگین نظرهای تأییدشده'));
    assert.ok(first.text.includes('۴.۰'));
    assert.ok(!first.text.includes('امتیاز خریداران'));
    assert.ok(!first.text.includes('مهدی رضایی'));
    assert.ok(!first.text.includes('پایان پیشنهاد'));
    const unknownStock = await get('/products/test-tire-02');
    assert.ok(unknownStock.text.includes('موجودی نامشخص'));
    assert.equal(schemas(unknownStock.text).find((item) => item['@type'] === 'Product').offers.availability, undefined);
    assert.ok(!unknownStock.text.includes('میانگین نظرهای تأییدشده'));
    const unknownPrice = await get('/products/test-tire-03');
    assert.ok(unknownPrice.text.includes('قیمت نامشخص'));
    assert.equal(schemas(unknownPrice.text).find((item) => item['@type'] === 'Product').offers, undefined);
    assert.ok(!unknownPrice.text.includes('٪ تخفیف'));
    assert.match(unknownPrice.text, /disabled=""/);
  });
  await check('صفحه اصلی از اضافه‌شدن مطالب جدید تغییر نمی‌کند و مطالب مدیر حفظ می‌شوند', async () => {
    const home = await get('/');
    assert.equal(home.status, 200);
    assert.match(home.text, /<title>خرید و بررسی لاستیک خودرو/);
    assert.match(home.text, /<meta name="description" content="در لیفت تایر مشخصات/);
    assert.ok(home.text.includes('khodro-chare-national-automotive-services'));
    assert.ok(home.text.includes('/blog/cms-unsafe'));
    assert.ok(!home.text.includes('/blog/tire-load-speed-index-guide'));
    assert.ok(!home.text.includes('/blog/tire-wear-pattern-guide'));
    const original = cmsPosts;
    cmsPosts = [{ id: 300, slug: 'tire-load-speed-index-guide', title: 'مطلب اختصاصی مدیر برای خانه', tag: 'آموزش', created_at: '2026-11-13T00:00:00Z', cover: '/images/blog/blog-1.jpg', content: '<p>نسخه اختصاصی مدیر</p>' }, ...original];
    const homeWithCms = await get('/');
    assert.ok(homeWithCms.text.includes('مطلب اختصاصی مدیر برای خانه'));
    assert.ok((await get('/blog/tire-load-speed-index-guide')).text.includes('نسخه اختصاصی مدیر'));
    cmsPosts = original;
  });
  await check('نقشه سایت هنگام خطای هر صفحه محصول یا بخش مقالات ناقص منتشر نمی‌شود', async () => {
    failFirstProductPage = true;
    assert.equal((await get('/sitemap.xml')).status, 500);
    failFirstProductPage = false;
    invalidProductPagination = true;
    assert.equal((await get('/sitemap.xml')).status, 500);
    invalidProductPagination = false;
    failSecondProductPage = true;
    assert.equal((await get('/sitemap.xml')).status, 500);
    failSecondProductPage = false;
    assert.equal((await get('/sitemap.xml')).status, 200);
    postsAvailable = false;
    assert.equal((await get('/sitemap.xml')).status, 500);
    postsAvailable = true;
    assert.equal((await get('/sitemap.xml')).status, 200);
  });
  await check('property گوگل فقط در صورت تنظیم منتشر می‌شود', async () => {
    const home = await get('/');
    assert.equal(home.status, 200);
    if (verification) assert.ok(home.text.includes(`name="google-site-verification" content="${verification}"`));
    else assert.ok(!home.text.includes('name="google-site-verification"'));
  });
  await check('API خالی یا قطع‌شده، نقشه ناقص یا محصول نمایشی صادر نمی‌کند', async () => {
    cmsPosts = [];
    const empty = await get('/blog');
    assert.ok(empty.text.includes('khodro-chare-national-automotive-services'));
    assert.ok(!empty.text.includes('cms-unsafe'));
    apiAvailable = false;
    // قطعی CMS نباید محتوای مدیر را با fallback جایگزین یا مقاله واقعی را ۴۰۴ کند.
    assert.equal((await get('/blog/tire-dot-date-guide')).status, 500);
    assert.equal((await get('/blog/cms-unsafe')).status, 500);
    assert.equal((await get('/blog')).status, 500);
    const offlineMap = await get('/sitemap.xml');
    assert.equal(offlineMap.status, 500);
    const offlineProducts = await get('/products');
    assert.ok(offlineProducts.text.includes('دریافت محصولات فعلاً ممکن نیست'));
    assert.ok(!offlineProducts.text.includes('/products/tire-01'));
    assert.equal((await get('/category/passenger')).status, 500);
    assert.equal((await get('/category/custom-category')).status, 500);
    assert.equal((await get('/products/test-tire-01')).status, 500);
    const offlineBrand = await get('/brands/barz');
    assert.equal(offlineBrand.status, 200);
    assert.ok(offlineBrand.text.includes('دریافت فهرست محصولات فعلاً ممکن نیست'));
    assert.ok(!offlineBrand.text.includes('/products/tire-01'));
    assert.equal((await get('/blog/when-to-change-tires')).status, 500);
    apiAvailable = true;
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
