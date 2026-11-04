import Link from 'next/link';
import SectionTitle from './SectionTitle';
import { assetUrl, faNum, formatDate } from '@/lib/format';
import { IconArrowLeft } from './Icons';

export default function BlogCards({ posts = [] }) {
  if (!posts.length) return null;
  return (
    <section className="section pt-0">
      <div className="container-x">
        <SectionTitle title="مجله لیفت تایر" subtitle="راهنمای انتخاب، نگهداری و ایمنی لاستیک" href="/blog" linkLabel="همه مقالات" />
        <div className="grid gap-4 md:grid-cols-3">
          {posts.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-2xl border border-black/[.06] bg-card transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-graphite-800">
                <img
                  src={assetUrl(p.cover)}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute right-3 top-3 rounded-lg bg-accent px-2 py-0.5 text-[10px] font-bold text-white">{p.tag}</span>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 text-[14px] font-extrabold leading-6 text-graphite-900 transition group-hover:text-accent-dark">{p.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-5 text-muted">{p.excerpt}</p>
                <div className="mt-3 flex items-center justify-between border-t border-black/[.05] pt-3 text-[10.5px] text-muted">
                  <span>{formatDate(p.created_at)}</span>
                  <span className="flex items-center gap-1 font-bold text-accent-dark">
                    {faNum(p.read_time || 5)} دقیقه مطالعه <IconArrowLeft width={13} height={13} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
