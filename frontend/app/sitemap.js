import { SITE } from '@/lib/constants';
import { serverGet } from '@/lib/api';
import { demoHome } from '@/lib/demo';
import { getMagazinePosts, magazineCategory, MAGAZINE_CATEGORIES, MAGAZINE_PAGE_SIZE, magazinePath, pagePath } from '@/lib/magazine';
import { validIsoDate } from '@/lib/seo';

export const revalidate = 3600;

async function allActiveProducts() {
  // API در هر درخواست حداکثر ۶۰ محصول می‌دهد؛ درخواست ۲۰۰ تایی قبلی عملاً به ۶۰ محدود می‌شد.
  const first = await serverGet('/products?limit=60&page=1', null);
  if (!Array.isArray(first?.items)) return []; // مسیر محصول بدون API واقعی ۴۰۴ است؛ دموی غیرقابل دسترس را وارد sitemap نکنید.
  const products = [...first.items];
  const pages = Number.isSafeInteger(Number(first.pages)) ? Math.max(1, Number(first.pages)) : 1;
  for (let start = 2; start <= pages; start += 10) {
    const results = await Promise.all(Array.from({ length: Math.min(10, pages - start + 1) }, (_, index) => serverGet(`/products?limit=60&page=${start + index}`, null)));
    if (results.some((result) => !Array.isArray(result?.items))) throw new Error('Cannot build a complete product sitemap: an API page failed.');
    for (const result of results) products.push(...result.items);
  }
  return products;
}

export default async function sitemap() {
  const [products, posts, categoryResponse] = await Promise.all([
    allActiveProducts(), getMagazinePosts(), serverGet('/categories', null),
  ]);
  const categories = Array.isArray(categoryResponse) ? categoryResponse : demoHome.categories;
  const paths = ['', '/products', '/blog', '/about', '/contact', '/faq'];
  const entries = paths.map((path) => ({ url: `${SITE.url}${path || '/'}` }));
  const add = (path, updatedAt) => ({ url: `${SITE.url}${path}`, ...(validIsoDate(updatedAt) ? { lastModified: validIsoDate(updatedAt) } : {}) });

  entries.push(...categories.filter((category) => category?.slug).map((category) => add(`/category/${encodeURIComponent(category.slug)}`, category.updated_at)));
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
