'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { assetUrl } from '@/lib/format';
import { IconArrowLeft, IconPhone, IconRuler } from './Icons';

const ROLL_MS = 6500;

/**
 * کارت «مطمئن نیستید چه سایزی نیاز دارید؟»
 *
 * لاستیک این کارت مدام روی زمین می‌غلتَد: می‌چرخَد و از راست به چپ
 * عبور می‌کند (چرخش هم‌راستا با غلتیدن)، سایه‌اش روی زمین همراه او
 * می‌آید و خط سرعت پشتش حرکت را واضح می‌کند. عرض کارت اندازه‌گیری
 * می‌شود تا لاستیک دقیقاً از لبهٔ راست خارج شود و در لبهٔ چپ وارد،
 * پس هیچ‌وقت نیمه‌کاره در کادر نمی‌ماند.
 */
export default function SizeGuideCard({ settings }) {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const rollRef = useRef(null);
  const [roll, setRoll] = useState(null);
  const phone = String(settings?.phone || '').replace(/[^\d+]/g, '');

  useEffect(() => {
    const track = trackRef.current;
    const roll = rollRef.current;
    if (!track || !roll) return;
    const measure = () => {
      const w = track.clientWidth;
      const tw = roll.offsetWidth;
      if (w && tw) setRoll({ from: w, to: -tw });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    ro.observe(roll);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/[.06] bg-graphite-900 p-5 text-white shadow-card md:p-6">
      <div className="tire-pattern absolute inset-0 opacity-40" />
      {/* هالهٔ نارنجی پشت لاستیک */}
      <div className="pointer-events-none absolute -left-16 -bottom-14 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />

      {/* لاستیک در حال غلتیدن — پایین کارت */}
      <div ref={trackRef} className="pointer-events-none absolute inset-x-0 bottom-0 h-32 overflow-hidden">
        <motion.div
          ref={rollRef}
          className="absolute bottom-0 h-[104px] w-auto sm:h-[118px]"
          initial={false}
          animate={
            reduce || !roll
              ? { x: roll ? (roll.from + roll.to) / 2 : 0 }
              : { x: [roll.from, roll.to], rotate: [0, -360] }
          }
          transition={
            reduce || !roll
              ? { duration: 0 }
              : { duration: ROLL_MS / 1000, repeat: Infinity, repeatType: 'loop', ease: 'linear' }
          }
        >
          {/* سایهٔ متحرک روی زمین */}
          <span className="absolute bottom-1.5 left-1/2 h-3 w-24 -translate-x-1/2 rounded-[50%] bg-black/60 blur-md sm:w-28" />
          {/* خط سرعت پشت لاستیک */}
          <span className="absolute bottom-11 right-full mr-2 h-[2px] w-16 origin-left rounded-full bg-gradient-to-l from-accent/80 to-transparent sm:w-20" />
          <img
            src={assetUrl('/images/hero/tire-glow.webp')}
            alt=""
            aria-hidden="true"
            className="relative h-full w-auto max-w-none drop-shadow-[0_16px_22px_rgba(0,0,0,.6)]"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </div>

      <div className="relative max-w-[62%] sm:max-w-[58%]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent">
          <IconRuler width={13} height={13} />
          راهنمای سایز
        </span>
        <h3 className="mt-2.5 text-lg font-extrabold leading-7">مطمئن نیستید چه سایزی نیاز دارید؟</h3>
        <p className="mt-1.5 text-[11.5px] leading-5 text-white/55">
          کارشناسان ما با توجه به مدل خودرو و سبک رانندگی شما بهترین گزینه را پیشنهاد می‌دهند.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {phone && (
            <a href={`tel:${phone}`} className="btn-accent !px-4 !py-2 text-[11px]">
              <IconPhone width={13} height={13} /> مشاوره تلفنی
            </a>
          )}
          <a
            href="/blog/how-to-read-tire-size"
            className="inline-flex items-center gap-1 rounded-xl border border-white/20 px-4 py-2 text-[11px] font-bold text-white/80 transition hover:border-accent hover:text-accent"
          >
            آموزش خواندن سایز <IconArrowLeft width={13} height={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
