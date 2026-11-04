'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { adminApi, getAdminToken, setAdminToken } from '@/lib/adminApi';
import { IconMenu, IconX } from '@/components/Icons';

function NavIcon({ name }) {
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" /></>,
    products: <><path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" /><path d="M4 8l8 4.5L20 8M12 12.5V20.5" /></>,
    categories: <><path d="M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v4H4zM14 16h6v4h-6z" /></>,
    brands: <><circle cx="12" cy="12" r="8" /><path d="M8.5 14.5 12 8l3.5 6.5z" /></>,
    banners: <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M3 13l4.5-3 5 4 3-2L21 15" /></>,
    orders: <><path d="M6 3.5h9l3 3V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z" /><path d="M9 9h6M9 13h6M9 17h4" /></>,
    posts: <><path d="M5 20.5 4 16l10.5-10.5a2 2 0 0 1 3 3L7 19z" /><path d="M13 6.5l4 4" /></>,
    coupons: <><path d="M4 9V6.5h16V9a2.5 2.5 0 0 0 0 5v2.5H4V14a2.5 2.5 0 0 0 0-5z" /><path d="M12 8v8" strokeDasharray="2 3" /></>,
    reviews: <><path d="M12 4l2.3 4.7 5.2.7-3.8 3.6.9 5.2L12 15.7 7.4 18.2l.9-5.2L4.5 9.4l5.2-.7z" /></>,
    subscribers: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" /></>,
  };
  return <svg {...common} className="shrink-0 opacity-80">{paths[name]}</svg>;
}

const NAV = [
  { href: '/admin', label: 'داشبورد', icon: 'dashboard' },
  { href: '/admin/products', label: 'محصولات', icon: 'products' },
  { href: '/admin/categories', label: 'دسته‌بندی‌ها', icon: 'categories' },
  { href: '/admin/brands', label: 'برندها', icon: 'brands' },
  { href: '/admin/banners', label: 'بنرها و اسلایدر', icon: 'banners' },
  { href: '/admin/orders', label: 'سفارش‌ها', icon: 'orders' },
  { href: '/admin/posts', label: 'مقالات', icon: 'posts' },
  { href: '/admin/coupons', label: 'کدهای تخفیف', icon: 'coupons' },
  { href: '/admin/reviews', label: 'نظرات', icon: 'reviews' },
  { href: '/admin/subscribers', label: 'خبرنامه و پیام‌ها', icon: 'subscribers' },
  { href: '/admin/settings', label: 'تنظیمات سایت', icon: 'settings' },
];

export default function DashLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) { router.replace('/admin/login'); return; }
    adminApi('/me').then(setAdmin).catch(() => { setAdminToken(''); router.replace('/admin/login'); });
  }, [router]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const logout = () => {
    setAdminToken('');
    router.push('/admin/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-4">
        <Logo variant="dark" size="sm" href="/admin" tagline={false} />
        <p className="mt-2 text-[10px] text-white/35">پنل مدیریت فروشگاه</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2.5">
        {NAV.map((n) => {
          const active = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] font-bold transition ${
                active ? 'bg-accent text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <NavIcon name={n.icon} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-xl bg-white/5 px-3 py-2">
          <p className="truncate text-[11px] font-bold text-white/80">{admin?.name || 'مدیر'}</p>
          <p className="truncate text-[10px] text-white/35" dir="ltr">{admin?.email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="flex-1 rounded-lg border border-white/10 py-1.5 text-center text-[10.5px] text-white/60 hover:text-white">مشاهده سایت</Link>
          <button onClick={logout} className="flex-1 rounded-lg bg-danger/15 py-1.5 text-[10.5px] font-bold text-danger hover:bg-danger/25">خروج</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 bg-graphite-900 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-[90] flex lg:hidden">
          <div className="h-full w-[240px] bg-graphite-900">{sidebar}</div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/[.06] bg-white/95 px-4 backdrop-blur lg:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-surface lg:hidden" aria-label="منو"><IconMenu width={20} height={20} /></button>
          <p className="text-[12px] font-bold text-graphite-900">{NAV.find((n) => n.href === pathname)?.label || 'پنل مدیریت'}</p>
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-muted sm:block">لیفت تایر — نسخه ۱.۰</span>
            <Link href="/" className="rounded-lg bg-surface px-2.5 py-1.5 text-[10.5px] font-bold text-steel-500">سایت</Link>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
