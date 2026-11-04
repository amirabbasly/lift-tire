import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USE_PGLITE = String(process.env.USE_PGLITE ?? (process.env.DATABASE_URL ? 'false' : 'true')) === 'true';
const PGDATA = process.env.PGDATA || path.join(__dirname, '..', 'data', 'pglite');

let pglite = null;
let pool = null;
let ready = false;

async function init() {
  if (ready) return;
  if (USE_PGLITE) {
    const { PGlite } = await import('@electric-sql/pglite');
    fs.mkdirSync(PGDATA, { recursive: true });
    pglite = new PGlite(PGDATA);
    await pglite.waitReady;
  } else {
    const { default: pg } = await import('pg');
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
  }
  ready = true;
  await applySchema();
}

async function applySchema() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  if (pglite) await pglite.exec(sql);
  else await pool.query(sql);
}

/** Run a query with $1..$n placeholders. Returns { rows }. */
export async function query(text, params = []) {
  if (!ready) {
    // bootstrap (schema execution calls back here)
    if (pglite || pool) {
      return pglite ? pglite.query(text, params) : pool.query(text, params);
    }
    await init();
  }
  if (pglite) {
    const res = await pglite.query(text, params);
    if (res && res.rowCount === undefined) {
      // PGlite از affectedRows استفاده می‌کند؛ برای سازگاری با pg نرمال می‌کنیم
      res.rowCount = res.affectedRows ?? res.rows.length;
    }
    return res;
  }
  return pool.query(text, params);
}

export async function one(text, params = []) {
  const res = await query(text, params);
  return res.rows[0] || null;
}

export async function many(text, params = []) {
  const res = await query(text, params);
  return res.rows;
}

export async function exec(text) {
  if (pglite) return pglite.exec(text);
  return pool.query(text);
}

export const db = { init, query, one, many, exec, isPglite: () => USE_PGLITE };
export default db;
