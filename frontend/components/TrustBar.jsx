import { TRUST } from '@/lib/constants';

export default function TrustBar({ items = TRUST, className = '' }) {
  return (
    <div className={`hidden gap-3 md:grid md:grid-cols-5 ${className}`}>
      {items.map((t) => (
        <div key={t.title} className="group flex items-center gap-3 rounded-2xl border border-black/[.06] bg-white p-3 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-soft/70">
            <img src={t.icon} alt={t.title} className="h-9 w-9 object-contain transition group-hover:scale-110" loading="lazy" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12px] font-extrabold leading-tight text-graphite-900">{t.title}</span>
            <span className="mt-0.5 block text-[10.5px] text-muted">{t.desc}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
