import { SITE } from '@/lib/constants';
import { serverGet } from '@/lib/api';
import demo from '@/lib/demo-data.json';

export const revalidate = 3600;

export default async function sitemap() {
  const base = SITE.url;
  const now = new Date();

  const staticPaths = ['', '/products', '/blog', '/about', '/contact', '/faq', '/track'];
  const staticEntries = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : p === '/products' ? 0.9 : 0.6,
  }));

  let products = demo?.products || [];
  let posts = demo?.posts || [];
  let categories = [];

  const [prodRes, postRes, catRes] = await Promise.all([
    serverGet('/products?limit=200', null),
    serverGet('/posts', null),
    serverGet('/categories', null),
  ]);

  if (prodRes?.items?.length) products = prodRes.items;
  if (Array.isArray(postRes) && postRes.length) posts = postRes;
  if (Array.isArray(catRes) && catRes.length) categories = catRes;

  const productEntries = products
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const categoryEntries = categories
    .filter((c) => c?.slug)
    .map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const postEntries = posts
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.published_at ? new Date(p.published_at) : now,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...postEntries];
}
