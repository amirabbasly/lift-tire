import { SITE } from '@/lib/constants';
import { serverGet } from '@/lib/api';
import { BRAND_GUIDES, brandPath } from '@/lib/brand-guides';
import { getMagazinePosts, magazineCategory, MAGAZINE_CATEGORIES, MAGAZINE_PAGE_SIZE, magazinePath, pagePath } from '@/lib/magazine';
import { validIsoDate } from '@/lib/seo';

// محتوا از API لحظه‌ای است؛ از نگه‌داشتن نقشه ناقص پس از قطعی پرهیز شود.
export const dynamic = 'force-dynamic';

async function allActiveProducts() {
  // API در هر درخواست حداکثر ۶۰ محصول می‌دهد؛ درخواست ۲۰۰ تایی قبلی عملاً به ۶۰ محدود می‌شد.
  const first = await serverGet('/products?limit=60&page=1', null);
  if (!Array.isArray(first?.items)) throw new Error('Cannot build a complete product sitemap: API unavailable.');
  const products = [...first.items];
  const pages = Number(first.pages);
  if (!Number.isSafeInteger(pages) || pages < 1) throw new Error('Cannot build a complete product sitemap: invalid pagination.');
  for (let start = 2; start <= pages; start += 10) {
    const results = await Promise.all(Array.from({ length: Math.min(10, pages - start + 1) }, (_, index) => serverGet(`/products?limit=60&page=${start + index}`, null)));
    if (results.some((result) => !Array.isArray(result?.items))) throw new Error('Cannot build a complete product sitemap: an API page failed.');
    for (const result of results) products.push(...result.items);
  }
  return products;
}

export default async function sitemap() {
  const [products, posts, categoryResponse] = await Promise.all([
    allActiveProducts(), getMagazinePosts('sitemap'), serverGet('/categories', null),
  ]);
  if (!Array.isArray(categoryResponse)) throw new Error('Cannot build a complete category sitemap: API unavailable.');
  const categories = categoryResponse;
  const paths = ['', '/products', '/blog', '/about', '/contact', '/faq'];
  const entries = paths.map((path) => ({ url: `${SITE.url}${path || '/'}` }));
  const add = (path, updatedAt) => ({ url: `${SITE.url}${path}`, ...(validIsoDate(updatedAt) ? { lastModified: validIsoDate(updatedAt) } : {}) });

  entries.push(...categories.filter((category) => category?.slug).map((category) => add(`/category/${encodeURIComponent(category.slug)}`, category.updated_at)));
  entries.push(...BRAND_GUIDES.map((guide) => add(brandPath(guide.slug))));
  entries.push(...products.filter((product) => product?.slug).map((product) => add(`/products/${encodeURIComponent(product.slug)}`, product.updated_at)));
  entries.push(...posts.filter((post) => post?.slug).map((post) => add(magazinePath(post.slug), post.updated_at)));

  const allPages = Math.ceil(posts.length / MAGAZINE_PAGE_SIZE);
  for (let page = 2; page <= allPages; page++) entries.push(add(pagePath('/blog', page)));
  for (const category of MAGAZINE_CATEGORIES) {
    const path = `/blog/category/${category.slug}`;
    entries.push(add(path));
    const pages = Math.ceil(posts.filter((post) => magazineCategory(post) === category.slug).length / MAGAZINE_PAGE_SIZE);
    for (let page = 2; page <= pages; page++) entries.push(add(pagePath(path, page)));
  }
  // اگر slug تکراری باشد، تنها یک URL کنونیکال صادر می‌شود.
  return [...new Map(entries.map((entry) => [entry.url, entry])).values()];
}
