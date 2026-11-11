import Link from 'next/link';
import { IconChevron } from './Icons';
import JsonLd from './JsonLd';
import { breadcrumbSchema } from '@/lib/seo';

export default function PageHeader({ title, subtitle, breadcrumbs = [], children }) {
  return (
    <div className="border-b border-black/[.06] bg-white">
      {breadcrumbs.length > 0 && <JsonLd data={breadcrumbSchema([{ label: 'خانه', href: '/' }, ...breadcrumbs])} />}
      <div className="container-x py-5">
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-[11px] text-muted" aria-label="مسیر">
          <Link href="/" className="hover:text-accent">خانه</Link>
          {breadcrumbs.map((b) => (
            <span key={b.href || b.label} className="flex items-center gap-1">
              <IconChevron width={11} height={11} className="text-muted/50" />
              {b.href ? <Link href={b.href} className="hover:text-accent">{b.label}</Link> : <span className="text-graphite-800">{b.label}</span>}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-graphite-900 md:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-[12.5px] text-muted">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
