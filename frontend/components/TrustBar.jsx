import { TRUST } from '@/lib/constants';

export default function TrustBar({ items = TRUST, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 md:gap-3 ${className}`}>
      {items.map((t, i) => (
        <div
          key={t.title}
          className={`group flex items-center gap-2.5 rounded-2xl border border-black/[.06] bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card sm:gap-3 sm:p-3 ${
            i === items.length - 1 && items.length % 2 ? 'col-span-2 sm:col-span-1' : ''
          }`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft/70 sm:h-12 sm:w-12">
            <img src={t.icon} alt={t.title} className="h-7 w-7 object-contain transition group-hover:scale-110 sm:h-9 sm:w-9" loading="lazy" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11.5px] font-extrabold leading-tight text-graphite-800 sm:text-[12px] sm:text-graphite-900">{t.title}</span>
            <span className="mt-0.5 block text-[10px] text-muted sm:text-[10.5px]">{t.desc}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
