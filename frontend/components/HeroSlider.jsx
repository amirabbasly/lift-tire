'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { IconChevron, IconArrowLeft } from './Icons';
import { assetUrl, faNum } from '@/lib/format';
import { usePointerFine } from '@/lib/useMedia';

const SLIDE_MS = 6000;

export default function HeroSlider({ slides = [], stats = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const reduce = useReducedMotion();
  const pointerFine = usePointerFine();
  const rootRef = useRef(null);
  const touchStart = useRef(0);
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end start'] });
  const tireY = useTransform(scrollYProgress, [0, 1], [0, 120]);

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
        {/* تصاویر اسلاید */}
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: direction > 0 ? 1.02 : 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.01 }}
            transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src={assetUrl(slide.image)}
              alt={slide.title || 'بنر لیفت تایر'}
              className="h-full w-full object-cover object-left"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              initial={{ scale: 1 }}
              animate={{ scale: reduce ? 1 : 1.06 }}
              transition={{ duration: reduce ? 0 : 7, ease: 'linear' }}
            />
          </motion.div>
        </AnimatePresence>

        {/* گرادیان‌ها */}
        <div className="absolute inset-0 bg-gradient-to-l from-graphite-900 via-graphite-900/85 to-graphite-900/20 md:via-graphite-900/70 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900 via-graphite-900/60 to-graphite-900/25 lg:hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900 via-transparent to-graphite-900/40" />
        <div className="tire-pattern absolute inset-0 opacity-30" />

        {/* لاستیک چرخان با پارالاکس */}
        <motion.div
          style={reduce ? undefined : { y: tireY }}
          className="pointer-events-none absolute right-4 top-5 z-10 hidden select-none lg:block xl:right-8 xl:top-6"
          aria-hidden="true"
        >
          <motion.img
            src="/images/hero/tire-cutout.png"
            alt=""
            width={380}
            height={380}
            className="h-[104px] w-[104px] object-contain opacity-80 drop-shadow-[0_16px_30px_rgba(0,0,0,.7)] xl:h-[124px] xl:w-[124px]"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          />
        </motion.div>

        {/* محتوا */}
        <div className="container-x relative flex h-full items-center">
          <div className="ml-auto w-full max-w-[620px] py-10 text-right lg:max-w-[560px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial="hidden"
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

                <motion.dl
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: reduce ? 0 : 0.5 }}
                  className="mt-7 flex items-center gap-6 border-t border-white/10 pt-5"
                >
                  {slideStats.slice(0, 2).map((s) => (
                    <div key={s.label} className="flex items-baseline gap-2">
                      <dd className="num text-2xl font-bold text-white lg:text-3xl">{faNum(s.value)}</dd>
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
