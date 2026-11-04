'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from './Providers';
import { assetUrl, toman, faNum } from '@/lib/format';
import { IconX, IconTrash, IconCart } from './Icons';

export default function MiniCart() {
  const { items, open, setOpen, remove, setQty, subtotal, count, clear } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-graphite-900/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="fixed inset-y-0 left-0 z-[71] flex w-full max-w-[400px] flex-col bg-white shadow-lift"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            role="dialog" aria-label="سبد خرید"
          >
            <header className="flex items-center justify-between border-b border-black/[.07] px-5 py-4">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-graphite-900">
                <IconCart width={20} height={20} className="text-accent" /> سبد خرید
                <span className="num rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent-dark">{faNum(count)}</span>
              </h3>
              <button onClick={() => setOpen(false)} aria-label="بستن" className="rounded-lg p-1.5 text-muted hover:bg-black/5">
                <IconX width={18} height={18} />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-surface">
                    <IconCart width={34} height={34} className="text-muted/60" />
                  </div>
                  <p className="text-sm font-bold text-graphite-800">سبد خرید شما خالی است</p>
                  <p className="max-w-[240px] text-xs text-muted">لاستیک مناسب خودروی خود را انتخاب کنید؛ کارشناسان ما هم آماده مشاوره هستند.</p>
                  <Link href="/products" onClick={() => setOpen(false)} className="btn-accent mt-1">مشاهده محصولات</Link>
                </div>
              )}
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-xl border border-black/[.06] p-2.5">
                  <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-lg bg-surface p-1">
                    <img src={assetUrl(it.image)} alt={it.name} className="h-full w-full object-contain" loading="lazy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-graphite-900">{it.name}</p>
                    <p className="num mt-0.5 text-[11px] text-muted" dir="ltr">{it.size}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-lg border border-black/10">
                        <button onClick={() => setQty(it.id, it.qty + 1)} className="px-2 py-0.5 text-sm font-bold text-steel-500">+</button>
                        <span className="num w-5 text-center text-xs font-bold">{faNum(it.qty)}</span>
                        <button onClick={() => setQty(it.id, it.qty - 1)} className="px-2 py-0.5 text-sm font-bold text-steel-500">−</button>
                      </div>
                      <span className="num text-[13px] font-extrabold text-graphite-900">{toman(it.price * it.qty)}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(it.id)} aria-label="حذف" className="self-start rounded p-1 text-muted hover:text-danger">
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-black/[.07] bg-surface/60 px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted">جمع سبد</span>
                  <span className="num text-lg font-extrabold text-graphite-900">{toman(subtotal)}</span>
                </div>
                <div className="grid gap-2">
                  <Link href="/checkout" onClick={() => setOpen(false)} className="btn-accent w-full">تکمیل خرید</Link>
                  <Link href="/cart" onClick={() => setOpen(false)} className="btn-ghost w-full">مشاهده سبد خرید</Link>
                </div>
                <p className="mt-3 text-center text-[11px] text-muted">هزینه ارسال در مرحله بعد محاسبه می‌شود.</p>
                <button onClick={clear} className="mx-auto mt-2 block text-[11px] text-muted underline hover:text-danger">خالی کردن سبد</button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
