import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import MagazineNav from '@/components/MagazineNav';
import JsonLd from '@/components/JsonLd';
import { getMagazinePosts, magazineCategory, magazinePath, MAGAZINE_CATEGORIES, safeArticleHtml } from '@/lib/magazine';
import { absoluteUrl, articleSchema, validIsoDate } from '@/lib/seo';
import { assetUrl, faNum, formatDate } from '@/lib/format';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = (await getMagazinePosts()).find((item) => item.slug === slug);
  if (!post) return { title: 'مقاله یافت نشد', robots: { index: false, follow: true } };
  const canonical = magazinePath(post.slug);
  const description = post.excerpt || '';
  return {
    title: post.title, description, alternates: { canonical },
    openGraph: {
      type: 'article', title: post.title, description, url: absoluteUrl(canonical),
      publishedTime: validIsoDate(post.created_at), modifiedTime: validIsoDate(post.updated_at),
      images: post.cover ? [{ url: assetUrl(post.cover), alt: post.cover_alt || post.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: post.title, description, images: post.cover ? [assetUrl(post.cover)] : undefined },
  };
}

function TableOfContents({ post, className = '' }) {
  if (!post.toc?.length) return null;
  return (
    <nav aria-label="فهرست مقاله" className={`rounded-2xl border border-black/[.06] bg-white p-5 ${className}`}>
      <h2 className="mb-3 text-[13px] font-extrabold text-graphite-900">در این مقاله می‌خوانید</h2>
      <ol className="space-y-2.5">
        {post.toc.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="flex gap-2 text-[12px] leading-6 text-steel-500 hover:text-accent-dark">
              <span className="num shrink-0 font-bold text-accent">{faNum(index + 1)}.</span>{item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const posts = await getMagazinePosts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();
  const categorySlug = magazineCategory(post);
  const category = MAGAZINE_CATEGORIES.find((item) => item.slug === categorySlug);
  const others = [...posts.filter((item) => item.slug !== slug && magazineCategory(item) === categorySlug), ...posts.filter((item) => item.slug !== slug && magazineCategory(item) !== categorySlug)].slice(0, 3);
  const index = posts.findIndex((item) => item.slug === slug);
  const newer = index > 0 ? posts[index - 1] : null;
  const older = posts[index + 1] || null;
  const breadcrumbs = [{ label: 'مجله', href: '/blog' }, ...(category ? [{ label: category.label, href: `/blog/category/${category.slug}` }] : []), { label: post.title }];

  return (
    <>
      <JsonLd data={articleSchema(post)} />
      <PageHeader title={post.title} subtitle={post.excerpt} breadcrumbs={breadcrumbs} />
      <MagazineNav active={categorySlug || 'all'} />
      <div className="container-x grid gap-6 py-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-9">
        <article className="min-w-0">
          {post.sponsored && <p className="mb-4 rounded-xl border border-accent/20 bg-accent-soft px-4 py-3 text-[12px] font-bold leading-6 text-accent-dark">این مطلب یک رپورتاژ معرفی خودرو چاره است.</p>}
          <div className={`overflow-hidden rounded-2xl bg-graphite-900 ${post.cover_fit === 'contain' ? 'grid min-h-[180px] place-items-center p-6 md:min-h-[280px]' : ''}`}>
            <img src={assetUrl(post.cover)} alt={post.cover_alt || post.title}
              className={post.cover_fit === 'contain' ? 'max-h-60 w-full object-contain' : 'aspect-[16/9] w-full object-cover'} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted">
            <span className="rounded-lg bg-accent-soft px-2.5 py-1 font-bold text-accent-dark">{post.tag || 'مجله'}</span>
            <span>{post.author || 'تحریریه لیفت تایر'}</span>
            {post.created_at && <time dateTime={validIsoDate(post.created_at)}>{formatDate(post.created_at)}</time>}
            <span>{faNum(post.read_time || 5)} دقیقه مطالعه</span>
          </div>
          <TableOfContents post={post} className="mt-6 lg:hidden" />
          <div className="prose-fa mt-6 rounded-2xl border border-black/[.06] bg-white p-5 text-[13.5px] leading-8 text-steel-500 md:p-8"
            dangerouslySetInnerHTML={{ __html: safeArticleHtml(post.content) }} />
          <nav aria-label="مقاله‌های قبلی و بعدی" className="mt-6 grid gap-3 sm:grid-cols-2">
            {newer && <Link href={magazinePath(newer.slug)} className="rounded-2xl border border-black/[.06] bg-white p-4 hover:border-accent/40"><span className="block text-[10px] text-muted">مطلب جدیدتر</span><span className="mt-1 block text-[12px] font-extrabold leading-6 text-graphite-900">{newer.title}</span></Link>}
            {older && <Link href={magazinePath(older.slug)} className="rounded-2xl border border-black/[.06] bg-white p-4 hover:border-accent/40"><span className="block text-[10px] text-muted">مطلب قدیمی‌تر</span><span className="mt-1 block text-[12px] font-extrabold leading-6 text-graphite-900">{older.title}</span></Link>}
          </nav>
          <Link href="/blog" className="mt-5 inline-flex text-[12px] font-bold text-accent-dark hover:underline">← بازگشت به همه مطالب مجله</Link>
        </article>
        <aside className="space-y-4">
          <TableOfContents post={post} className="hidden lg:block" />
          <div className="rounded-2xl border border-black/[.06] bg-white p-5">
            <h2 className="mb-4 text-[13px] font-extrabold text-graphite-900">مطالب پیشنهادی</h2>
            <div className="space-y-4">
              {others.map((item) => (
                <Link key={item.slug} href={magazinePath(item.slug)} className="group flex items-center gap-3">
                  <img src={assetUrl(item.cover)} alt="" className={`h-14 w-16 shrink-0 rounded-lg bg-graphite-900 ${item.cover_fit === 'contain' ? 'object-contain' : 'object-cover'}`} loading="lazy" />
                  <span className="text-[11.5px] font-bold leading-5 text-graphite-800 group-hover:text-accent-dark">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-graphite-900 p-5 text-white">
            <p className="text-[13px] font-extrabold">برای انتخاب آماده‌اید؟</p>
            <p className="mt-2 text-[11px] leading-6 text-white/60">سایز و مشخصات تایر مناسب خودرو را در فروشگاه بررسی کنید.</p>
            <Link href="/products" className="btn-accent mt-4 w-full !py-2.5 text-[11.5px]">مشاهده فروشگاه لاستیک</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
