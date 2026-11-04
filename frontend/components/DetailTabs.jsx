'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Stars from './Stars';
import { api } from '@/lib/api';
import { useToast } from './Providers';
import { faNum, formatDate } from '@/lib/format';
import { IconStar } from './Icons';

const TABS = [
  { id: 'desc', label: 'توضیحات' },
  { id: 'specs', label: 'مشخصات فنی' },
  { id: 'reviews', label: 'نظرات کاربران' },
];

export default function DetailTabs({ product }) {
  const [tab, setTab] = useState('desc');
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', rating: 5, comment: '' });
  const [sending, setSending] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    api(`/reviews?product_id=${product.id}`).then(setReviews).catch(() => setReviews([]));
  }, [product.id]);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api('/reviews', { method: 'POST', body: { ...form, product_id: product.id } });
      show(res.message);
      setForm({ name: '', phone: '', rating: 5, comment: '' });
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const specs = product.specs?.length
    ? product.specs
    : [
        { label: 'برند', value: product.brand?.name_fa },
        { label: 'سایز', value: product.size },
        { label: 'فصل', value: product.season },
        { label: 'ساخت کشور', value: product.country },
        { label: 'سال تولید', value: product.made_year ? faNum(product.made_year) : null },
      ].filter((s) => s.value);

  return (
    <div className="rounded-2xl border border-black/[.06] bg-white">
      <div className="flex overflow-x-auto border-b border-black/[.06]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 px-5 py-3.5 text-[12.5px] font-bold transition ${tab === t.id ? 'text-accent-dark' : 'text-steel-500 hover:text-graphite-900'}`}
          >
            {t.label}
            {t.id === 'reviews' && reviews.length > 0 && <span className="num mr-1 text-[10px] text-muted">({faNum(reviews.length)})</span>}
            {tab === t.id && <motion.span layoutId="detail-tab" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />}
          </button>
        ))}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
            {tab === 'desc' && (
              <div className="prose-sm max-w-none text-[12.5px] leading-7 text-steel-500" dangerouslySetInnerHTML={{ __html: product.description || '<p>توضیحی برای این محصول ثبت نشده است.</p>' }} />
            )}

            {tab === 'specs' && (
              <div className="overflow-hidden rounded-xl border border-black/[.07]">
                <table className="w-full text-[12px]">
                  <tbody>
                    {specs.map((s, i) => (
                      <tr key={`${s.label}-${i}`} className={i % 2 ? 'bg-surface/60' : 'bg-white'}>
                        <td className="w-2/5 border-b border-black/[.04] px-3 py-2.5 font-bold text-graphite-800">{s.label}</td>
                        <td className="border-b border-black/[.04] px-3 py-2.5 text-steel-500">{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'reviews' && (
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-3">
                  {reviews.length === 0 && <p className="text-[12.5px] text-muted">هنوز نظری برای این محصول ثبت نشده است. اولین نظر را شما بنویسید.</p>}
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-black/[.06] bg-surface/40 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-extrabold text-graphite-900">{r.name}</span>
                        <Stars rating={r.rating} size={12} />
                      </div>
                      <p className="mt-1.5 text-[12px] leading-6 text-steel-500">{r.comment}</p>
                      <p className="mt-1.5 text-[10px] text-muted">{formatDate(r.created_at)}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={submit} className="h-fit rounded-xl border border-black/[.07] bg-white p-4">
                  <h4 className="mb-3 text-[13px] font-extrabold text-graphite-900">ثبت نظر شما</h4>
                  <div className="space-y-2.5">
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام شما" className="field !py-2.5 !text-[12px]" />
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="شماره موبایل (اختیاری)" className="field !py-2.5 !text-[12px]" inputMode="tel" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted">امتیاز:</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} aria-label={`${n} ستاره`}>
                          <IconStar width={18} height={18} filled={n <= form.rating} className={n <= form.rating ? 'text-warning' : 'text-black/15'} />
                        </button>
                      ))}
                    </div>
                    <textarea required rows={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="تجربه خود از این محصول را بنویسید…" className="field !py-2.5 !text-[12px]" />
                    <button type="submit" disabled={sending} className="btn-accent w-full !py-2.5 text-[12px]">
                      {sending ? 'در حال ارسال…' : 'ارسال نظر'}
                    </button>
                    <p className="text-center text-[10px] text-muted">نظر شما پس از تأیید کارشناسان نمایش داده می‌شود.</p>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
