import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import customerRoutes from './routes/customer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 4000);
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'));

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: db.isPglite() ? 'pglite' : 'postgres', time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', error: 'اتصال به پایگاه داده برقرار نشد.' });
  }
});

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'مسیر مورد نظر یافت نشد.' });
});

app.use((err, _req, res, _next) => {
  console.error('[api error]', err);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const msg = err.code === 'LIMIT_FILE_SIZE' ? 'حجم تصویر نباید بیشتر از ۵ مگابایت باشد.' : (err.publicMessage || 'خطای سرور. لطفاً دوباره تلاش کنید.');
  res.status(status).json({ error: msg });
});

async function start() {
  await db.init();
  // روی PM2 فقط لوکال‌هاست؛ داخل داکر HOST=0.0.0.0 لازم است
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`✅ Lift Tire API روی http://${HOST}:${PORT} فعال شد (${db.isPglite() ? 'PGlite' : 'PostgreSQL'})`);
    console.log(`   uploads → ${UPLOAD_DIR}`);
  });
}

start().catch((e) => {
  console.error('خطا در راه‌اندازی سرور:', e);
  process.exit(1);
});
