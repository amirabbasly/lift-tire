import { notFound } from 'next/navigation';
import Filters from '@/components/Filters';
import ProductResults from '@/components/ProductResults';
import PageHeader from '@/components/PageHeader';
import BrandGuideLinks from '@/components/BrandGuideLinks';
import { serverGet } from '@/lib/api';
import { listingSeo, listingApiQuery } from '@/lib/listing-seo';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 0;

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const { page, filtered, canonical } = listingSeo('/products', params);
  const title = `فروشگاه لاستیک${page > 1 ? `، صفحه ${page}` : ''}`;
  const description = 'مرور محصولات فروشگاه و بررسی سایز، برند، مشخصات و موجودی ثبت‌شده هر کالا.';
  return {
    title, description, alternates: { canonical },
    openGraph: { title, description, url: absoluteUrl(canonical), type: 'website' },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const { page, filtered } = listingSeo('/products', sp);
  const qs = listingApiQuery(sp);
  const [data, categories, brands] = await Promise.all([
    serverGet(`/products?${qs.toString()}`, null),
    serverGet('/categories', []),
    serverGet('/brands', []),
  ]);
  const available = Array.isArray(data?.items);
  if (available && page > Math.max(1, Number(data.pages) || 1)) notFound();

  return (
    <>
      <PageHeader
        title="فروشگاه لاستیک لیفت تایر"
        subtitle="محصولات ثبت‌شده را بر اساس سایز، برند، فصل و مشخصات بررسی کنید."
        breadcrumbs={[{ label: 'فروشگاه', href: '/products' }]}
      />
      <div className="container-x py-6">
        <div className="grid gap-5 lg:grid-cols-[248px_1fr]">
          <Filters categories={categories || []} brands={brands || []} />
          {available ? (
            <ProductResults items={data.items} total={data.total || 0} page={data.page || 1} pages={data.pages || 1} limit={data.limit || 12} />
          ) : (
            <p role="status" className="rounded-2xl border border-black/[.06] bg-white p-6 text-sm text-muted">دریافت محصولات فعلاً ممکن نیست؛ لطفاً بعداً دوباره تلاش کنید.</p>
          )}
        </div>
        {!filtered && page === 1 && <BrandGuideLinks />}
      </div>
    </>
  );
}
