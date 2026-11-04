import Link from 'next/link';
import { IconChevron } from './Icons';

export default function SectionTitle({ title, subtitle, href, linkLabel = 'مشاهده همه', light = false, center = false, children }) {
  return (
    <div className={`mb-6 flex flex-wrap items-end justify-between gap-3 ${center ? 'flex-col !items-center text-center' : ''}`}>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-6 w-1.5 rounded-full bg-accent" />
          <h2 className={`text-xl font-extrabold md:text-2xl ${light ? 'text-white' : 'text-graphite-900'}`}>{title}</h2>
        </div>
        {subtitle && <p className={`text-sm ${light ? 'text-white/60' : 'text-muted'}`}>{subtitle}</p>}
      </div>
      {children}
      {href && (
        <Link
          href={href}
          className={`inline-flex items-center gap-1 text-sm font-bold transition hover:gap-2 ${light ? 'text-white/80 hover:text-accent' : 'text-accent-dark hover:text-accent'}`}
        >
          {linkLabel}
          <IconChevron width={16} height={16} className="rotate-180" />
        </Link>
      )}
    </div>
  );
}
