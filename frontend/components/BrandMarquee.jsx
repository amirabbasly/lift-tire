'use client';

import Link from 'next/link';
import { assetUrl, faNum } from '@/lib/format';

/**
 * نوار برندها.
 * thin  → نوار تیره بلافاصله زیر هیرو
 * card  → کارت‌های روشن در بخش برندها
 */
export default function BrandMarquee({ brands = [], thin = false }) {
  if (!brands.length) return null;
  const list = [...brands, ...brands];

  if (thin) {
    return (
      <div className="relative isolate overflow-hidden border-y border-white/[.07] bg-graphite-900">
        {/* هاله نارنجی ملایم پشت نوار */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_0%,rgba(255,106,19,.13),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-graphite-900 to-transparent md:w-24" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-graphite-900 to-transparent md:w-24" />

        <div className="relative flex w-max animate-marquee items-center gap-2.5 py-3.5 hover:[animation-play-state:paused]">
          {list.map((b, i) => (
            <Link
              key={`${b.id}-${i}`}
              href={`/products?brand=${b.slug}`}
              aria-label={b.name_fa}
              className="group flex shrink-0 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.045] py-1.5 pl-3.5 pr-1.5 transition duration-300 hover:border-accent/50 hover:bg-white/[.08]"
            >
              {/* لوگوها تیره‌اند؛ روی چیپ روشن خوانا می‌شوند */}
              <span className="grid h-8 w-[54px] shrink-0 place-items-center rounded-lg bg-white px-1.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)] transition duration-300 group-hover:shadow-[inset_0_0_0_1px_rgba(255,106,19,.35)]">
                <img
                  src={assetUrl(b.logo)}
                  alt={b.name_fa}
                  className="max-h-4 w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[12px] font-extrabold text-white transition group-hover:text-accent">{b.name_fa}</span>
                <span className="num mt-1 text-[8.5px] font-semibold tracking-[.16em] text-white/40 transition group-hover:text-white/60">
                  {b.name_en}
                </span>
              </span>
            </Link>
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
            className="group flex w-[210px] shrink-0 items-center gap-3 rounded-2xl border border-black/[.06] bg-white px-3 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-card"
          >
            <span className="grid h-11 w-[74px] shrink-0 place-items-center rounded-xl bg-surface">
              <img src={assetUrl(b.logo)} alt={b.name_fa} className="max-h-8 max-w-[66px] object-contain transition group-hover:scale-105" loading="lazy" />
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
