'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import MobileDrawer from './MobileDrawer';
import { useAuth, useCart } from './Providers';
import { IconSearch, IconCart, IconUser, IconMenu, IconPhone } from './Icons';
import { NAV } from '@/lib/constants';
import { assetUrl, faNum } from '@/lib/format';

export default function Header({ settings, brands = [], categories = [] }) {
  const [open, setOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();
  const { customer, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setMobileSearch(false); }, [pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/products?q=${encodeURIComponent(term)}` : '/products');
    setMobileSearch(false);
  };

  const featured = brands.filter((b) => b.is_featured).slice(0, 7);

  return (
    <header className={`sticky top-0 z-50 border-b border-black/[.06] bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-[0_6px_24px_-16px_rgba(17,20,23,.4)]' : ''}`}>
      {/* ردیف اصلی */}
      <div className="container-x flex h-[64px] items-center gap-3 md:h-[76px]">
        {/* موبایل: منو */}
        <button onClick={() => setOpen(true)} aria-label="منو" className="rounded-xl p-2 text-graphite-900 hover:bg-surface lg:hidden">
          <IconMenu width={23} height={23} />
        </button>

        {/* دسکتاپ: لوگو راست */}
        <div className="hidden lg:block"><Logo size="md" /></div>

        {/* موبایل: لوگو وسط */}
        <div className="flex flex-1 justify-center lg:hidden"><Logo size="sm" tagline={false} /></div>

        {/* جست‌وجوی دسکتاپ */}
        <form onSubmit={submitSearch} className="relative mx-2 hidden max-w-[520px] flex-1 items-center lg:flex">
          <IconSearch width={18} height={18} className="pointer-events-none absolute right-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی لاستیک، سایز یا برند…"
            aria-label="جست‌وجو"
            className="h-11 w-full rounded-xl border border-black/10 bg-surface pr-11 pl-28 text-sm outline-none transition focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
          />
          <button type="submit" className="absolute left-1.5 rounded-lg bg-graphite-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-accent">
            جست‌وجو
          </button>
        </form>

        {/* اکشن‌ها */}
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={() => setMobileSearch((v) => !v)} aria-label="جست‌وجو" className="rounded-xl p-2 text-graphite-900 hover:bg-surface lg:hidden">
            <IconSearch width={21} height={21} />
          </button>

          <Link href="/account" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-graphite-900 transition hover:bg-surface md:flex">
            <IconUser width={22} height={22} />
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] text-muted">{ready && customer ? 'خوش آمدید' : 'ورود / ثبت‌نام'}</span>
              <span className="text-[12px] font-bold">{ready && customer ? customer.name || 'حساب من' : 'حساب کاربری'}</span>
            </span>
          </Link>

          <a href={`tel:${settings?.phone?.replace(/[^\d+]/g, '') || '02191001234'}`} className="hidden items-center gap-2 rounded-xl px-3 py-2 text-graphite-900 transition hover:bg-surface xl:flex">
            <IconPhone width={20} height={20} className="text-accent" />
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] text-muted">پشتیبانی تلفنی</span>
              <span className="num text-[13px] font-bold" dir="ltr">{faNum(settings?.phone || '۰۲۱-۹۱۰۰۱۲۳۴')}</span>
            </span>
          </a>

          <button onClick={() => setCartOpen(true)} aria-label="سبد خرید" className="relative rounded-xl p-2.5 text-graphite-900 transition hover:bg-surface">
            <IconCart width={23} height={23} />
            {count > 0 && (
              <span className="num absolute -top-0.5 -left-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                {faNum(count)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* جست‌وجوی موبایل */}
      <AnimatePresence>
        {mobileSearch && (
          <motion.form
            onSubmit={submitSearch}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="container-x overflow-hidden pb-3 lg:hidden"
          >
            <div className="relative">
              <IconSearch width={18} height={18} className="pointer-events-none absolute right-3.5 top-3 text-muted" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="جست‌وجوی لاستیک، سایز یا برند…" className="field pr-10" />
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* منوی دسکتاپ */}
      <nav className="hidden border-t border-black/[.05] lg:block">
        <div className="container-x flex h-11 items-center justify-between gap-4">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-bold transition ${
                    pathname === n.href ? 'bg-accent-soft text-accent-dark' : 'text-graphite-800 hover:bg-surface hover:text-accent-dark'
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-muted">برندهای ویژه:</span>
            {featured.map((b) => (
              <Link key={b.id} href={`/products?brand=${b.slug}`} className="group flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-surface" title={b.name_fa}>
                <img src={assetUrl(b.logo)} alt={b.name_fa} className="h-5 w-auto opacity-75 transition group-hover:opacity-100" loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        settings={settings}
        categories={categories}
      />
    </header>
  );
}
