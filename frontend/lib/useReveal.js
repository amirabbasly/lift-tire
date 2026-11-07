'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * قلاب ورود ایمن (fail-safe reveal)
 *
 * چرا؟ framer-motion در SSR، مقدار `initial` را به‌صورت inline در HTML می‌نویسد
 * (مثلاً opacity:0). اگر hydration به هر دلیلی کامل نشود — یک خطای runtime
 * در وسط درخت، مسدودشدن اسکریپت، یا نبود IntersectionObserver — آن عناصر
 * برای همیشه نامرئی می‌مانند در حالی که محتوا در DOM هست. نتیجه: «صفحه خالی».
 *
 * این قلاب همیشه `shouldAnimate=false` را در اولین رندر برمی‌گرداند تا
 * محتوا در HTML اولیه دیده شود؛ بعد از mount، اگر شرایط مهیا بود انیمیشن اجرا می‌شود.
 */
export default function useReveal({ margin = '0px 0px -8% 0px', once = true, delay = 0 } = {}) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false); // بعد از mount true می‌شود
  const [inView, setInView] = useState(false);

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;

    // اگر از قبل در دید است، بدون انیمیشن نشان بده
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setInView(true);
      return;
    }

    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setInView(true);
            if (once && io) io.disconnect();
          }
        },
        { rootMargin: margin, threshold: 0.01 },
      );
      io.observe(el);
    }

    // تایمر ایمنی: محتوا هرگز پنهان نمی‌ماند
    const safety = setTimeout(() => setInView(true), 1500);

    return () => {
      if (io) io.disconnect();
      clearTimeout(safety);
    };
  }, [reduce, margin, once]);

  return {
    ref,
    reduce,
    /** بعد از mount آماده‌ایم — اما انیمیشن فقط وقتی اجرا می‌شود که در دید باشد */
    ready,
    shown: reduce || inView,
    delay,
  };
}
