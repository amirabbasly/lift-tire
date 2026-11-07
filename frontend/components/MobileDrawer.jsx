'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Logo from './Logo';
import { IconX, IconChevron, IconPhone } from './Icons';
import { NAV, MOBILE_NAV } from '@/lib/constants';
import { faNum } from '@/lib/format';

/**
 * کشوی منوی موبایل
 *
 * چرا portal؟ هدر `sticky` + `backdrop-blur` دارد. هر دو باعث می‌شوند
 * هدر یک «containing block» برای عناصر `position: fixed` شود؛ نتیجه:
 * کشو به ارتفاع هدر محدود می‌شد و زیر اسلایدر می‌رفت.
 * با createPortal به body، کشو مستقل از هدر و درست روی همه‌چیز رندر می‌شود.
 */
export default function MobileDrawer({ open, onClose, settings, categories = [] }) {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => setMounted(true), []);

  // قفل اسکرول بدنه وقتی منو باز است
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const prevPad = document.body.style.paddingInlineEnd;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingInlineEnd = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingInlineEnd = prevPad;
    };
  }, [open]);

  // بستن با Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="lg:hidden" style={{ position: 'relative', zIndex: 95 }}>
          <motion.div
            className="fixed inset-0 z-[95] bg-graphite-900/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-[96] flex w-[87%] max-w-[350px] flex-col bg-graphite-900 text-white shadow-[0_0_60px_rgba(0,0,0,.5)]"
            initial={{ x: reduce ? 0 : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: reduce ? 0 : '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label="منوی اصلی"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <Logo variant="dark" size="sm" tagline={false} />
              <button
                onClick={onClose}
                aria-label="بستن منو"
                className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <IconX width={20} height={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 border-b border-white/10 px-3 py-4">
              {MOBILE_NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onClose}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-white/5"
                >
                  <img src={n.icon} alt="" className="h-9 w-9 object-contain" loading="lazy" />
                  <span className="text-[10px] font-bold text-white/80">{n.label}</span>
                </Link>
              ))}
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
              <p className="px-2 pb-2 text-[11px] font-bold text-white/40">دسترسی سریع</p>
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onClose}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/5 hover:text-accent"
                >
                  {n.label}
                  <IconChevron width={15} height={15} className="text-white/30" />
                </Link>
              ))}

              {categories.length > 0 && (
                <>
                  <p className="px-2 pb-2 pt-3 text-[11px] font-bold text-white/40">دسته‌بندی‌ها</p>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2.5 text-sm text-white/75 transition hover:bg-white/5 hover:text-accent"
                    >
                      {c.name}
                      <span className="num text-[10px] text-white/30">{faNum(c.product_count || 0)}</span>
                    </Link>
                  ))}
                </>
              )}
            </nav>

            <div className="border-t border-white/10 p-4">
              <a
                href={`tel:${String(settings?.phone || '').replace(/[^\d+]/g, '') || '02191001234'}`}
                className="btn-accent w-full"
              >
                <IconPhone width={18} height={18} /> مشاوره تلفنی رایگان
              </a>
              <p className="mt-2 text-center text-[11px] text-white/40">شنبه تا پنجشنبه ۹ تا ۱۹</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
