import Link from 'next/link';
import { assetUrl, faNum } from '@/lib/format';

export default function CategoryCircles({ categories = [] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {categories.slice(0, 6).map((c) => (
        <Link
          key={c.id}
          href={`/category/${c.slug}`}
          className="group flex flex-col items-center gap-2 rounded-2xl p-2 transition hover:bg-white hover:shadow-card"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-full border-[3px] border-white bg-white shadow-[0_8px_24px_-12px_rgba(17,20,23,.35)] ring-1 ring-black/[.04] transition group-hover:ring-accent/40">
            <img
              src={assetUrl(c.image)}
              alt={c.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite-900/80 to-transparent pb-1.5 pt-5 text-center">
              <span className="text-[10px] font-bold text-white">{faNum(c.product_count || 0)} مدل</span>
            </span>
          </div>
          <span className="text-center text-[12px] font-extrabold text-graphite-900 transition group-hover:text-accent-dark">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}
