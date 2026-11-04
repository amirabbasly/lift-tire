const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

/** تبدیل ارقام لاتین به فارسی */
export function faNum(value) {
  return String(value ?? '').replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function enNum(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** جداکننده هزارگان + ارقام فارسی */
export function formatNumber(n) {
  const num = Number(n || 0);
  return faNum(num.toLocaleString('en-US'));
}

export function formatPrice(n) {
  return formatNumber(n);
}

export function toman(n) {
  return `${formatNumber(n)} تومان`;
}

export function discountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

export function formatDate(input, withTime = false) {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** مسیر تصویر: آپلودهای بک‌اند از طریق پروکسی /uploads سرو می‌شوند */
export function assetUrl(path) {
  if (!path) return '/images/products/tire-passenger-a.png';
  if (/^(https?:)?\/\//.test(path)) return path;
  if (path.startsWith('/uploads')) return `${API_BASE}${path}`;
  return path;
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

/** شمارش معکوس ثابت روزانه (پیشنهاد لحظه‌ای) */
export function dailyCountdown() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}
