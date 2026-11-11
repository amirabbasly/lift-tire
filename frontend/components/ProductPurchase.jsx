'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth, useCart, useToast } from './Providers';
import { api } from '@/lib/api';
import { discountPercent, faNum, formatNumber, toman } from '@/lib/format';
import { IconCart, IconHeart, IconTruck, IconShield, IconCheck } from './Icons';
import Countdown from './Countdown';

export default function ProductPurchase({ product }) {
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const { add } = useCart();
  const { token } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const out = Number(product.stock) <= 0;
  const off = product.discount || discountPercent(product.price, product.old_price);
  const max = Math.max(1, Math.min(Number(product.stock) || 1, 10));

  const addToCart = (goCheckout = false) => {
    if (out) return;
    add(product, qty);
    show(`«${product.name}» به سبد خرید اضافه شد.`);
    if (goCheckout) router.push('/checkout');
  };

  const toggleWish = async () => {
    if (!token) {
      show('برای افزودن به علاقه‌مندی‌ها وارد حساب خود شوید.', 'error');
      router.push('/account?redirect=/products/' + product.slug);
      return;
    }
    try {
      const res = await api('/customer/wishlist', { method: 'POST', body: { product_id: product.id }, token });
      setWished(res.added);
      show(res.message);
    } catch (e) {
      show(e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {product.brand?.name_fa && (
          <span className="chip !border-accent/20 !bg-accent-soft !text-accent-dark">{product.brand.name_fa}</span>
        )}
        <span className="chip">{product.season}</span>
        {product.badge && <span className="chip !border-graphite-900/10 !bg-graphite-900/5">{product.badge}</span>}
      </div>

      <h1 className="text-xl font-extrabold leading-8 text-graphite-900 md:text-[26px]">{product.name}</h1>

      <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted">
        <span className="num rounded-lg bg-graphite-900 px-2.5 py-1 text-[15px] font-bold text-white" dir="ltr">{product.size}</span>
        <span>امتیاز خریداران: <span className="num font-bold text-graphite-900">{faNum(Number(product.rating).toFixed(1))}</span> از ۵</span>
        <span className="num">({faNum(product.rating_count)} نظر)</span>
        <span className={out ? 'text-danger' : 'text-success'}>{out ? 'ناموجود' : 'موجود در انبار'}</span>
      </div>

      <div className="rounded-2xl border border-black/[.07] bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {product.old_price ? (
              <div className="flex items-center gap-2">
                <span className="num text-[12px] text-muted line-through">{formatNumber(product.old_price)}</span>
                <span className="num rounded-md bg-danger px-1.5 py-0.5 text-[11px] font-bold text-white">{faNum(off)}٪ تخفیف</span>
              </div>
            ) : (
              <span className="block h-4" />
            )}
            <p className="num mt-1 text-[22px] font-extrabold text-graphite-900">{toman(product.price)}</p>
          </div>
          <div className="text-left">
            <Countdown label="پایان پیشنهاد" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-black/[.06] pt-4">
          {out ? (
            <span className="rounded-xl bg-danger/10 px-4 py-2.5 text-[13px] font-bold text-danger">این محصول فعلاً ناموجود است</span>
          ) : (
            <>
              <div className="flex items-center overflow-hidden rounded-xl border border-black/10">
                <button onClick={() => setQty((q) => Math.min(max, q + 1))} className="px-3.5 py-2.5 text-lg font-bold text-steel-500 transition hover:bg-surface" aria-label="افزایش">+</button>
                <span className="num w-10 text-center text-sm font-extrabold">{faNum(qty)}</span>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3.5 py-2.5 text-lg font-bold text-steel-500 transition hover:bg-surface" aria-label="کاهش">−</button>
              </div>
              <span className="text-[11px] text-muted">هر لاستیک به‌صورت جداگانه فروخته می‌شود</span>
            </>
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => addToCart(false)}
            disabled={out}
            className="btn-accent !py-3.5"
          >
            <IconCart width={18} height={18} /> افزودن به سبد خرید
          </motion.button>
          <div className="flex gap-2">
            <button onClick={() => addToCart(true)} disabled={out} className="btn-dark flex-1 !py-3.5 text-[12px] sm:!px-5">
              خرید سریع
            </button>
            <button
              onClick={toggleWish}
              aria-label="افزودن به علاقه‌مندی‌ها"
              className={`grid w-12 place-items-center rounded-xl border transition ${wished ? 'border-danger bg-danger/10 text-danger' : 'border-black/10 text-steel-500 hover:border-danger hover:text-danger'}`}
            >
              <IconHeart width={19} height={19} filled={wished} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/[.06] pt-4 sm:grid-cols-4">
          {[
            [IconShield, 'ضمانت اصالت'],
            [IconTruck, 'ارسال سراسر ایران'],
            [IconCheck, '۷ روز بازگشت'],
            [IconCheck, 'مشاوره تخصصی'],
          ].map(([Ic, label]) => (
            <span key={label} className="flex items-center gap-1.5 text-[10.5px] text-steel-500">
              <Ic width={14} height={14} className="text-accent" /> {label}
            </span>
          ))}
        </div>
      </div>

      <ul className="space-y-2 rounded-2xl border border-black/[.07] bg-white p-4 text-[12px] text-steel-500">
        {[
          `سایز: ${product.size}`,
          `شاخص بار / سرعت: ${product.specs?.find((s) => s.label === 'شاخص بار')?.value || '-'} / ${product.specs?.find((s) => s.label === 'شاخص سرعت')?.value || '-'}`,
          `سال تولید: ${product.made_year ? faNum(product.made_year) : '-'} — ساخت ${product.country || '-'}`,
          product.warranty ? `گارانتی: ${product.warranty}` : null,
        ].filter(Boolean).map((t) => (
          <li key={t} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
