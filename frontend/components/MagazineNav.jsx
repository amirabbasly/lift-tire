import Link from 'next/link';
import { MAGAZINE_CATEGORIES } from '@/lib/magazine';

export default function MagazineNav({ active = 'all' }) {
  const items = [{ slug: 'all', label: 'همه مطالب', href: '/blog' }, ...MAGAZINE_CATEGORIES.map((item) => ({ ...item, href: `/blog/category/${item.slug}` }))];
  return (
    <nav aria-label="موضوعات مجله" className="border-b border-black/[.06] bg-white">
      <div className="container-x flex items-center gap-2 overflow-x-auto py-3 no-scrollbar">
        <span className="ml-2 hidden shrink-0 text-[11px] font-extrabold text-muted sm:block">گشت‌وگذار در مجله</span>
        {items.map((item) => (
          <Link key={item.slug} href={item.href} aria-current={active === item.slug ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-bold transition ${active === item.slug ? 'bg-graphite-900 text-white' : 'bg-surface text-steel-500 hover:bg-accent-soft hover:text-accent-dark'}`}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
