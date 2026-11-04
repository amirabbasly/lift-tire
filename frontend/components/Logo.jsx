import Link from 'next/link';

/**
 * لوگوی تایپوگرافیک لیفت تایر — نشان چرخ/آج به صورت SVG برداری
 * variant: dark (متن روشن برای پس‌زمینه تیره) | light (متن تیره برای پس‌زمینه روشن)
 */
export default function Logo({ variant = 'light', size = 'md', href = '/', tagline = true }) {
  const dark = variant === 'dark';
  const dims = size === 'sm' ? { mark: 34, en: 'text-[19px]', fa: 'text-[13px]', tag: 'text-[8px]' } : size === 'lg'
    ? { mark: 56, en: 'text-[32px]', fa: 'text-[20px]', tag: 'text-[10px]' }
    : { mark: 44, en: 'text-[25px]', fa: 'text-[15px]', tag: 'text-[9px]' };

  const content = (
    <span className="flex items-center gap-2.5 select-none" dir="ltr">
      <svg width={dims.mark} height={dims.mark} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
        <circle cx="32" cy="32" r="30" fill={dark ? '#1A1E22' : '#111417'} />
        <circle cx="32" cy="32" r="30" fill="none" stroke="#FF6A13" strokeWidth="1.5" strokeDasharray="2 4" opacity=".9" />
        <circle cx="32" cy="32" r="23.5" fill="none" stroke={dark ? '#3A4148' : '#3A4148'} strokeWidth="6" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 16;
          return (
            <line
              key={i}
              x1={32 + Math.cos(a) * 20.5}
              y1={32 + Math.sin(a) * 20.5}
              x2={32 + Math.cos(a) * 26.5}
              y2={32 + Math.sin(a) * 26.5}
              stroke={i % 4 === 0 ? '#FF6A13' : '#2A3036'}
              strokeWidth={i % 4 === 0 ? 3 : 2}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="32" cy="32" r="15" fill={dark ? '#242A2F' : '#F5F6F7'} />
        <path d="M32 20.5 40.5 35H35v9.5h-6V35h-5.5z" fill="#FF6A13" />
        <circle cx="32" cy="32" r="15" fill="none" stroke="#FF6A13" strokeWidth="1.2" opacity=".55" />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`num font-bold uppercase ${dims.en} ${dark ? 'text-white' : 'text-graphite-900'}`}
          style={{ letterSpacing: '.13em', lineHeight: 1.05 }}
        >
          LIFT<span className="text-accent">·</span>TIRE
        </span>
        <span className={`mt-1 font-extrabold ${dims.fa} ${dark ? 'text-white/85' : 'text-graphite-800'}`}>لیفت تایر</span>
        {tagline && (
          <span className={`num mt-0.5 uppercase ${dims.tag} ${dark ? 'text-white/40' : 'text-muted'}`} style={{ letterSpacing: '.28em' }}>
            GRIP THE ROAD
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="لیفت تایر — صفحه اصلی" className="inline-flex">
      {content}
    </Link>
  );
}
