import Link from 'next/link';
import { magazinePath } from '@/lib/magazine';
import { assetUrl, faNum, formatDate } from '@/lib/format';

export default function MagazineCard({ post }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-black/[.06] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={magazinePath(post.slug)} className="block h-full">
        <div className="relative aspect-[16/10] overflow-hidden bg-graphite-900">
          <img src={assetUrl(post.cover)} alt={post.cover_alt || post.title} loading="lazy"
            className={`h-full w-full transition duration-500 group-hover:scale-105 ${post.cover_fit === 'contain' ? 'object-contain p-3' : 'object-cover'}`} />
          <span className="absolute right-3 top-3 rounded-lg bg-accent px-2.5 py-1 text-[10px] font-extrabold text-white">{post.sponsored ? 'رپورتاژ' : post.tag || 'مجله'}</span>
        </div>
        <div className="p-5">
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-7 text-graphite-900 transition group-hover:text-accent-dark">{post.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-[44px] text-[12px] leading-[22px] text-muted">{post.excerpt}</p>
          <div className="mt-4 flex items-center justify-between border-t border-black/[.05] pt-3 text-[10.5px] text-muted">
            <span>{formatDate(post.created_at)}</span>
            <span>{faNum(post.read_time || 5)} دقیقه مطالعه <span aria-hidden="true" className="mr-1 text-accent">←</span></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
