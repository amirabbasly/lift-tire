import { notFound } from 'next/navigation';
import Filters from '@/components/Filters';
import ProductResults from '@/components/ProductResults';
import PageHeader from '@/components/PageHeader';
import { serverGet } from '@/lib/api';
import { demoFilter, demoHome } from '@/lib/demo';

export const revalidate = 0;

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const cat = await serverGet(`/categories/${encodeURIComponent(slug)}`, null);
  const found = cat || demoHome.categories.find((c) => c.slug === slug);
  if (!found) return { title: 'دسته‌بندی یافت نشد', robots: { index: false, follow: true } };
  const query = await searchParams;
  const rawPage = Array.isArray(query?.page) ? query.page[0] : query?.page;
  const page = /^[1-9]\d*$/.test(String(rawPage || '')) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 1;
  const filters = Object.entries(query || {}).filter(([key, value]) => key !== 'page' && value !== undefined && value !== '');
  const canonicalQuery = new URLSearchParams();
  if (page > 1) canonicalQuery.set('page', String(page));
  for (const [key, value] of filters.sort(([a], [b]) => a.localeCompare(b))) canonicalQuery.set(key, String(value));
  return {
    title: `${found.name}${page > 1 ? `، صفحه ${page}` : ''}`,
    description: found.description || `خرید ${found.name} از دسته‌بندی‌های لیفت تایر`,
    alternates: { canonical: `/category/${encodeURIComponent(slug)}${canonicalQuery.size ? `?${canonicalQuery}` : ''}` },
    ...(filters.length ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp || {})) if (v !== undefined && v !== '') qs.set(k, String(v));
  qs.set('category', slug);
  qs.set('limit', '12');

  const [category, data, categories, brands] = await Promise.all([
    serverGet(`/categories/${encodeURIComponent(slug)}`, null),
    serverGet(`/products?${qs.toString()}`, null),
    serverGet('/categories', demoHome.categories),
    serverGet('/brands', demoHome.brands),
  ]);

  const found = category || demoHome.categories.find((c) => c.slug === slug);
  if (!found) notFound();

  return (
    <>
      <PageHeader
        title={found.name}
        subtitle={found.description}
        breadcrumbs={[{ href: '/products', label: 'فروشگاه' }, { label: found.name }]}
      />
      <div className="container-x py-6">
        <div className="grid gap-5 lg:grid-cols-[248px_1fr]">
          <Filters categories={categories || []} brands={brands || []} lockedCategory={slug} />
          <ProductResults
            items={data?.items || demoFilter({ category: slug }).items}
            total={data?.total || 0}
            page={data?.page || 1}
            pages={data?.pages || 1}
            basePath={`/category/${slug}`}
          />
        </div>
      </div>
    </>
  );
}
