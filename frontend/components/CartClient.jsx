'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from './PageHeader';
import { useCart, useToast } from './Providers';
import { api } from '@/lib/api';
import { assetUrl, faNum, toman, formatNumber } from '@/lib/format';
import { IconTrash, IconCart, IconTruck, IconShield, IconCheck, IconArrowLeft } from './Icons';

export default function CartClient() {
  const { items, setQty, remove, subtotal, ready } = useCart();
  const { show } = useToast();
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lift-coupon') || 'null');
      if (saved?.code) { setApplied(saved); setCoupon(saved.code); }
    } catch {}
  }, []);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setChecking(true);
    try {
      const res = await api('/coupons/validate', { method: 'POST', body: { code: coupon.trim(), subtotal, shipping: 95000 } });
      setApplied(res);
      localStorage.setItem('lift-coupon', JSON.stringify(res));
      show(res.message);
    } catch (e) {
      setApplied(null);
      localStorage.removeItem('lift-coupon');
      show(e.message, 'error');
    } finally {
      setChecking(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCoupon('');
    localStorage.removeItem('lift-coupon');
  };

  const discount = applied?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  if (!ready) return <div className="container-x py-16 text-center text-sm text-muted">در حال بارگذاری سبد خرید…</div>;

  return (
    <>
      <PageHeader title="سبد خرید" breadcrumbs={[{ label: 'سبد خرید' }]} subtitle="محصولات انتخابی خود را بررسی کنید و سفارش را نهایی کنید." />
      <div className="container-x py-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-surface">
              <IconCart width={36} height={36} className="text-muted/50" />
            </div>
            <h2 className="mt-4 text-base font-extrabold text-graphite-900">سبد خرید شما خالی است</h2>
            <p className="mt-1.5 text-[12.5px] text-muted">از میان لاستیک‌های اصل و گارانتی‌دار لیفت تایر انتخاب کنید.</p>
            <Link href="/products" className="btn-accent mt-5">مشاهده محصولات</Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 rounded-2xl border border-black/[.06] bg-white p-3">
                  <Link href={`/products/${it.slug}`} className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-surface p-2">
                    <img src={assetUrl(it.image)} alt={it.name} className="h-full w-full object-contain" loading="lazy" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-accent-dark">{it.brand}</p>
                        <Link href={`/products/${it.slug}`} className="block truncate text-[13px] font-extrabold text-graphite-900 hover:text-accent-dark">{it.name}</Link>
                        <p className="num mt-1 inline-block rounded-md bg-graphite-900 px-1.5 py-0.5 text-[11px] font-bold text-white" dir="ltr">{it.size}</p>
                      </div>
                      <button onClick={() => remove(it.id)} aria-label="حذف محصول" className="rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger">
                        <IconTrash width={17} height={17} />
                      </button>
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
                      <div className="flex items-center overflow-hidden rounded-lg border border-black/10">
                        <button onClick={() => setQty(it.id, it.qty + 1)} className="px-3 py-1.5 text-base font-bold text-steel-500 hover:bg-surface" aria-label="افزایش">+</button>
                        <span className="num w-8 text-center text-[12px] font-extrabold">{faNum(it.qty)}</span>
                        <button onClick={() => setQty(it.id, it.qty - 1)} className="px-3 py-1.5 text-base font-bold text-steel-500 hover:bg-surface" aria-label="کاهش">−</button>
                      </div>
                      <div className="text-left">
                        {it.old_price ? <span className="num block text-[10px] text-muted line-through">{formatNumber(it.old_price * it.qty)}</span> : null}
                        <span className="num text-[14px] font-extrabold text-graphite-900">{toman(it.price * it.qty)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/[.06] bg-white p-3.5">
                <IconTruck width={20} height={20} className="text-accent" />
                <p className="text-[11.5px] text-steel-500">ارسال به سراسر ایران با باربری و پست پیشتاز — هزینه ارسال در مرحله بعد محاسبه می‌شود.</p>
              </div>
            </div>

            {/* خلاصه */}
            <aside className="h-fit space-y-3 lg:sticky lg:top-[150px]">
              <div className="rounded-2xl border border-black/[.06] bg-white p-4">
                <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">خلاصه سفارش</h3>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between text-steel-500">
                    <span>مبلغ کالاها ({faNum(items.length)} قلم)</span>
                    <span className="num font-bold text-graphite-900">{formatNumber(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>تخفیف کد {applied.code}</span>
                      <span className="num font-bold">−{formatNumber(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-steel-500">
                    <span>هزینه ارسال</span>
                    <span className="text-[11px] text-muted">در مرحله پرداخت</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-black/[.07] pt-2.5">
                    <span className="text-[13px] font-extrabold text-graphite-900">مبلغ قابل پرداخت</span>
                    <span className="num text-[16px] font-extrabold text-accent-dark">{toman(total)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="label">کد تخفیف</label>
                  {applied ? (
                    <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2 text-[12px] font-bold text-success">
                      <span className="flex items-center gap-1"><IconCheck width={15} height={15} /> {applied.code} اعمال شد</span>
                      <button onClick={removeCoupon} className="text-[11px] text-danger underline">حذف</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="مثلاً LIFT10" className="field !py-2.5 !text-[12px]" dir="ltr" />
                      <button onClick={applyCoupon} disabled={checking} className="btn-dark shrink-0 !px-4 !py-2.5 text-[11.5px]">ثبت</button>
                    </div>
                  )}
                </div>

                <Link href="/checkout" className="btn-accent mt-4 w-full !py-3.5">
                  ادامه و تکمیل خرید <IconArrowLeft width={16} height={16} />
                </Link>
                <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted">
                  <span className="flex items-center gap-1"><IconShield width={12} height={12} className="text-success" /> پرداخت امن</span>
                  <span className="flex items-center gap-1"><IconCheck width={12} height={12} className="text-success" /> ضمانت اصالت</span>
                  <span className="flex items-center gap-1"><IconCheck width={12} height={12} className="text-success" /> ۷ روز بازگشت</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
