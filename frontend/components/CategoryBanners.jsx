import Link from 'next/link';
import { assetUrl } from '@/lib/format';
import { IconArrowLeft } from './Icons';

export default function CategoryBanners({ banners = [] }) {
  if (!banners.length) return null;
  return (
    <section className="section pt-0">
      <div className="container-x grid gap-4 md:grid-cols-2">
        {banners.slice(0, 2).map((b) => (
          <Link
            key={b.id}
            href={b.link || '/products'}
            className="group relative block overflow-hidden rounded-2xl bg-graphite-900"
          >
            <div className="relative aspect-[16/9] sm:aspect-[2/1]">
              <img
                src={assetUrl(b.image)}
                alt={b.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-graphite-900/95 via-graphite-900/60 to-transparent" />
              <div className="absolute inset-y-0 right-0 flex w-[68%] flex-col justify-center p-5 md:p-7">
                <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                  دسته‌بندی ویژه
                </span>
                <h3 className="text-lg font-extrabold text-white md:text-2xl">{b.title}</h3>
                <p className="mt-1 text-[11.5px] text-white/60 md:text-[13px]">{b.subtitle}</p>
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-[12px] font-bold text-white backdrop-blur transition group-hover:bg-accent group-hover:text-white">
                  {b.cta_text || 'مشاهده محصولات'}
                  <IconArrowLeft width={15} height={15} className="transition group-hover:-translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
