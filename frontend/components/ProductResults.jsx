'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from './ProductCard';
import { IconGrid, IconList, IconChevron } from './Icons';
import { SORTS } from '@/lib/constants';
import { faNum } from '@/lib/format';

export default function ProductResults({ items = [], total = 0, page = 1, pages = 1, limit = 12, basePath = '/products' }) {
  const [view, setView] = useState('grid');
  const router = useRouter();
  const sp = useSearchParams();

  const goPage = (p) => {
    const params = new URLSearchParams(sp.toString());
    params.set('page', String(p));
    router.push(`${basePath}?${params.toString()}`);
  };

  const setSort = (e) => {
    const params = new URLSearchParams(sp.toString());
    params.set('sort', e.target.value);
    params.delete('page');
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      {/* نوار ابزار */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/[.06] bg-white px-3 py-2.5">
        <p className="text-[12px] text-muted">
          <span className="num font-extrabold text-graphite-900">{faNum(total)}</span> محصول یافت شد
        </p>
        <div className="flex items-center gap-2">
          <select
            defaultValue={sp.get('sort') || 'newest'}
            onChange={setSort}
            aria-label="مرتب‌سازی"
            className="h-8 rounded-lg border border-black/10 bg-white px-2 text-[11.5px] font-semibold text-steel-500 outline-none focus:border-accent"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <div className="flex items-center overflow-hidden rounded-lg border border-black/10">
            <button onClick={() => setView('grid')} aria-label="نمایش شبکه‌ای" className={`p-1.5 ${view === 'grid' ? 'bg-graphite-900 text-white' : 'text-steel-500'}`}>
              <IconGrid width={15} height={15} />
            </button>
            <button onClick={() => setView('list')} aria-label="نمایش لیستی" className={`p-1.5 ${view === 'list' ? 'bg-graphite-900 text-white' : 'text-steel-500'}`}>
              <IconList width={15} height={15} />
            </button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
          <p className="text-sm font-extrabold text-graphite-900">محصولی با این مشخصات پیدا نشد</p>
          <p className="mt-1 text-[12px] text-muted">فیلترها را تغییر دهید یا با کارشناسان ما تماس بگیرید.</p>
          <button onClick={() => router.push(basePath)} className="btn-ghost mt-4 !py-2 text-[12px]">حذف فیلترها</button>
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-3'}>
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} layout={view === 'list' ? 'list' : 'grid'} index={i} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="صفحه‌بندی">
          <button onClick={() => goPage(Math.max(1, page - 1))} disabled={page <= 1} className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-white text-steel-500 disabled:opacity-40">
            <IconChevron width={16} height={16} className="rotate-180" />
          </button>
          {Array.from({ length: Math.min(pages, 7) }).map((_, i) => {
            let n = i + 1;
            if (pages > 7 && page > 4) n = Math.min(pages - 6, page - 3) + i;
            return (
              <button
                key={n}
                onClick={() => goPage(n)}
                className={`num h-9 min-w-9 rounded-lg border px-2 text-[12px] font-bold transition ${
                  n === page ? 'border-graphite-900 bg-graphite-900 text-white' : 'border-black/10 bg-white text-steel-500 hover:border-accent'
                }`}
              >
                {faNum(n)}
              </button>
            );
          })}
          <button onClick={() => goPage(Math.min(pages, page + 1))} disabled={page >= pages} className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-white text-steel-500 disabled:opacity-40">
            <IconChevron width={16} height={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
