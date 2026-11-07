'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * انیمیشن لاستیک هیرو هنگام تغییر اسلاید:
 *   ۱) ترمز/توقف → لاستیک فعلی جا می‌افتد
 *   ۲) روشن شدن و چرخش → با سرعت بالا می‌چرخد و از کادر بیرون می‌رود
 *   ۳) ورود لاستیک بعدی از سمت مقابل با خط سرعت
 *   ۴) ترمز گرفتن → با لرزش کوتاه و افت کوچک، متوقف می‌شود
 *
 * اگر کاربر prefers-reduced-motion داشته باشد فقط یک لاستیک ثابت نمایش داده می‌شود.
 */
export default function HeroTire({ slideId, direction = 1 }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div
        className="pointer-events-none absolute right-4 top-5 z-10 hidden select-none lg:block xl:right-8 xl:top-6"
        aria-hidden="true"
      >
        <img
          src="/images/hero/tire-cutout.png"
          alt=""
          width={380}
          height={380}
          className="h-[116px] w-[116px] object-contain opacity-90 drop-shadow-[0_16px_30px_rgba(0,0,0,.7)] xl:h-[140px] xl:w-[140px]"
        />
      </div>
    );
  }

  // جهت ورود/خروج بر اساس جهت حرکت اسلایدر
  const enterFrom = direction > 0 ? 300 : -300;
  const exitTo = direction > 0 ? -340 : 340;

  return (
    <div
      className="pointer-events-none absolute right-2 top-2 z-10 hidden select-none lg:block xl:right-6 xl:top-4"
      aria-hidden="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slideId}
          className="relative"
          style={{ transformOrigin: '50% 62%' }}
          initial={{ x: enterFrom, rotate: direction > 0 ? -520 : 520, opacity: 0, scale: 0.78 }}
          animate={{
            // ورود سریع → ضربه ترمز → لرزش → توقف
            x: [enterFrom, enterFrom * 0.35, 10, -6, 3, 0],
            rotate: direction > 0 ? [-520, -340, -14, 7, -3, 0] : [520, 340, 14, -7, 3, 0],
            opacity: [0, 1, 1, 1, 1, 1],
            scale: [0.78, 0.9, 1.02, 0.98, 1.005, 1],
          }}
          exit={{
            // روشن شدن + چرخش و خروج از کادر
            x: exitTo,
            rotate: direction > 0 ? 760 : -760,
            opacity: [1, 1, 0],
            scale: [1, 1.08, 0.86],
          }}
          transition={{
            duration: 1.0,
            times: [0, 0.42, 0.64, 0.76, 0.88, 1],
            ease: [0.16, 1, 0.3, 1],
            exit: { duration: 0.55, ease: [0.5, 0, 0.8, 0.4] },
          }}
        >
          {/* دود/گرد و خاک زیر لاستیک */}
          <motion.span
            className="absolute left-1/2 top-[68%] h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-2xl xl:h-[150px] xl:w-[150px]"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.6, 0.25, 0], scale: [0.3, 1.35, 1.9, 2.2] }}
            transition={{ duration: 1.4, times: [0, 0.3, 0.6, 1], ease: 'easeOut' }}
          />

          <img
            src="/images/hero/tire-cutout.png"
            alt=""
            width={380}
            height={380}
            className="relative z-10 h-[116px] w-[116px] object-contain opacity-95 drop-shadow-[0_20px_38px_rgba(0,0,0,.8)] xl:h-[140px] xl:w-[140px]"
            loading="eager"
            decoding="async"
          />

          {/* هاله گرم برند هنگام ورود */}
          <motion.span
            className="absolute inset-0 z-20 rounded-full"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,106,19,.32), transparent 62%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            transition={{ duration: 1.1, times: [0, 0.5, 1] }}
          />

          {/* خط سرعت هنگام ورود — حس ترمز گرفتن */}
          <motion.span
            className="absolute right-full top-1/2 z-20 mr-1 h-[2px] w-20 rounded-full bg-gradient-to-l from-accent/85 to-transparent"
            style={{ transformOrigin: 'right center' }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.95, 0], scaleX: [0, 1, 0.15] }}
            transition={{ duration: 0.6, delay: 0.34, ease: 'easeOut' }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
