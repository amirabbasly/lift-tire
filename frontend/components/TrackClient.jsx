'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ORDER_STATUS, ORDER_TIMELINE } from '@/lib/constants';
import { faNum, formatDate, formatNumber, toman } from '@/lib/format';
import { IconCheck, IconSearch } from './Icons';

export default function TrackClient() {
  const [form, setForm] = useState({ code: '', phone: '' });
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api(`/orders/track?code=${encodeURIComponent(form.code)}&phone=${encodeURIComponent(form.phone)}`);
      setOrder(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const st = order ? ORDER_STATUS[order.status] || ORDER_STATUS.pending_payment : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <form onSubmit={submit} className="rounded-2xl border border-black/[.06] bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">کد سفارش</label>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="field num" placeholder="LT-2505-123456" dir="ltr" />
          </div>
          <div>
            <label className="label">شماره موبایل</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" placeholder="۰۹۱۲۱۲۳۴۵۶۷" dir="ltr" inputMode="tel" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-accent mt-4 w-full !py-3">
          <IconSearch width={17} height={17} /> {loading ? 'در حال جست‌وجو…' : 'پیگیری سفارش'}
        </button>
        {error && <p className="mt-3 rounded-xl bg-danger/10 p-3 text-[12px] font-bold text-danger">{error}</p>}
        <p className="mt-3 text-center text-[11px] text-muted">
          کد سفارش در پیام تأیید سفارش برای شما ارسال شده است.
        </p>
      </form>

      {order && (
        <div className="rounded-2xl border border-black/[.06] bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="num text-[14px] font-extrabold text-graphite-900">{order.code}</p>
              <p className="text-[11px] text-muted">{formatDate(order.created_at, true)}</p>
            </div>
            <span className="rounded-lg px-3 py-1 text-[11px] font-bold text-white" style={{ background: st.color }}>{st.label}</span>
          </div>

          <ol className="relative mb-5 flex justify-between">
            <span className="absolute right-0 left-0 top-4 h-0.5 bg-black/[.08]" />
            <span className="absolute right-0 top-4 h-0.5 bg-success" style={{ width: `${(Math.max(0, st.step) / (ORDER_TIMELINE.length - 1)) * 100}%` }} />
            {ORDER_TIMELINE.map((label, i) => (
              <li key={label} className="relative z-10 flex flex-1 flex-col items-center gap-1.5">
                <span className={`grid h-8 w-8 place-items-center rounded-full border-2 ${i <= st.step ? 'border-success bg-success text-white' : 'border-black/10 bg-white text-muted'}`}>
                  {i <= st.step ? <IconCheck width={14} height={14} /> : <span className="num text-[10px]">{faNum(i + 1)}</span>}
                </span>
                <span className={`text-center text-[10px] ${i <= st.step ? 'font-bold text-graphite-900' : 'text-muted'}`}>{label}</span>
              </li>
            ))}
          </ol>

          <div className="space-y-2 rounded-xl bg-surface p-3 text-[12px]">
            <div className="flex justify-between"><span className="text-muted">مبلغ سفارش</span><span className="num font-bold">{toman(order.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted">تعداد اقلام</span><span className="num font-bold">{faNum((order.items || []).length)} قلم</span></div>
            <div className="flex justify-between"><span className="text-muted">روش ارسال</span><span className="font-bold">{order.shipping_method === 'post' ? 'پست پیشتاز' : order.shipping_method === 'freight' ? 'باربری' : 'پیک تهران'}</span></div>
          </div>

          <div className="mt-3 flex gap-2">
            <Link href={`/order/${order.code}`} className="btn-ghost flex-1 !py-2.5 text-[12px]">جزئیات کامل سفارش</Link>
            <Link href="/products" className="btn-accent flex-1 !py-2.5 text-[12px]">ادامه خرید</Link>
          </div>
        </div>
      )}
    </div>
  );
}
