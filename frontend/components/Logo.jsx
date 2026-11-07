import Link from 'next/link';

/**
 * نشان لیفت تایر — «چرخ در حال برخاستن»
 * حلقه آج‌دار (لاستیک) + پیکان صعودی که از مرکز چرخ بیرون می‌زند (لیفت).
 * variant: dark  → متن روشن (پس‌زمینه تیره)
 *          light → متن تیره  (پس‌زمینه روشن)
 */
export function LogoMark({ size = 44, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <title>لیفت تایر</title>
      <defs>
        <linearGradient id="lt-tile" x1="8" y1="2" x2="56" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2C343C" />
          <stop offset="0.55" stopColor="#171D23" />
          <stop offset="1" stopColor="#0B0E12" />
        </linearGradient>
        <linearGradient id="lt-arrow" x1="32" y1="12" x2="32" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFA65C" />
          <stop offset="0.55" stopColor="#FF6A13" />
          <stop offset="1" stopColor="#E6530A" />
        </linearGradient>
        <linearGradient id="lt-ring" x1="14" y1="16" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor="#D5DFE8" />
          <stop offset="1" stopColor="#8A99A6" />
        </linearGradient>
        {/* شکاف اطراف پیکان تا آج زیر آن قطع شود */}
        <mask id="lt-cut">
          <rect width="64" height="64" fill="white" />
          <path
            d="M32 44V18M23 27 32 16.5 41 27"
            fill="none"
            stroke="black"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </mask>
      </defs>

      {/* کاشی پس‌زمینه */}
      <rect x="1" y="1" width="62" height="62" rx="18" fill="url(#lt-tile)" />
      <rect x="2" y="2" width="60" height="60" rx="17" fill="none" stroke="#FFFFFF" strokeOpacity="0.13" strokeWidth="1.2" />

      <g mask="url(#lt-cut)">
        {/* بدنه لاستیک */}
        <circle cx="32" cy="33" r="17.6" fill="none" stroke="url(#lt-ring)" strokeWidth="7" />
        <circle cx="32" cy="33" r="21.1" fill="none" stroke="#0B0E12" strokeWidth="1.6" strokeOpacity="0.9" />
        {/* شیارهای آج */}
        <circle cx="32" cy="33" r="19.2" fill="none" stroke="#0B0E12" strokeWidth="3.6" strokeDasharray="1.6 4.9" />
        <circle cx="32" cy="33" r="15.2" fill="none" stroke="#0B0E12" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="1.2 5.6" />
      </g>

      {/* پیکان صعود */}
      <path
        d="M32 44.5V19M23 28l9-10.5L41 28"
        fill="none"
        stroke="url(#lt-arrow)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Logo({ variant = 'light', size = 'md', href = '/', tagline = true }) {
  const dark = variant === 'dark';
  const dims =
    size === 'sm'
      ? { mark: 34, en: 'text-[20px]', fa: 'text-[12.5px]', tag: 'text-[7.5px]' }
      : size === 'lg'
        ? { mark: 56, en: 'text-[32px]', fa: 'text-[19px]', tag: 'text-[9.5px]' }
        : { mark: 44, en: 'text-[26px]', fa: 'text-[15px]', tag: 'text-[8.5px]' };

  const content = (
    <span className="flex select-none items-center gap-2.5" dir="ltr">
      <LogoMark size={dims.mark} />
      <span className="flex flex-col justify-center leading-none">
        <span className={`num flex items-baseline font-bold uppercase ${dims.en}`} style={{ letterSpacing: '0.06em', lineHeight: 1 }}>
          <span className={dark ? 'text-white' : 'text-graphite-900'}>LIFT</span>
          <span className="mx-[3px] font-light text-accent opacity-90">/</span>
          <span className={`font-medium ${dark ? 'text-white/55' : 'text-graphite-700/60'}`}>TIRE</span>
        </span>
        <span className={`mt-[5px] font-extrabold tracking-tight ${dims.fa} ${dark ? 'text-white/90' : 'text-graphite-900'}`} dir="rtl">
          لیفت تایر
        </span>
        {tagline && (
          <span
            className={`num mt-[5px] font-semibold uppercase ${dims.tag} ${dark ? 'text-white/35' : 'text-muted/80'}`}
            style={{ letterSpacing: '0.3em' }}
          >
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
