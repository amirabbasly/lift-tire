import { notFound } from 'next/navigation';
import Link from 'next/link';
import Gallery from '@/components/Gallery';
import ProductPurchase from '@/components/ProductPurchase';
import DetailTabs from '@/components/DetailTabs';
import ProductRail from '@/components/ProductRail';
import SectionTitle from '@/components/SectionTitle';
import { serverGet, serverGetResult } from '@/lib/api';
import { getBrandGuide, brandPath } from '@/lib/brand-guides';
import { publicReviews, reviewSummary } from '@/lib/reviews';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbSchema } from '@/lib/seo';
import { assetUrl } from '@/lib/format';

export const revalidate = 0;

async function loadProduct(slug) {
  const result = await serverGetResult(`/products/${encodeURIComponent(slug)}`);
  if (result.data) return result.data;
  if (result.status === 404) return null;
  // خطای سرویس نباید باعث ۴۰۴ یا حذف محصول واقعی از جست‌وجو شود.
  throw new Error('Cannot load product: API unavailable or response invalid.');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: 'محصول یافت نشد', robots: { index: false, follow: true } };
  const title = `${product.name} ${product.size || ''}`.trim();
  const description = product.short_desc || `بررسی مشخصات ${product.name}${product.size ? `، سایز ${product.size}` : ''} در فروشگاه لیفت تایر.`;
  const canonical = `/products/${encodeURIComponent(slug)}`;
  return {
    title, description, alternates: { canonical },
    openGraph: { title, description, url: absoluteUrl(canonical), type: 'website', images: product.image ? [assetUrl(product.image)] : undefined },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const related = product.related || [];
  const reviews = publicReviews(await serverGet(`/reviews?product_id=${encodeURIComponent(product.id)}`, null));
  const guide = getBrandGuide(product.brand?.slug);
  const isTire = ['passenger', 'offroad', 'truck'].includes(product.category?.slug);
  const productUrl = absoluteUrl(`/products/${encodeURIComponent(slug)}`);
  const breadcrumbs = [
    { label: 'خانه', href: '/' }, { label: 'فروشگاه', href: '/products' },
    ...(product.category ? [{ label: product.category.name, href: `/category/${encodeURIComponent(product.category.slug)}` }] : []),
    { label: product.name },
  ];
  const price = Number(product.price);
  const stock = product.stock === null || product.stock === undefined || String(product.stock).trim() === '' ? NaN : Number(product.stock);
  const productSchema = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    description: product.short_desc || undefined,
    image: product.image ? [absoluteUrl(assetUrl(product.image))] : undefined,
    sku: product.sku || undefined,
    brand: product.brand?.name_fa ? { '@type': 'Brand', name: product.brand.name_fa } : undefined,
    ...(Number.isFinite(price) && price > 0 ? { offers: {
      '@type': 'Offer', url: productUrl, priceCurrency: 'IRR', price: price * 10,
      ...(Number.isFinite(stock) && stock >= 0 ? { availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } : {}),
    } } : {}),
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <JsonLd data={productSchema} />
      <nav className="border-b border-black/[.06] bg-white" aria-label="مسیر">
        <div className="container-x flex flex-wrap items-center gap-1.5 py-3 text-[11px] text-muted">
          <Link href="/" className="hover:text-accent">خانه</Link>
          <span className="text-muted/40">/</span>
          <Link href="/products" className="hover:text-accent">فروشگاه</Link>
          {product.category && (
            <>
              <span className="text-muted/40">/</span>
              <Link href={`/category/${product.category.slug}`} className="hover:text-accent">{product.category.name}</Link>
            </>
          )}
          <span className="text-muted/40">/</span>
          <span className="font-semibold text-graphite-800">{product.name}</span>
        </div>
      </nav>

      <div className="container-x py-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <Gallery images={product.images} alt={product.name} />
          <ProductPurchase product={product} ratingSummary={reviewSummary(reviews)} />
        </div>

        <div className="mt-6">
          <DetailTabs product={product} initialReviews={reviews} />
        </div>

        {(isTire || guide) && (
          <section aria-labelledby="product-buying-help" className="mt-6 rounded-2xl border border-black/[.06] bg-white p-5">
            <h2 id="product-buying-help" className="text-[15px] font-extrabold text-graphite-900">پیش از انتخاب محصول</h2>
            <p className="mt-2 text-[12px] leading-7 text-steel-500">مشخصات ثبت‌شده را با دفترچه خودروی همان تیپ و محصول مقایسه کنید؛ درباره موارد نامشخص مانند تاریخ تولید یا شرایط ضمانت پیش از سفارش سؤال کنید.</p>
            <nav aria-label="راهنماهای انتخاب" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-bold text-accent-dark">
              {isTire && <Link href="/blog/tire-load-speed-index-guide" className="hover:underline">شاخص بار و سرعت ←</Link>}
              {isTire && <Link href="/blog/tire-dot-date-guide" className="hover:underline">تاریخ تولید لاستیک ←</Link>}
              {guide && <Link href={brandPath(guide.slug)} className="hover:underline">راهنمای برند {guide.name} ←</Link>}
            </nav>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <SectionTitle title="محصولات مرتبط" subtitle="گزینه‌های مشابه از نظر برند یا دسته‌بندی" />
            <ProductRail products={related} showRating={false} strictData />
          </section>
        )}

        <div className="mt-8 rounded-2xl bg-graphite-900 p-5 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-[15px] font-extrabold">در انتخاب سایز مطمئن نیستید؟</p>
            <p className="mt-1 text-[12px] text-white/55">برای پرسش درباره مشخصات کالا با فروشگاه ارتباط بگیرید.</p>
          </div>
          <div className="mt-3 flex gap-2 md:mt-0">
            <Link href="/contact" className="btn-accent !py-2.5 text-[12px]">اطلاعات تماس</Link>
            <Link href="/faq" className="rounded-xl border border-white/20 px-4 py-2.5 text-[12px] font-bold text-white/80 hover:border-accent hover:text-accent">سوالات متداول</Link>
          </div>
        </div>
      </div>
    </>
  );
}
