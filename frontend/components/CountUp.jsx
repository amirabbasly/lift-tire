'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { faNum } from '@/lib/format';

// در سرور به useEffect برمی‌گردد تا خطای hydration ندهد
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/**
 * رشته فارسی مثل «۴۰۰۰+» یا «۱۲,۵۰۰ تومان» را به عدد و پیشوند/پسوند تبدیل می‌کند.
 * جداکننده‌های هزارگان (ٔ ، ,) هم بخشی از خودِ عدد در نظر گرفته می‌شوند،
 * وگرنه شمارنده روی اولین رقم متوقف می‌شد.
 */
function parse(value) {
  const str = String(value ?? '').trim();
  const m = str.match(/([۰-۹0-9][۰-۹0-9٬،,٫.]*)/);
  if (!m) return null;
  const raw = m[1];
  const num = Number(
    raw
      .replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d))
      .replace(/[٬،,٫.]/g, '')
      .replace(/[^\d]/g, ''),
  );
  if (!Number.isFinite(num)) return null;
  return { num, prefix: str.slice(0, m.index), suffix: str.slice(m.index + raw.length) };
}

/**
 * شمارنده اعداد فارسی با حفظ پیشوند/پسوند (۴۰۰۰+، ۹۸٪، ۲۴ ساعت).
 *
 * • مقدار نهایی همیشه در SSR رندر می‌شود؛ هیچ‌وقت جای خالی نمی‌ماند.
 * • انیمیشن بعد از hydration اجرا می‌شود:
 *     trigger="view"  → وقتی عنصر وارد دید شد (پیش‌فرض)
 *     trigger="mount" → بلافاصله بعد از mount (برای هیرو که بالای صفحه است)
 * • قبل از شروع، عدد به صفر برمی‌گردد تا پرش «مقدار نهایی → صفر» دیده نشود،
 *   سپس آرام از صفر تا مقدار نهایی بالا می‌رود.
 * • اگر عنصر هرگز وارد دید نشود، مقدار نهایی نمایش داده می‌شود.
 */
export default function CountUp({
  value,
  duration = 1500,
  delay = 0,
  className = '',
  as: Tag = 'span',
  trigger = 'view',
}) {
  // مهم: parse باید مemoize شود، وگرنه در هر رندر آبجکت تازه می‌سازد و
  // افکت انیمیشن با هر رندر کنسل و از نو اجرا می‌شد (عدد روی صفر می‌ماند).
  const parsed = useMemo(() => parse(value), [value]);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(parsed ? parsed.num : 0);
  const [run, setRun] = useState(false);
  const started = useRef(false);

  const shouldRun = trigger === 'mount' ? true : inView;

  useEffect(() => {
    if (!shouldRun || !parsed || reduce) return;
    const t = setTimeout(() => setRun(true), delay);
    return () => clearTimeout(t);
  }, [shouldRun, parsed, reduce, delay]);

  // لحظهٔ شروع: عدد را صفر کن تا شمارش واقعاً از صفر آغاز شود
  useIsoLayoutEffect(() => {
    if (run && parsed && !reduce) setDisplay(0);
  }, [run, parsed, reduce]);

  useEffect(() => {
    if (!run || !parsed || reduce || started.current) return;
    started.current = true;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic: شروع نرم و آرام، پایان ملایم
      const eased = p === 1 ? 1 : 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(parsed.num * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, parsed, duration, reduce]);

  if (!parsed) return <Tag className={`num-fa ${className}`}>{faNum(value)}</Tag>;

  return (
    <Tag ref={ref} className={`num-fa ${className}`}>
      {parsed.prefix}
      <span className="tabular-nums">{faNum(display)}</span>
      {parsed.suffix}
    </Tag>
  );
}
