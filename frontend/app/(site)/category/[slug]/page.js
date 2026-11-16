import { notFound } from 'next/navigation';
import Filters from '@/components/Filters';
import ProductResults from '@/components/ProductResults';
import PageHeader from '@/components/PageHeader';
import BrandGuideLinks from '@/components/BrandGuideLinks';
import CategoryGuide from '@/components/CategoryGuide';
import { serverGet, serverGetResult } from '@/lib/api';
import { CATEGORY_GUIDES } from '@/lib/category-guides';
import { listingSeo, listingApiQuery } from '@/lib/listing-seo';
import { absoluteUrl } from '@/lib/seo';
import { assetUrl } from '@/lib/format';

export const revalidate = 0;

function categoryFromResponse(response) {
  if (response.data) return response.data;
  if (response.status === 404) return null;
  // قطعی API یا پاسخ نامعتبر، نبودن دسته را ثابت نمی‌کند و نباید ۴۰۴ جعلی بدهد.
  throw new Error('Cannot load category: API unavailable or response invalid.');
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const found = categoryFromResponse(await serverGetResult(`/categories/${encodeURIComponent(slug)}`));
  if (!found) return { title: 'دسته‌بندی یافت نشد', robots: { index: false, follow: true } };
  const { page, filtered, canonical } = listingSeo(`/category/${encodeURIComponent(slug)}`, await searchParams);
  const title = `${found.name}${page > 1 ? `، صفحه ${page}` : ''}`;
  const description = found.description || `بررسی محصولات دسته ${found.name} و راهنمای انتخاب در لیفت تایر`;
  return {
    title, description, alternates: { canonical },
    openGraph: { title, description, url: absoluteUrl(canonical), type: 'website', images: found.image ? [assetUrl(found.image)] : undefined },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const { page, filtered } = listingSeo(`/category/${encodeURIComponent(slug)}`, sp);
  const qs = listingApiQuery(sp);
  qs.set('category', slug);
  const [categoryResponse, data, categories, brands] = await Promise.all([
    serverGetResult(`/categories/${encodeURIComponent(slug)}`),
    serverGet(`/products?${qs.toString()}`, null),
    serverGet('/categories', []),
    serverGet('/brands', []),
  ]);
  const found = categoryFromResponse(categoryResponse);
  if (!found) notFound();
  const available = Array.isArray(data?.items);
  if (available && page > Math.max(1, Number(data.pages) || 1)) notFound();

  return (
    <>
      <PageHeader title={found.name} subtitle={found.description}
        breadcrumbs={[{ href: '/products', label: 'فروشگاه' }, { label: found.name }]} />
      <div className="container-x py-6">
        <div className="grid gap-5 lg:grid-cols-[248px_1fr]">
          <Filters categories={categories || []} brands={brands || []} lockedCategory={slug} />
          {available ? (
            <ProductResults items={data.items} total={data.total || 0} page={data.page || 1} pages={data.pages || 1} basePath={`/category/${encodeURIComponent(slug)}`} />
          ) : (
            <p role="status" className="rounded-2xl border border-black/[.06] bg-white p-6 text-sm text-muted">دریافت محصولات این دسته فعلاً ممکن نیست؛ لطفاً بعداً دوباره تلاش کنید.</p>
          )}
        </div>
        {!filtered && page === 1 && <CategoryGuide guide={CATEGORY_GUIDES[slug]} />}
        {!filtered && page === 1 && slug === 'passenger' && <BrandGuideLinks />}
      </div>
    </>
  );
}
