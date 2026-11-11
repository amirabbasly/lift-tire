import MagazineIndex from '@/components/MagazineIndex';
import { getMagazinePosts, pageNumber, pagePath } from '@/lib/magazine';
import { absoluteUrl } from '@/lib/seo';
import { faNum } from '@/lib/format';

export const revalidate = 0;

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const page = pageNumber(params?.page);
  const title = `مجله خودرو و لاستیک${page > 1 ? `، صفحه ${faNum(page)}` : ''}`;
  const description = 'مجله لیفت تایر؛ راهنمای خرید و نگهداری لاستیک، ایمنی سفر و معرفی خدمات خودرویی.';
  const canonical = pagePath('/blog', page);
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: absoluteUrl(canonical), type: 'website', images: ['/images/blog/blog-2.jpg'] } };
}

export default async function BlogPage({ searchParams }) {
  const params = await searchParams;
  return <MagazineIndex posts={await getMagazinePosts()} page={pageNumber(params?.page)} />;
}
