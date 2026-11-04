'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './Providers';
import { MOBILE_NAV } from '@/lib/constants';
import { faNum } from '@/lib/format';
import { IconPhone } from './Icons';

export default function MobileNav({ settings }) {
  const pathname = usePathname();
  const { count } = useCart();
  const phone = settings?.phone?.replace(/[^\d+]/g, '') || '02191001234';

  return (
    <>
      {/* تب عمودی پشتیبانی */}
      <a
        href={`tel:${phone}`}
        className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 items-center gap-1.5 rounded-l-none rounded-r-xl bg-graphite-900 px-2 py-3 text-white shadow-lift sm:flex lg:hidden"
        style={{ writingMode: 'vertical-rl' }}
        aria-label="پشتیبانی تلفنی"
      >
        <IconPhone width={15} height={15} className="text-accent" />
        <span className="text-[11px] font-bold">پشتیبانی</span>
      </a>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-black/[.08] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="منوی پایین">
        <ul className="grid grid-cols-4">
          {MOBILE_NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} className={`relative flex flex-col items-center gap-1 py-2 transition ${active ? 'text-accent-dark' : 'text-steel-500'}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl transition ${active ? 'bg-accent-soft' : ''}`}>
                    <img src={n.icon} alt="" className={`h-7 w-7 object-contain transition ${active ? '' : 'opacity-75 grayscale-[35%]'}`} />
                  </span>
                  <span className="text-[10px] font-bold">{n.label}</span>
                  {n.href === '/cart' && count > 0 && (
                    <span className="num absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                      {faNum(count)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
