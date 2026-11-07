'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { IconChevron, IconArrowLeft } from './Icons';
import { assetUrl } from '@/lib/format';
import { usePointerFine } from '@/lib/useMedia';
import CountUp from './CountUp';

const SLIDE_MS = 6400;

/* ───────────── مسیر دو لایهٔ هر اسلاید ─────────────
   هر بنر دو تصویر دارد:
     <name>-bg.jpg    پس‌زمینهٔ صحنه (بدون لاستیک)
     <name>-tire.webp لاستیک برش‌خورده با پس‌زمینهٔ شفاف
   اگر این دو فایل نباشند (بنر آپلودی مدیر)، به حالت قدیمی
   «کل عکس حرکت می‌کند» برمی‌گردیم تا هیچ‌وقت هیرو خالی نشود.      */
const swapExt = (path, suffix, ext) => String(path || '').replace(/\.[a-z0-9]+$/i, '') + suffix + ext;
const bgOf = (s) => s.bg_image || swapExt(s.image, '-bg', '.jpg');
const tireOf = (s) => s.tire_image || swapExt(s.image, '-tire', '.webp');

/* ───────────── کورئوگرافی لاستیک ─────────────
   enter  → لاستیک از بیرون کادر (سمت مقابل) می‌آید؛ همزمان می‌چرخَد
            (چرخش مخالف جهت حرکت، مثل چرخِ در حال غلتیدن)
   rest   → غلتیدن تا جای خودش، «ضربهٔ ترمز»: کمی از هدف عبور می‌کند،
            برمی‌گردد، لرزش کوتاه می‌گیرد و می‌ایستد
   leave  → تیک‌آف: لاستیک روی جایش تند می‌چرخَد (اسپین) و با کشیده‌شدن
            خط سرعت و محو شدن از کادر بیرون می‌رود.                       */
const tireVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '66vw' : '-66vw',
    rotate: dir > 0 ? -190 : 190,
    scale: 1.05,
    opacity: 0,
    filter: 'blur(10px)',
  }),
  rest: (dir) => ({
    x: dir > 0
      ? ['66vw', '11vw', '-1.8vw', '0.8vw', '0vw']
      : ['-66vw', '-11vw', '1.8vw', '-0.8vw', '0vw'],
    rotate: dir > 0 ? [-190, -26, 11, -3, 0] : [190, 26, -11, 3, 0],
    scale: [1.05, 1.008, 0.994, 1, 1],
    opacity: [0, 0.3, 1, 1, 1],
    filter: ['blur(10px)', 'blur(2px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
    transition: {
      duration: 1.3,
      times: [0, 0.44, 0.64, 0.83, 1],
      ease: [0.16, 1, 0.3, 1],
    },
  }),
  leave: (dir) => ({
    // تیک‌آف: می‌چرخَد و از کادر بیرون می‌رود
    x: dir > 0 ? ['0vw', '-8vw', '-84vw'] : ['0vw', '8vw', '84vw'],
    rotate: dir > 0 ? [0, -70, -540] : [0, 70, 540],
    scale: [1, 1.04, 0.9],
    opacity: [1, 1, 0],
    filter: ['blur(0px)', 'blur(1px)', 'blur(9px)'],
    transition: { duration: 0.82, times: [0, 0.36, 1], ease: [0.5, 0, 0.9, 0.4] },
  }),
};

// حالت تقسیم‌شده: پس‌زمینه فقط محو/ظاهر می‌شود، لاستیک کار خودش را می‌کند
const bgFade = {
  enter: { opacity: 0 },
  rest: { opacity: 1, transition: { duration: 0.85, ease: 'easeOut' } },
  leave: { opacity: 0, transition: { duration: 0.7, ease: 'easeIn' } },
};

// حالت قدیمی (وقتِی لاستیک جدا نیست): کل عکس تیک‌آف می‌کند و می‌رود
const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '46%' : '-46%',
    rotate: dir > 0 ? -2.4 : 2.4,
    scale: 1.16,
    opacity: 0,
    filter: 'blur(7px)',
  }),
  rest: (dir) => ({
    x: dir > 0 ? ['46%', '10%', '-1.2%', '0.6%', '0%'] : ['-46%', '-10%', '1.2%', '-0.6%', '0%'],
    rotate: dir > 0 ? [-2.4, -1.1, 0.45, -0.2, 0] : [2.4, 1.1, -0.45, 0.2, 0],
    scale: [1.16, 1.06, 1.005, 1.002, 1],
    opacity: [0, 1, 1, 1, 1],
    filter: ['blur(7px)', 'blur(1px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
    transition: { duration: 1.15, times: [0, 0.5, 0.78, 0.9, 1], ease: [0.16, 1, 0.3, 1] },
  }),
  leave: (dir) => ({
    x: dir > 0 ? '-52%' : '52%',
    rotate: dir > 0 ? [0, -1.6, -6] : [0, 1.6, 6],
    scale: [1, 1.06, 0.9],
    opacity: [1, 1, 0],
    filter: ['blur(0px)', 'blur(1.2px)', 'blur(7px)'],
    transition: { duration: 0.68, times: [0, 0.4, 1], ease: [0.4, 0, 0.9, 0.5] },
  }),
};

// حالت کاهش حرکت: فقط fade ساده
const reducedSlide = {
  enter: { opacity: 0 },
  rest: { opacity: 1, transition: { duration: 0.3 } },
  leave: { opacity: 0, transition: { duration: 0.3 } },
};

// زوم آرام پس‌زمینه در طول نمایش اسلاید
const kenBurns = {
  start: { scale: 1 },
  end: { scale: 1.07, transition: { duration: 8, ease: 'linear' } },
};

/** جلوه‌های «ترمز گرفتن» روی محل ایستادن لاستیک */
function BrakeFx() {
  return (
    <span className="pointer-events-none absolute inset-0">
      {/* دود بلند شدن هنگام ترمز */}
      <motion.span
        className="absolute bottom-[6%] left-1/2 h-[46%] w-[78%] -translate-x-1/2 rounded-full bg-white/25 blur-3xl"
        initial={{ opacity: 0, scale: 0.5, y: 26 }}
        animate={{ opacity: [0, 0.55, 0.22, 0], scale: [0.5, 1.05, 1.4, 1.65], y: [26, 2, -18, -34] }}
        transition={{ duration: 1.7, delay: 0.62, times: [0, 0.32, 0.66, 1], ease: 'easeOut' }}
      />
      {/* خط سرعت — حس ایستادن ناگهانی */}
      <motion.span
        className="absolute bottom-[30%] left-1/2 h-[2px] w-[62%] origin-right rounded-full bg-gradient-to-r from-transparent via-white/75 to-white"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 0.9, 0], scaleX: [0, 1, 1.5] }}
        transition={{ duration: 0.55, delay: 0.62, times: [0, 0.5, 1], ease: 'easeOut' }}
      />
      <motion.span
        className="absolute bottom-[22%] left-1/2 h-[2px] w-[48%] origin-right rounded-full bg-gradient-to-r from-transparent via-accent/60 to-accent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 0.85, 0], scaleX: [0, 1, 1.35] }}
        transition={{ duration: 0.6, delay: 0.68, times: [0, 0.5, 1], ease: 'easeOut' }}
      />
      {/* اصطکاک لاستیک با زمین */}
      <motion.span
        className="absolute bottom-[2%] left-1/2 h-[16%] w-[80%] -translate-x-1/2 rounded-[50%] bg-accent/25 blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 0.95, delay: 0.72, times: [0, 0.55, 1], ease: 'easeOut' }}
      />
    </span>
  );
}

export default function HeroSlider({ slides = [], stats = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const reduce = useReducedMotion();
  const pointerFine = usePointerFine();
  // انیمیشن ورود فقط بعد از hydration؛ در SSR متن هیرو همیشه مرئی است
  const [animate, setAnimate] = useState(false);
  useEffect(() => setAnimate(true), []);
  // آیا تصاویر تقسیم‌شده (پس‌زمینه + لاستیک) در دسترس هستند؟
  const [split, setSplit] = useState(true);
  const rootRef = useRef(null);
  const touchStart = useRef(0);

  const count = slides.length;
  const go = useCallback(
    (dir) => {
      if (!count) return;
      setDirection(dir);
      setIndex((i) => (i + dir + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || reduce || count <= 1) return;
    const t = setTimeout(() => go(1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduce, count, go]);

  if (!count) return null;
  const slide = slides[index];
  const slideStats = stats.length
    ? stats
    : [
        { value: slide.stat1_value || '۴۰۰۰+', label: slide.stat1_label || 'مشتری راضی' },
        { value: slide.stat2_value || '۲۰', label: slide.stat2_label || 'سال تجربه' },
      ];

  return (
    <section
      ref={rootRef}
      className="relative isolate overflow-hidden bg-graphite-900"
      onMouseEnter={() => pointerFine && setPaused(true)}
      onMouseLeave={() => pointerFine && setPaused(false)}
      onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 48) go(dx > 0 ? -1 : 1);
        touchStart.current = 0;
      }}
      aria-label="اسلایدر معرفی"
    >
      <div className="relative h-[480px] w-full sm:h-[520px] lg:h-[600px]">
        {/* ======= تصویر اسلاید =======
            حالت تقسیم‌شده: پس‌زمینهٔ صحنه ثابت می‌ماند و فقط لاستیک
            تیک‌آف می‌کند، می‌چرخَد و می‌رود؛ لاستیک بعدی از سمت مقابل
            می‌آید، می‌غلتَد و با لرزش کوتاه ترمز می‌گیرد.            */}
        <AnimatePresence mode="sync" initial={false} custom={direction}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            style={{ transformOrigin: '34% 66%' }}
            custom={direction}
            variants={reduce ? reducedSlide : split ? bgFade : slideVariants}
            initial="enter"
            animate="rest"
            exit="leave"
          >
            <motion.img
              src={assetUrl(split ? bgOf(slide) : slide.image)}
              alt={slide.title || 'بنر لیفت تایر'}
              className="h-full w-full object-cover object-left"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onError={() => setSplit(false)}
              variants={reduce ? undefined : kenBurns}
              initial="start"
              animate="end"
            />
          </motion.div>
        </AnimatePresence>

        {/* ======= لاستیک — جدا از پس‌زمینه، قابل انیمیشن ======= */}
        {split && (
          <div className="pointer-events-none absolute inset-0 z-[1]">
            <AnimatePresence mode="sync" initial={false} custom={direction}>
              <motion.div
                key={slide.id}
                className="absolute bottom-[7%] left-[-1%] h-[54%] sm:bottom-[9%] sm:h-[56%] lg:bottom-[7%] lg:left-[4%] lg:h-[64%]"
                custom={direction}
                variants={reduce ? reducedSlide : tireVariants}
                initial="enter"
                animate="rest"
                exit="leave"
              >
                <img
                  src={assetUrl(tireOf(slide))}
                  alt=""
                  aria-hidden="true"
                  className="h-full w-auto max-w-none drop-shadow-[0_20px_28px_rgba(0,0,0,.55)]"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={() => setSplit(false)}
                />
              </motion.div>
            </AnimatePresence>

            {/* سایهٔ زمینی محل ایستادن لاستیک + جلوه‌های ترمز */}
            {!reduce && (
              <>
                <span
                  key={`shadow-${slide.id}`}
                  className="absolute bottom-[5%] left-[-1%] h-[9%] w-[48%] rounded-[50%] bg-black/65 blur-2xl sm:w-[40%] lg:bottom-[5%] lg:left-[4%] lg:h-[8%] lg:w-[30%]"
                />
                <span key={`fx-${slide.id}`} className="absolute bottom-[7%] left-[-1%] h-[54%] w-[56%] sm:bottom-[9%] sm:h-[56%] sm:w-[46%] lg:bottom-[7%] lg:left-[4%] lg:h-[64%] lg:w-[33%]">
                  <BrakeFx />
                </span>
              </>
            )}
          </div>
        )}

        {/* گرادیان‌ها */}
        <div className="absolute inset-0 bg-gradient-to-l from-graphite-900 via-graphite-900/85 to-graphite-900/20 md:via-graphite-900/70 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/95 via-graphite-900/25 to-transparent lg:hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/90 via-transparent to-graphite-900/30" />
        <div className="tire-pattern absolute inset-0 opacity-30" />

        {/* محتوا */}
        <div className="container-x relative z-10 flex h-full items-center">
          <div className="ml-auto w-full max-w-[620px] py-10 text-right lg:max-w-[560px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={animate ? 'hidden' : false}
                animate="show"
                exit="out"
                variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } }, out: { opacity: 0, transition: { duration: 0.18 } } }}
              >
                <motion.div
                  variants={{ hidden: { opacity: 0, filter: 'blur(10px)', y: 8 }, show: { opacity: 1, filter: 'blur(0px)', y: 0 } }}
                  transition={{ duration: reduce ? 0 : 0.5 }}
                  className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 backdrop-blur-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="text-[11px] font-bold text-accent">{slide.badge || 'لیفت تایر'}</span>
                </motion.div>

                <motion.h1
                  variants={{ hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-balance text-[28px] font-extrabold leading-[1.25] text-white sm:text-4xl lg:text-[46px] lg:leading-[1.2]"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: reduce ? 0 : 0.6 }}
                  className="mt-3 max-w-[520px] text-[13px] leading-6 text-white/65 sm:text-sm sm:leading-7"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.div
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: reduce ? 0 : 0.5 }}
                  className="mt-6 flex flex-wrap items-center gap-3"
                >
                  <motion.div whileHover={reduce ? {} : { scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                    <Link href={slide.link || '/products'} className="btn-accent relative overflow-hidden !px-6 !py-3.5 shadow-glow">
                      <span className="relative z-10 flex items-center gap-2 text-[13px]">
                        {slide.cta_text || 'مشاهده محصولات'}
                        <IconArrowLeft width={17} height={17} />
                      </span>
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    </Link>
                  </motion.div>
                  <Link href="/products" className="rounded-xl border border-white/20 px-5 py-3.5 text-[13px] font-bold text-white transition hover:border-accent hover:text-accent">
                    جست‌وجو بر اساس سایز
                  </Link>
                </motion.div>

                {/* آمار — از صفر و آرام بالا می‌روند */}
                <motion.dl
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: reduce ? 0 : 0.5 }}
                  className="mt-7 flex items-center gap-6 border-t border-white/10 pt-5"
                >
                  {slideStats.slice(0, 2).map((s) => (
                    <div key={`${slide.id}-${s.label}`} className="flex items-baseline gap-2">
                      <CountUp
                        value={s.value}
                        duration={2400}
                        delay={260}
                        trigger="mount"
                        className="text-2xl font-bold text-white lg:text-3xl"
                      />
                      <dt className="text-[11px] text-white/45">{s.label}</dt>
                    </div>
                  ))}
                </motion.dl>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* فلش‌ها */}
        {count > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="اسلاید قبلی"
              className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/20 p-2.5 text-white backdrop-blur transition hover:border-accent hover:bg-accent md:grid"
            >
              <IconChevron width={20} height={20} className="rotate-180" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="اسلاید بعدی"
              className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/20 p-2.5 text-white backdrop-blur transition hover:border-accent hover:bg-accent md:grid"
            >
              <IconChevron width={20} height={20} />
            </button>
          </>
        )}

        {/* نوار پیشرفت */}
        {count > 1 && (
          <div className="absolute inset-x-0 bottom-0 z-20">
            <div className="container-x">
              <div className="mb-3 flex items-center gap-3">
                <span className="num text-[11px] font-bold text-white/70" dir="ltr">
                  {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                </span>
                <div className="flex flex-1 gap-1.5">
                  {slides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setDirection(i > index ? 1 : -1); setIndex(i); }}
                      aria-label={`اسلاید ${i + 1}`}
                      className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                    >
                      {i === index ? (
                        <span
                          key={`${index}-${paused}`}
                          className="absolute inset-y-0 right-0 block rounded-full bg-accent"
                          style={{
                            animation: `heroProgress ${SLIDE_MS}ms linear forwards`,
                            animationPlayState: paused || reduce ? 'paused' : 'running',
                            width: reduce ? '100%' : undefined,
                          }}
                        />
                      ) : (
                        <span className="absolute inset-y-0 right-0 block w-0 rounded-full bg-white/40 transition-all duration-300 group-hover:w-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-1" />
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes heroProgress { from { width: 0% } to { width: 100% } }
      `}</style>
    </section>
  );
}
