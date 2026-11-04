'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconFilter, IconX } from './Icons';
import { SEASONS } from '@/lib/constants';
import { faNum, formatPrice } from '@/lib/format';

const PRICE_MAX = 20000000;

export default function Filters({ categories = [], brands = [], lockedCategory = null }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const get = (k) => sp.get(k) || '';
  const setParam = (updates) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '' || v === false) params.delete(k);
      else params.set(k, String(v));
    }
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const toggleBrand = (slug) => {
    const current = get('brand').split(',').filter(Boolean);
    const next = current.includes(slug) ? current.filter((b) => b !== slug) : [...current, slug];
    setParam({ brand: next.join(',') });
  };

  const activeCount = ['category', 'brand', 'width', 'ratio', 'rim', 'season', 'min_price', 'max_price', 'in_stock', 'on_sale', 'q']
    .filter((k) => sp.get(k)).length;

  const selectedBrands = get('brand').split(',').filter(Boolean);

  const body = (
    <div className="space-y-5">
      {sp.get('q') && (
        <div className="rounded-xl bg-accent-soft px-3 py-2 text-[12px] font-bold text-accent-dark">
          جست‌وجو برای: «{sp.get('q')}»
          <button onClick={() => setParam({ q: null })} className="mr-2 text-[11px] underline">حذف</button>
        </div>
      )}

      {!lockedCategory && (
        <div>
          <h4 className="mb-2 text-[12.5px] font-extrabold text-graphite-900">دسته‌بندی</h4>
          <ul className="space-y-1">
            <li>
              <button onClick={() => setParam({ category: null })} className={`w-full rounded-lg px-2 py-1.5 text-right text-[12px] transition hover:bg-surface ${!get('category') ? 'bg-accent-soft font-bold text-accent-dark' : 'text-steel-500'}`}>
                همه دسته‌ها
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setParam({ category: c.slug })}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-right text-[12px] transition hover:bg-surface ${get('category') === c.slug ? 'bg-accent-soft font-bold text-accent-dark' : 'text-steel-500'}`}
                >
                  {c.name}
                  <span className="num text-[10px] text-muted">{faNum(c.product_count || 0)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-[12.5px] font-extrabold text-graphite-900">سایز لاستیک</h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['width', 'عرض'],
            ['ratio', 'نسبت'],
            ['rim', 'رینگ'],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[10px] text-muted">{label}</span>
              <input
                defaultValue={get(key)}
                onBlur={(e) => setParam({ [key]: e.target.value.trim() || null })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setParam({ [key]: e.target.value.trim() || null }); } }}
                inputMode="numeric"
                className="h-9 w-full rounded-lg border border-black/10 bg-white px-2 text-center text-[12px] font-bold outline-none focus:border-accent"
                placeholder="—"
              />
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['185', '195', '205', '215', '225', '265'].map((w) => (
            <button key={w} onClick={() => setParam({ width: w })} className={`num rounded-md px-2 py-1 text-[11px] ${get('width') === w ? 'bg-graphite-900 text-white' : 'bg-surface text-steel-500 hover:bg-black/10'}`}>
              {faNum(w)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[12.5px] font-extrabold text-graphite-900">فصل</h4>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((s) => (
            <button
              key={s}
              onClick={() => setParam({ season: get('season') === s ? null : s })}
              className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition ${
                get('season') === s ? 'border-accent bg-accent-soft text-accent-dark' : 'border-black/10 bg-white text-steel-500 hover:border-accent/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[12.5px] font-extrabold text-graphite-900">برند</h4>
        <div className="max-h-[210px] space-y-1 overflow-y-auto pl-1">
          {brands.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-[12px] text-steel-500 transition hover:bg-surface">
              <input
                type="checkbox"
                checked={selectedBrands.includes(b.slug)}
                onChange={() => toggleBrand(b.slug)}
                className="h-3.5 w-3.5 accent-[#FF6A13]"
              />
              <span className="flex-1">{b.name_fa}</span>
              <span className="num text-[10px] text-muted">{faNum(b.product_count || 0)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[12.5px] font-extrabold text-graphite-900">محدوده قیمت (تومان)</h4>
        <div className="grid grid-cols-2 gap-2">
          <input
            defaultValue={get('min_price')} inputMode="numeric" placeholder="از"
            onBlur={(e) => setParam({ min_price: e.target.value.replace(/\D/g, '') || null })}
            className="h-9 rounded-lg border border-black/10 px-2 text-center text-[12px] outline-none focus:border-accent"
          />
          <input
            defaultValue={get('max_price')} inputMode="numeric" placeholder="تا"
            onBlur={(e) => setParam({ max_price: e.target.value.replace(/\D/g, '') || null })}
            className="h-9 rounded-lg border border-black/10 px-2 text-center text-[12px] outline-none focus:border-accent"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[[0, 5000000], [5000000, 9000000], [9000000, 20000000]].map(([a, b]) => (
            <button
              key={a}
              onClick={() => setParam({ min_price: a || null, max_price: b })}
              className="rounded-md bg-surface px-2 py-1 text-[10.5px] text-steel-500 transition hover:bg-black/10"
            >
              {formatPrice(a)} تا {formatPrice(b)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-black/[.07] pt-3">
        <label className="flex cursor-pointer items-center justify-between text-[12px] font-semibold text-graphite-800">
          فقط موجود
          <input type="checkbox" checked={get('in_stock') === '1'} onChange={(e) => setParam({ in_stock: e.target.checked ? '1' : null })} className="h-4 w-4 accent-[#FF6A13]" />
        </label>
        <label className="flex cursor-pointer items-center justify-between text-[12px] font-semibold text-graphite-800">
          فقط تخفیف‌دار
          <input type="checkbox" checked={get('on_sale') === '1'} onChange={(e) => setParam({ on_sale: e.target.checked ? '1' : null })} className="h-4 w-4 accent-[#FF6A13]" />
        </label>
      </div>

      {activeCount > 0 && (
        <button onClick={() => router.push(lockedCategory ? `/category/${lockedCategory}` : '/products')} className="w-full rounded-xl border border-danger/20 bg-danger/5 py-2 text-[11.5px] font-bold text-danger">
          پاک کردن همه فیلترها ({faNum(activeCount)})
        </button>
      )}
    </div>
  );

  return (
    <>
      <aside className="sticky top-[140px] hidden h-fit rounded-2xl border border-black/[.06] bg-card p-4 lg:block">
        <div className="mb-3 flex items-center justify-between border-b border-black/[.06] pb-3">
          <h3 className="flex items-center gap-1.5 text-[13px] font-extrabold text-graphite-900">
            <IconFilter width={16} height={16} className="text-accent" /> فیلترها
          </h3>
          <span className="num text-[10px] text-muted">{faNum(activeCount)} فعال</span>
        </div>
        {body}
      </aside>

      <div className="lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-ghost w-full !py-2.5 text-[12px]">
          <IconFilter width={16} height={16} /> فیلترها {activeCount > 0 && <span className="num rounded-full bg-accent px-1.5 text-[10px] text-white">{faNum(activeCount)}</span>}
        </button>
        {open && (
          <div className="fixed inset-0 z-[90] flex flex-col bg-black/40" onClick={() => setOpen(false)}>
            <div className="mt-auto max-h-[86vh] overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-extrabold">فیلترها</h3>
                <button onClick={() => setOpen(false)} aria-label="بستن" className="rounded-lg p-1.5 hover:bg-surface"><IconX width={18} height={18} /></button>
              </div>
              {body}
              <button onClick={() => setOpen(false)} className="btn-accent mt-4 w-full">نمایش نتایج</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
