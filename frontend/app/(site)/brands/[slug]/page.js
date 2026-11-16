import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import { serverGet } from '@/lib/api';
import { getBrandGuide, brandPath } from '@/lib/brand-guides';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getBrandGuide(slug);
  if (!guide) return { title: 'راهنمای برند یافت نشد', robots: { index: false, follow: true } };
  const canonical = brandPath(guide.slug);
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical },
    openGraph: { title: guide.title, description: guide.description, url: absoluteUrl(canonical), type: 'website' },
  };
}

export default async function BrandGuidePage({ params }) {
  const { slug } = await params;
  const guide = getBrandGuide(slug);
  if (!guide) notFound();

  const query = new URLSearchParams({ brand: guide.slug, limit: '12', page: '1' });
  const result = await serverGet(`/products?${query}`, null);
  // فقط نتایج متعلق به همین برند؛ هنگام قطعی API از داده نمایشی استفاده نشود.
  const available = Array.isArray(result?.items);
  const items = available ? result.items.filter((product) => product.brand?.slug === guide.slug) : [];
  const allProducts = `/products?brand=${encodeURIComponent(guide.slug)}`;

  return (
    <>
      <PageHeader title={guide.title} subtitle={guide.description}
        breadcrumbs={[{ label: 'فروشگاه', href: '/products' }, { label: `راهنمای ${guide.name}` }]} />
      <div className="container-x space-y-8 py-7 md:py-10">
        <article className="max-w-4xl rounded-2xl border border-black/[.06] bg-white p-5 text-[13px] leading-8 text-steel-500 md:p-7">
          <p>{guide.intro}</p>
          {guide.sections.map((section) => (
            <section key={section.title} className="mt-5">
              <h2 className="text-[15px] font-extrabold text-graphite-900">{section.title}</h2>
              <p className="mt-2">{section.text}</p>
            </section>
          ))}
          <p className="mt-5">منبع سازنده: <a href={guide.source.url} target="_blank" rel="noopener noreferrer" className="font-bold text-accent-dark underline">{guide.source.label}</a>.</p>
        </article>
        <section aria-labelledby="brand-products-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="brand-products-title" className="text-lg font-extrabold text-graphite-900">محصولات ثبت‌شده با برند {guide.name}</h2>
            <Link href={allProducts} className="text-[12px] font-bold text-accent-dark hover:underline">مشاهده فهرست کامل محصولات ←</Link>
          </div>
          {!available ? (
            <p role="status" className="rounded-2xl border border-black/[.06] bg-white p-5 text-sm text-muted">دریافت فهرست محصولات فعلاً ممکن نیست؛ لطفاً بعداً دوباره بررسی کنید.</p>
          ) : items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((product, index) => <ProductCard key={product.id} product={product} index={index} showRating={false} strictData />)}
            </div>
          ) : (
            <p className="rounded-2xl border border-black/[.06] bg-white p-5 text-sm text-muted">در حال حاضر محصولی از این برند در فهرست نمایش داده نمی‌شود.</p>
          )}
        </section>
        <nav aria-label="راهنماهای مرتبط" className="rounded-2xl bg-graphite-900 p-5 text-[12px] leading-7 text-white">
          <h2 className="text-[15px] font-extrabold">پیش از انتخاب تایر</h2>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
            <Link className="underline" href="/blog/how-to-read-tire-size">خواندن سایز تایر</Link>
            <Link className="underline" href="/blog/tire-load-speed-index-guide">شاخص بار و سرعت</Link>
            <Link className="underline" href="/blog/tire-dot-date-guide">تاریخ تولید تایر</Link>
            <Link className="underline" href="/category/passenger">دسته لاستیک سواری</Link>
          </div>
        </nav>
      </div>
    </>
  );
}
