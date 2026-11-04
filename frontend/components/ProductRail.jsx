'use client';

import { useRef } from 'react';
import ProductCard from './ProductCard';
import { IconChevron } from './Icons';

export default function ProductRail({ products = [], cols = 5, leading = null }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
  };
  const showArrows = products.length > cols;

  return (
    <div className="relative">
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-1"
      >
        {leading}
        {products.map((p, i) => (
          <div key={p.id} className="w-[calc(50%-6px)] shrink-0 snap-start sm:w-[220px] lg:w-[calc(20%-10px)]">
            <ProductCard product={p} index={i} />
          </div>
        ))}
      </div>
      {showArrows && (
        <>
          <button
            onClick={() => scroll(1)}
            aria-label="بعدی"
            className="absolute -left-3 top-[40%] z-10 hidden h-10 w-10 place-items-center rounded-full border border-black/[.07] bg-white text-graphite-900 shadow-card transition hover:bg-accent hover:text-white md:grid"
          >
            <IconChevron width={18} height={18} />
          </button>
          <button
            onClick={() => scroll(-1)}
            aria-label="قبلی"
            className="absolute -right-3 top-[40%] z-10 hidden h-10 w-10 place-items-center rounded-full border border-black/[.07] bg-white text-graphite-900 shadow-card transition hover:bg-accent hover:text-white md:grid"
          >
            <IconChevron width={18} height={18} className="rotate-180" />
          </button>
        </>
      )}
    </div>
  );
}
