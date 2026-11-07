'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { IconSearch } from './Icons';
import { faNum } from '@/lib/format';

const WIDTHS = [155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285];
const RATIOS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];
const RIMS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export default function SizeFinder({ compact = false }) {
  const [width, setWidth] = useState('205');
  const [ratio, setRatio] = useState('55');
  const [rim, setRim] = useState('16');
  const router = useRouter();
  const reduce = useReducedMotion();
  const [animate, setAnimate] = useState(false);
  useEffect(() => setAnimate(true), []);

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (width) params.set('width', width);
    if (ratio) params.set('ratio', ratio);
    if (rim) params.set('rim', rim);
    router.push(`/products?${params.toString()}`);
  };

  const Select = ({ value, onChange, options, label, suffix }) => (
    <label className="block flex-1">
      <span className="mb-1.5 block text-[11px] font-bold text-steel-500">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-black/10 bg-white px-3 text-center text-[15px] font-bold text-graphite-900 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
        >
          <option value="">همه</option>
          {options.map((o) => (
            <option key={o} value={o}>{faNum(o)}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">{suffix}</span>
      </div>
    </label>
  );

  return (
    <motion.form
      onSubmit={submit}
      initial={animate ? { opacity: 0, y: 18 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl border border-black/[.06] bg-card p-5 shadow-card ${compact ? '' : 'md:p-6'}`}
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-dark">
          <IconSearch width={19} height={19} />
        </div>
        <div>
          <h3 className="text-[15px] font-extrabold text-graphite-900">سایز لاستیک خودت را پیدا کن</h3>
          <p className="mt-0.5 text-[11.5px] text-muted">اعداد روی دیواره لاستیک فعلی را وارد کنید</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select label="عرض مقطع" value={width} onChange={setWidth} options={WIDTHS} suffix="mm" />
        <Select label="نسبت منظر" value={ratio} onChange={setRatio} options={RATIOS} suffix="%" />
        <Select label="قطر رینگ" value={rim} onChange={setRim} options={RIMS} suffix="in" />
        <button type="submit" className="btn-accent h-12 shrink-0 !px-6">
          <IconSearch width={17} height={17} /> جست‌وجو
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-muted">
          نمونه: <span className="num font-bold text-graphite-800" dir="ltr">205/55 R16</span>
        </p>
        <p className="num rounded-lg bg-surface px-2 py-1 text-[11px] font-bold text-steel-500" dir="ltr">
          {faNum(width || '—')}/{faNum(ratio || '—')} R{faNum(rim || '—')}
        </p>
      </div>
    </motion.form>
  );
}
