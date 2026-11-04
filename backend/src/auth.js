import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { one } from './db.js';
import { fail } from './helpers.js';

const SECRET = process.env.JWT_SECRET || 'lift-tire-dev-secret-change-me';
const EXPIRES = '30d';

export const hash = (plain) => bcrypt.hashSync(plain, 10);
export const compare = (plain, hashed) => bcrypt.compareSync(plain, hashed || '');

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function bearer(req) {
  const h = req.headers.authorization || '';
  if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
  return null;
}

export function optionalAuth(req, _res, next) {
  const t = bearer(req);
  if (t) {
    const p = verifyToken(t);
    if (p) req.user = p;
  }
  next();
}

export async function requireAdmin(req, res, next) {
  const p = verifyToken(bearer(req) || '');
  if (!p || p.role !== 'admin') return fail(res, 'دسترسی غیرمجاز. لطفاً دوباره وارد شوید.', 401);
  const admin = await one('SELECT id, email, name FROM admins WHERE id = $1', [p.id]);
  if (!admin) return fail(res, 'حساب مدیر یافت نشد.', 401);
  req.admin = admin;
  next();
}

export async function requireCustomer(req, res, next) {
  const p = verifyToken(bearer(req) || '');
  if (!p || p.role !== 'customer') return fail(res, 'برای این کار باید وارد حساب خود شوید.', 401);
  const c = await one('SELECT id, phone, name, email, created_at FROM customers WHERE id = $1', [p.id]);
  if (!c) return fail(res, 'حساب کاربری یافت نشد.', 401);
  req.customer = c;
  next();
}
