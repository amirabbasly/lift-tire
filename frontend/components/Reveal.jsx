'use client';

import { motion } from 'framer-motion';
import useReveal from '@/lib/useReveal';

/**
 * ورود نرم با تضمین نمایش.
 *
 * در HTML اولیه هیچ opacity:0 اینلاین نوشته نمی‌شود، پس محتوا همیشه دیده می‌شود.
 * بعد از mount، وقتی عنصر وارد دید شد، انیمیشن به‌صورت keyframe از ۰ به ۱ اجرا
 * می‌شود. اگر IntersectionObserver کار نکند، تایمر ایمنی در قلاب آن را نمایش می‌دهد.
 */
export default function Reveal({ children, delay = 0, y = 22, className = '', once = true }) {
  const { ref, reduce, shown } = useReveal({ once, delay });

  // قبل از hydration یا با reduce-motion: کاملاً ثابت و مرئی
  if (reduce || !shown) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: [0, 1], y: [y, 0] }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
