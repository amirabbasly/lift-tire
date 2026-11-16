import Link from 'next/link';
import { BRAND_GUIDES, brandPath } from '@/lib/brand-guides';

export default function BrandGuideLinks() {
  return (
    <section aria-labelledby="brand-guides-title" className="mt-8 rounded-2xl border border-black/[.06] bg-white p-5">
      <h2 id="brand-guides-title" className="text-[15px] font-extrabold text-graphite-900">راهنمای انتخاب بر اساس برند</h2>
      <p className="mt-2 text-[12px] leading-6 text-muted">سایز، شاخص‌ها و جزئیات هر محصول را جداگانه بررسی کنید.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {BRAND_GUIDES.map((guide) => (
          <Link key={guide.slug} href={brandPath(guide.slug)} className="rounded-xl bg-surface px-4 py-2 text-[12px] font-bold text-accent-dark hover:bg-accent-soft">
            راهنمای لاستیک {guide.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
