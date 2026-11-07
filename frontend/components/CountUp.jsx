'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { faNum } from '@/lib/format';

// در سرور به useEffect برمی‌گردد تا خطای hydration ندهد
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** رشته فارسی مثل «۴۰۰۰+» را به عدد و پیشوند/پسوند تبدیل می‌کند */
function parse(value) {
  const str = String(value ?? '').trim();
  const m = str.match(/([۰-۹0-9]+)/);
  if (!m) return null;
  const raw = m[1];
  const num = Number(raw.replace(/[۰-۹]/g, (d) => FA_DIGITS.indexOf(d)).replace(/[^\d]/g, ''));
  if (!Number.isFinite(num)) return null;
  return { num, prefix: str.slice(0, m.index), suffix: str.slice(m.index + raw.length), pad: raw.length };
}

/**
 * شمارنده اعداد فارسی با حفظ پیشوند/پسوند (۴۰۰۰+، ۹۸٪، ۲۴ ساعت).
 * مقدار نهایی همیشه در SSR رندر می‌شود؛ انیمیشن فقط بعد از hydration
 * و وقتی عنصر وارد دید شود اجرا می‌شود — پس هیچ‌وقت جای خالی نمی‌ماند.
 */
export default function CountUp({ value, duration = 1500, className = '', as: Tag = 'span' }) {
  const parsed = parse(value);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(parsed ? parsed.num : 0);
  const started = useRef(false);

  // قبل از رنگ‌آمیزی، عدد را صفر کن تا پرش «مقدار نهایی → صفر» دیده نشود
  useIsoLayoutEffect(() => {
    if (!parsed || reduce) return;
    if (inView) setDisplay(0);
  }, [inView, reduce]);

  useEffect(() => {
    if (!parsed || reduce || !inView || started.current) return;
    started.current = true;
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutExpo برای حس «پر شدن» سریع در ابتدا و توقف نرم در انتها
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setDisplay(Math.round(parsed.num * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [parsed, inView, duration, reduce]);

  if (!parsed) return <Tag className={`num ${className}`}>{faNum(value)}</Tag>;

  return (
    <Tag ref={ref} className={`num ${className}`}>
      {parsed.prefix}
      <span className="tabular-nums">{faNum(display)}</span>
      {parsed.suffix}
    </Tag>
  );
}
