import Link from 'next/link';
import Logo from './Logo';
import NewsletterForm from './NewsletterForm';
import { IconPhone, IconChevron } from './Icons';
import { SOCIAL } from '@/lib/constants';
import { faNum } from '@/lib/format';

export default function Footer({ settings, categories = [] }) {
  const services = settings?.services?.length ? settings.services : [];
  const social = settings?.social?.length ? settings.social : SOCIAL;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 bg-graphite-900 text-white">
      {/* سرویس‌ها با تصویر */}
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 gap-4 py-7 sm:grid-cols-3 lg:grid-cols-5">
          {services.map((s) => (
            <div key={s.title} className="flex items-center gap-3">
              <img src={s.icon} alt={s.title} className="h-11 w-11 shrink-0 object-contain" loading="lazy" />
              <div className="min-w-0">
                <p className="text-[12px] font-extrabold leading-tight">{s.title}</p>
                <p className="mt-0.5 truncate text-[10.5px] text-white/45">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo variant="dark" size="md" />
          <p className="mt-4 max-w-sm text-[13px] leading-6 text-white/55">{settings?.footer_text}</p>
          <div className="mt-5 flex items-center gap-2.5">
            {social.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.title} className="transition hover:-translate-y-0.5 hover:opacity-90">
                <img src={s.icon} alt={s.title} width={38} height={38} className="h-[38px] w-[38px] rounded-xl" loading="lazy" />
              </a>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-3">
            <p className="mb-2 text-[12px] font-bold text-white/80">عضویت در خبرنامه لیفت تایر</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="mb-3 text-[13px] font-extrabold text-white">دسترسی سریع</h4>
          <ul className="space-y-2 text-[12.5px] text-white/55">
            {[
              ['/products', 'فروشگاه'],
              ['/products?on_sale=1', 'پیشنهادهای ویژه'],
              ['/track', 'پیگیری سفارش'],
              ['/blog', 'مجله لیفت تایر'],
              ['/about', 'درباره ما'],
              ['/contact', 'تماس با ما'],
              ['/faq', 'سوالات متداول'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex items-center gap-1 transition hover:text-accent">
                  <IconChevron width={12} height={12} className="text-accent/60" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="mb-3 text-[13px] font-extrabold text-white">دسته‌بندی محصولات</h4>
          <ul className="space-y-2 text-[12.5px] text-white/55">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="inline-flex items-center gap-1 transition hover:text-accent">
                  <IconChevron width={12} height={12} className="text-accent/60" /> {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/products" className="inline-flex items-center gap-1 transition hover:text-accent">
                <IconChevron width={12} height={12} className="text-accent/60" /> همه محصولات
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="mb-3 text-[13px] font-extrabold text-white">تماس با لیفت تایر</h4>
          <ul className="space-y-2.5 text-[12.5px] text-white/55">
            <li className="flex items-center gap-2">
              <IconPhone width={15} height={15} className="text-accent" />
              <a href={`tel:${String(settings?.phone || '').replace(/[^\d+]/g, '')}`} className="num hover:text-accent" dir="ltr">
                {faNum(settings?.phone || '۰۲۱-۹۱۰۰۱۲۳۴')}
              </a>
            </li>
            <li className="num" dir="ltr">{faNum(settings?.mobile || '۰۹۱۲-۱۲۳-۴۵۶۷')}</li>
            <li dir="ltr" className="text-white/45">{settings?.email || 'info@lifttire.ir'}</li>
            <li className="leading-6">{settings?.address}</li>
            <li className="text-white/40">{settings?.work_hours}</li>
          </ul>
          <div className="mt-4 flex items-center gap-2 opacity-70">
            <span className="rounded-lg border border-white/15 px-2 py-1 text-[10px]">پرداخت امن</span>
            <span className="rounded-lg border border-white/15 px-2 py-1 text-[10px]">ضمانت اصالت</span>
            <span className="rounded-lg border border-white/15 px-2 py-1 text-[10px]">۷ روز بازگشت</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-4 text-[11px] text-white/40 md:flex-row">
          <p>© {faNum(year)} لیفت تایر — تمامی حقوق محفوظ است.</p>
          <p className="num tracking-[.25em] text-white/25">LIFT TIRE — GRIP THE ROAD</p>
        </div>
      </div>
    </footer>
  );
}
