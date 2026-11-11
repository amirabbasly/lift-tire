import Filters from '@/components/Filters';
import ProductResults from '@/components/ProductResults';
import PageHeader from '@/components/PageHeader';
import { serverGet } from '@/lib/api';
import { demoFilter, demoHome } from '@/lib/demo';

export const revalidate = 0;

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const rawPage = Array.isArray(params?.page) ? params.page[0] : params?.page;
  const page = /^[1-9]\d*$/.test(String(rawPage || '')) && Number.isSafeInteger(Number(rawPage)) ? Number(rawPage) : 1;
  const filters = Object.entries(params || {}).filter(([key, value]) => key !== 'page' && value !== undefined && value !== '');
  const query = new URLSearchParams();
  if (page > 1) query.set('page', String(page));
  for (const [key, value] of filters.sort(([a], [b]) => a.localeCompare(b))) query.set(key, String(value));
  const canonical = `/products${query.size ? `?${query}` : ''}`;
  return {
    title: `فروشگاه لاستیک${page > 1 ? `، صفحه ${page}` : ''}`,
    description: 'خرید لاستیک خودرو با فیلتر برند، سایز، فصل و قیمت؛ ارسال به سراسر ایران.',
    alternates: { canonical },
    ...(filters.length ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp || {})) if (v !== undefined && v !== '') qs.set(k, String(v));
  qs.set('limit', '12');

  const [data, categories, brands] = await Promise.all([
    serverGet(`/products?${qs.toString()}`, null),
    serverGet('/categories', demoHome.categories),
    serverGet('/brands', demoHome.brands),
  ]);

  const result = data || demoFilter({ ...sp, limit: 12 });

  return (
    <>
      <PageHeader
        title="فروشگاه لاستیک لیفت تایر"
        subtitle="لاستیک اصل با ضمانت اصالت و تاریخ تولید — ارسال به سراسر ایران با باربری و پست پیشتاز"
        breadcrumbs={[{ label: 'فروشگاه', href: '/products' }]}
      />
      <div className="container-x py-6">
        <div className="grid gap-5 lg:grid-cols-[248px_1fr]">
          <Filters categories={categories || []} brands={brands || []} />
          <ProductResults
            items={result.items || []}
            total={result.total || 0}
            page={result.page || 1}
            pages={result.pages || 1}
            limit={result.limit || 12}
          />
        </div>
      </div>
    </>
  );
}
