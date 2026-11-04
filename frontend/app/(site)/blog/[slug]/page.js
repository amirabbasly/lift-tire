import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { serverGet } from '@/lib/api';
import { demoPosts } from '@/lib/demo';
import { assetUrl, faNum, formatDate } from '@/lib/format';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = (await serverGet(`/posts/${slug}`, null)) || demoPosts.find((p) => p.slug === slug);
  if (!post) return { title: 'مقاله' };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = (await serverGet(`/posts/${slug}`, null)) || demoPosts.find((p) => p.slug === slug);
  if (!post) notFound();
  const all = (await serverGet('/posts', null)) || demoPosts;
  const others = all.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <>
      <PageHeader title={post.title} subtitle={post.excerpt} breadcrumbs={[{ label: 'مجله', href: '/blog' }, { label: post.tag }]} />
      <article className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="overflow-hidden rounded-2xl bg-graphite-800">
            <img src={assetUrl(post.cover)} alt={post.title} className="aspect-[16/9] w-full object-cover" />
          </div>
          <div className="mt-4 flex items-center gap-3 text-[11px] text-muted">
            <span className="rounded-lg bg-accent-soft px-2 py-0.5 font-bold text-accent-dark">{post.tag}</span>
            <span>{post.author}</span>
            <span>{formatDate(post.created_at)}</span>
            <span>{faNum(post.read_time)} دقیقه مطالعه</span>
          </div>
          <div className="prose-fa mt-5 space-y-4 text-[13.5px] leading-8 text-steel-500" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-black/[.06] bg-white p-4">
            <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">مقالات دیگر</h3>
            <div className="space-y-3">
              {others.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-2.5 group">
                  <img src={assetUrl(p.cover)} alt='' className="h-14 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <span className="text-[11.5px] font-bold leading-5 text-graphite-800 group-hover:text-accent-dark">{p.title}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-graphite-900 p-4 text-white">
            <p className="text-[13px] font-extrabold">مشاوره تخصصی رایگان</p>
            <p className="mt-1 text-[11px] leading-5 text-white/55">برای انتخاب سایز و برند مناسب خودروی خود با ما تماس بگیرید.</p>
            <a href="tel:02191001234" className="btn-accent mt-3 w-full !py-2 text-[11.5px]">۰۲۱-۹۱۰۰۱۲۳۴</a>
          </div>
        </aside>
      </article>
      <style>{`.prose-fa h2{font-size:16px;font-weight:800;color:#14181C;margin-top:22px;margin-bottom:8px}.prose-fa p{margin-bottom:10px}.prose-fa strong{color:#14181C}`}</style>
    </>
  );
}
