import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from './PageHeader';
import MagazineNav from './MagazineNav';
import MagazineCard from './MagazineCard';
import { MAGAZINE_PAGE_SIZE, magazineCategory, magazinePath, pagePath } from '@/lib/magazine';
import { faNum } from '@/lib/format';

function Pagination({ path, page, pages }) {
  if (pages <= 1) return null;
  const numbers = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);
  return (
    <nav aria-label="صفحه‌بندی مجله" className="mt-10 flex flex-wrap items-center justify-center gap-2" dir="rtl">
      {page > 1 && <Link href={pagePath(path, page - 1)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold hover:text-accent-dark">صفحه قبل</Link>}
      {numbers.map((n, i) => (
        <span key={n} className="flex items-center gap-2">
          {i > 0 && n - numbers[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link href={pagePath(path, n)} aria-current={n === page ? 'page' : undefined} aria-label={`صفحه ${faNum(n)}`}
            className={`grid h-10 min-w-10 place-items-center rounded-xl px-3 text-xs font-bold ${n === page ? 'bg-accent text-white' : 'border border-black/10 bg-white text-steel-500 hover:text-accent-dark'}`}>
            {faNum(n)}
          </Link>
        </span>
      ))}
      {page < pages && <Link href={pagePath(path, page + 1)} className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-bold hover:text-accent-dark">صفحه بعد</Link>}
    </nav>
  );
}

export default function MagazineIndex({ posts, category, page }) {
  const filtered = category ? posts.filter((post) => magazineCategory(post) === category.slug) : posts;
  const pages = Math.max(1, Math.ceil(filtered.length / MAGAZINE_PAGE_SIZE));
  if (page > pages) notFound();
  const visible = filtered.slice((page - 1) * MAGAZINE_PAGE_SIZE, page * MAGAZINE_PAGE_SIZE);
  const path = category ? `/blog/category/${category.slug}` : '/blog';
  const featured = !category && page === 1 ? posts.find((post) => post.slug === 'khodro-chare-national-automotive-services') : null;

  return (
    <>
      <PageHeader title={category ? `${category.label} | مجله لیفت تایر` : 'مجله لیفت تایر'}
        subtitle={category?.description || 'راهنماهای کاربردی برای انتخاب لاستیک، نگهداری خودرو و سفر ایمن‌تر'}
        breadcrumbs={category ? [{ label: 'مجله', href: '/blog' }, { label: category.label }] : [{ label: 'مجله' }]} />
      <MagazineNav active={category?.slug || 'all'} />
      <div className="container-x pb-10 pt-6 md:pb-14 md:pt-8">
        {featured && (
          <section aria-labelledby="featured-title" className="relative mb-10 overflow-hidden rounded-[24px] bg-graphite-900 text-white">
            <div className="absolute inset-0 tire-pattern opacity-60" aria-hidden="true" />
            <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1.1fr_.9fr] md:p-9">
              <div>
                <span className="inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-extrabold text-accent">گزارش ویژه · رپورتاژ</span>
                <h2 id="featured-title" className="mt-3 max-w-2xl text-xl font-extrabold leading-9 md:text-[25px] md:leading-[1.8]">{featured.title}</h2>
                <p className="mt-2 max-w-xl text-[12px] leading-7 text-white/65">{featured.excerpt}</p>
                <Link href={magazinePath(featured.slug)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs font-extrabold text-white transition hover:bg-accent-dark">خواندن گزارش <span aria-hidden="true">←</span></Link>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/60 p-3">
                <img src="/images/partners/khodrochare-logo.webp" alt="نشان رسمی خودرو چاره" className="mx-auto max-h-40 w-full object-contain" />
              </div>
            </div>
          </section>
        )}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <div><p className="mb-1 text-[10px] font-extrabold text-accent-dark">LIFT TIRE MAGAZINE</p><h2 className="text-lg font-extrabold text-graphite-900">{category ? `مطالب ${category.label}` : 'تازه‌های مجله'}</h2></div>
          <p className="text-xs text-muted">{faNum(filtered.length)} مطلب {pages > 1 ? `· صفحه ${faNum(page)} از ${faNum(pages)}` : ''}</p>
        </div>
        {visible.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((post) => <MagazineCard key={post.slug} post={post} />)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-muted">هنوز مطلبی در این موضوع منتشر نشده است. <Link className="font-bold text-accent-dark" href="/blog">همه مطالب مجله</Link></div>
        )}
        <Pagination path={path} page={page} pages={pages} />
      </div>
    </>
  );
}
