'use client';

import { useRef, useState } from 'react';
import { assetUrl } from '@/lib/format';

export default function Gallery({ images = [], alt = '' }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const frameRef = useRef(null);
  const list = images.length ? images : [{ url: '/images/products/tire-passenger-a.png' }];
  const current = list[Math.min(active, list.length - 1)];

  const onMove = (e) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
        className="relative aspect-square overflow-hidden rounded-2xl border border-black/[.06] bg-white"
      >
        <img
          src={assetUrl(current.url)}
          alt={alt}
          className="h-full w-full object-contain p-4 transition-transform duration-200 will-change-transform"
          style={{ transform: zoom ? 'scale(1.9)' : 'scale(1)', transformOrigin: `${pos.x}% ${pos.y}%` }}
        />
        <span className="pointer-events-none absolute bottom-2 left-2 hidden rounded-lg bg-graphite-900/70 px-2 py-1 text-[10px] text-white/80 lg:block">
          برای بزرگ‌نمایی نشانگر را روی تصویر ببرید
        </span>
        {list.length > 1 && (
          <div className="absolute right-2 top-2 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-steel-500 backdrop-blur">
            {active + 1} / {list.length}
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`تصویر ${i + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${
                active === i ? 'border-accent' : 'border-transparent hover:border-black/10'
              }`}
            >
              <img src={assetUrl(img.url)} alt="" className="h-full w-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
