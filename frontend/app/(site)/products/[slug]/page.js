import { notFound } from 'next/navigation';
import Link from 'next/link';
import Gallery from '@/components/Gallery';
import ProductPurchase from '@/components/ProductPurchase';
import DetailTabs from '@/components/DetailTabs';
import ProductRail from '@/components/ProductRail';
import SectionTitle from '@/components/SectionTitle';
import { serverGet } from '@/lib/api';
import { TRUST } from '@/lib/constants';
import JsonLd from '@/components/JsonLd';
import { absoluteUrl, breadcrumbSchema } from '@/lib/seo';
import { assetUrl } from '@/lib/format';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await serverGet(`/products/${encodeURIComponent(slug)}`, null);
  if (!product) return { title: 'محصول یافت نشد', robots: { index: false, follow: true } };
  const title = `${product.name} ${product.size || ''}`.trim();
  const description = product.short_desc || `${product.name} با سایز ${product.size || ''} در لیفت تایر`;
  const canonical = `/products/${encodeURIComponent(slug)}`;
  return {
    title, description, alternates: { canonical },
    openGraph: { title, description, url: absoluteUrl(canonical), type: 'website', images: product.image ? [assetUrl(product.image)] : undefined },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await serverGet(`/products/${encodeURIComponent(slug)}`, null);
  if (!product) notFound();

  const related = product.related || [];
  const productUrl = absoluteUrl(`/products/${encodeURIComponent(slug)}`);
  const breadcrumbs = [
    { label: 'خانه', href: '/' }, { label: 'فروشگاه', href: '/products' },
    ...(product.category ? [{ label: product.category.name, href: `/category/${encodeURIComponent(product.category.slug)}` }] : []),
    { label: product.name },
  ];
  const price = Number(product.price);
  const productSchema = {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name,
    description: product.short_desc || undefined,
    image: product.image ? [absoluteUrl(assetUrl(product.image))] : undefined,
    sku: product.sku || undefined,
    brand: product.brand?.name_fa ? { '@type': 'Brand', name: product.brand.name_fa } : undefined,
    ...(Number.isFinite(price) && price > 0 ? { offers: {
      '@type': 'Offer', url: productUrl, priceCurrency: 'IRR', price: price * 10,
      availability: Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
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
          <ProductPurchase product={product} />
        </div>

        <div className="mt-6">
          <DetailTabs product={product} />
        </div>

        {/* بلوک‌های اعتماد با تصویر */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-2.5 rounded-2xl border border-black/[.06] bg-white p-3">
              <img src={t.icon} alt={t.title} className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
              <div>
                <p className="text-[11px] font-extrabold leading-tight text-graphite-900">{t.title}</p>
                <p className="mt-0.5 text-[10px] text-muted">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <SectionTitle title="محصولات مرتبط" subtitle="گزینه‌های مشابه از نظر برند یا دسته‌بندی" />
            <ProductRail products={related} />
          </section>
        )}

        <div className="mt-8 rounded-2xl bg-graphite-900 p-5 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-[15px] font-extrabold">در انتخاب سایز مطمئن نیستید؟</p>
            <p className="mt-1 text-[12px] text-white/55">کارشناسان لیفت تایر رایگان مشاوره می‌دهند: ۰۲۱-۹۱۰۰۱۲۳۴</p>
          </div>
          <div className="mt-3 flex gap-2 md:mt-0">
            <a href="tel:02191001234" className="btn-accent !py-2.5 text-[12px]">تماس با کارشناس</a>
            <Link href="/faq" className="rounded-xl border border-white/20 px-4 py-2.5 text-[12px] font-bold text-white/80 hover:border-accent hover:text-accent">سوالات متداول</Link>
          </div>
        </div>
      </div>
    </>
  );
}
