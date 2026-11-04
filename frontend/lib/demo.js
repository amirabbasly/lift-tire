import data from './demo-data.json';

export const demoData = data;
export const demoHome = data.home || { settings: {}, banners: { hero: [], strip: [], category: [] }, categories: [], brands: [], featured: [], bestsellers: [], newest: [], deals: [], posts: [] };
export const demoProducts = data.products || [];
export const demoPosts = data.posts || [];

export function demoProduct(slug) {
  return demoProducts.find((p) => p.slug === slug) || demoProducts[0] || null;
}

export function demoFilter(params = {}) {
  let items = [...demoProducts];
  if (params.category) {
    const cat = String(params.category);
    items = items.filter((p) => p.category?.slug === cat);
  }
  if (params.brand) {
    const brands = String(params.brand).split(',');
    items = items.filter((p) => brands.includes(p.brand?.slug));
  }
  for (const key of ['width', 'ratio', 'rim']) {
    if (params[key]) items = items.filter((p) => Number(p[key]) === Number(params[key]));
  }
  if (params.q) {
    const q = String(params.q).toLowerCase();
    items = items.filter((p) => `${p.name} ${p.size} ${p.brand?.name_fa} ${p.brand?.name_en}`.toLowerCase().includes(q));
  }
  if (params.sort === 'cheapest') items.sort((a, b) => a.price - b.price);
  if (params.sort === 'expensive') items.sort((a, b) => b.price - a.price);
  if (params.sort === 'bestseller') items.sort((a, b) => b.sold_count - a.sold_count);
  if (params.sort === 'popular') items.sort((a, b) => b.rating - a.rating);
  const limit = Number(params.limit || 12);
  const page = Number(params.page || 1);
  return { items: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit, pages: Math.max(1, Math.ceil(items.length / limit)) };
}
