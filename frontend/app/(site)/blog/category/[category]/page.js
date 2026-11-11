import { notFound } from 'next/navigation';
import MagazineIndex from '@/components/MagazineIndex';
import { getMagazinePosts, MAGAZINE_CATEGORIES, pageNumber, pagePath } from '@/lib/magazine';
import { absoluteUrl } from '@/lib/seo';
import { faNum } from '@/lib/format';

export const revalidate = 0;

export async function generateMetadata({ params, searchParams }) {
  const { category: slug } = await params;
  const category = MAGAZINE_CATEGORIES.find((item) => item.slug === slug);
  if (!category) return { title: 'موضوع یافت نشد', robots: { index: false, follow: true } };
  const query = await searchParams;
  const page = pageNumber(query?.page);
  const canonical = pagePath(`/blog/category/${category.slug}`, page);
  const title = `${category.label} | مجله${page > 1 ? `، صفحه ${faNum(page)}` : ''}`;
  return { title, description: category.description, alternates: { canonical }, openGraph: { title, description: category.description, url: absoluteUrl(canonical), type: 'website', images: ['/images/blog/blog-2.jpg'] } };
}

export default async function MagazineCategoryPage({ params, searchParams }) {
  const { category: slug } = await params;
  const category = MAGAZINE_CATEGORIES.find((item) => item.slug === slug);
  if (!category) notFound();
  const query = await searchParams;
  return <MagazineIndex posts={await getMagazinePosts()} category={category} page={pageNumber(query?.page)} />;
}
