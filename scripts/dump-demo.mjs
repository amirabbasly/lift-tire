// داده دمو را از API در حال اجرا می‌گیرد و برای fallback فرانت‌اند ذخیره می‌کند.
import fs from 'node:fs';
const base = process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000';
const get = async (p) => (await fetch(base + '/api' + p)).json();
const home = await get('/home');
const products = await get('/products?limit=60&sort=newest');
const posts = await get('/posts');
const out = { generatedAt: new Date().toISOString(), home, products: products.items, posts };
fs.mkdirSync('frontend/lib', { recursive: true });
fs.writeFileSync('frontend/lib/demo-data.json', JSON.stringify(out, null, 1));
console.log('saved', out.products.length, 'products,', posts.length, 'posts');
