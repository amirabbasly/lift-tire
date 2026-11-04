import crypto from 'node:crypto';

const SECRET = process.env.JWT_SECRET || 'lift-tire-dev-secret-change-me';

/**
 * درگاه پرداخت شبیه‌سازی‌شده.
 * توکن با HMAC امضا می‌شود تا بازگشت از درگاه قابل اعتماد باشد.
 */
export function createPaymentSession({ orderCode, amount }) {
  const ref = 'MOCK-' + crypto.randomBytes(6).toString('hex').toUpperCase();
  const t = Date.now();
  const sig = crypto.createHmac('sha256', SECRET).update(`${orderCode}|${amount}|${ref}|${t}`).digest('hex').slice(0, 32);
  return { ref, token: `${ref}.${t}.${sig}`, amount, orderCode };
}

export function verifyPaymentToken(token, order) {
  if (!token || typeof token !== 'string') return null;
  const [ref, t, sig] = token.split('.');
  if (!ref || !t || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(`${order.code}|${order.total}|${ref}|${t}`).digest('hex').slice(0, 32);
  if (expected !== sig) return null;
  if (Date.now() - Number(t) > 1000 * 60 * 60 * 2) return null;
  return { ref, paidAt: Number(t) };
}
