import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { serverGet } from '@/lib/api';
import { demoPosts } from '@/lib/demo';
import { assetUrl, faNum, formatDate } from '@/lib/format';

export const metadata = { title: 'مجله لیفت تایر', description: 'مقالات آموزشی درباره انتخاب، نگهداری و ایمنی لاستیک خودرو' };
export const revalidate = 0;

export default async function BlogPage() {
  const posts = (await serverGet('/posts', null)) || demoPosts;
  return (
    <>
      <PageHeader title="مجله لیفت تایر" subtitle="راهنمای تخصصی انتخاب و نگهداری لاستیک، نوشته کارشناسان لیفت تایر" breadcrumbs={[{ label: 'مجله' }]} />
      <div className="container-x py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-2xl border border-black/[.06] bg-white transition hover:-translate-y-1 hover:shadow-card">
              <div className="relative aspect-[16/10] overflow-hidden bg-graphite-800">
                <img src={assetUrl(p.cover)} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <span className="absolute right-3 top-3 rounded-lg bg-accent px-2 py-0.5 text-[10px] font-bold text-white">{p.tag}</span>
              </div>
              <div className="p-4">
                <h2 className="line-clamp-2 text-[14px] font-extrabold leading-6 text-graphite-900 group-hover:text-accent-dark">{p.title}</h2>
                <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-5 text-muted">{p.excerpt}</p>
                <div className="mt-3 flex items-center justify-between border-t border-black/[.05] pt-3 text-[10.5px] text-muted">
                  <span>{formatDate(p.created_at)}</span>
                  <span>{faNum(p.read_time)} دقیقه مطالعه</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
