'use client';

import Link from 'next/link';
import { assetUrl, faNum } from '@/lib/format';

export default function BrandMarquee({ brands = [], thin = false }) {
  if (!brands.length) return null;
  const list = [...brands, ...brands];

  if (thin) {
    return (
      <div className="relative overflow-hidden border-y border-white/5 bg-graphite-800 py-3">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-graphite-800 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-graphite-800 to-transparent" />
        <div className="flex w-max animate-marquee items-center gap-10 px-6 hover:[animation-play-state:paused]">
          {list.map((b, i) => (
            <span key={`${b.id}-${i}`} className="flex items-center gap-2.5 opacity-45 transition hover:opacity-100">
              <img src={assetUrl(b.logo)} alt={b.name_fa} className="h-4 w-auto" loading="lazy" />
              <span className="num text-[11px] tracking-[.2em] text-white/60">{b.name_en}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent md:w-28" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent md:w-28" />
      <div className="flex w-max animate-marquee gap-3 px-2 hover:[animation-play-state:paused]" style={{ animationDuration: '46s' }}>
        {list.map((b, i) => (
          <Link
            key={`${b.id}-${i}`}
            href={`/products?brand=${b.slug}`}
            className="group flex w-[210px] shrink-0 items-center gap-3 rounded-2xl border border-black/[.06] bg-white px-3 py-3 transition hover:border-accent/40 hover:shadow-card"
          >
            <span className="grid h-11 w-[74px] shrink-0 place-items-center">
              <img src={assetUrl(b.logo)} alt={b.name_fa} className="max-h-9 max-w-[70px] object-contain transition group-hover:scale-105" loading="lazy" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-extrabold text-graphite-900">{b.name_fa}</span>
              <span className="num block whitespace-nowrap text-[10px] text-muted">{faNum(b.product_count || 0)} محصول</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
