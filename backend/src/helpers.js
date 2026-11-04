import crypto from 'node:crypto';

export const ok = (res, data, status = 200) => res.status(status).json(data);
export const fail = (res, message, status = 400) => res.status(status).json({ error: message });

export function toInt(v, def = null) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number.parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(n) ? def : n;
}
export function toBool(v) {
  return v === true || v === 'true' || v === '1' || v === 1 || v === 'on';
}
export function str(v, def = '') {
  return typeof v === 'string' ? v.trim() : def;
}
export function slugify(input) {
  const base = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'item-' + crypto.randomBytes(3).toString('hex');
}
export function orderCode() {
  const d = new Date();
  const p = `${d.getFullYear()}`.slice(2) + String(d.getMonth() + 1).padStart(2, '0');
  return `LT-${p}-${crypto.randomInt(100000, 999999)}`;
}
export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
}
export function isPhone(v) {
  return /^09\d{9}$/.test(String(v || '').replace(/[^\d]/g, ''));
}
export function cleanPhone(v) {
  return String(v || '').replace(/[^\d]/g, '').replace(/^0098/, '0').replace(/^98/, '0').slice(-11);
}
export function paginate(req) {
  const page = Math.max(1, toInt(req.query.page, 1));
  const limit = Math.min(60, Math.max(1, toInt(req.query.limit, 12)));
  return { page, limit, offset: (page - 1) * limit };
}
export function like(v) {
  return `%${String(v).replace(/[%_]/g, (m) => '\\' + m)}%`;
}
