import PageHeader from '@/components/PageHeader';
import ContactForm from '@/components/ContactForm';
import { serverGet } from '@/lib/api';
import { demoHome } from '@/lib/demo';
import { faNum } from '@/lib/format';
import { IconPhone, IconTruck, IconShield } from '@/components/Icons';

export const metadata = { title: 'تماس با ما', description: 'راه‌های ارتباط با فروشگاه لیفت تایر؛ تلفن، آدرس و فرم پیام.', alternates: { canonical: '/contact' } };

export default async function ContactPage() {
  const settings = (await serverGet('/settings', null)) || demoHome.settings;
  return (
    <>
      <PageHeader title="تماس با ما" subtitle="کارشناسان لیفت تایر شنبه تا پنجشنبه از ۹ تا ۱۹ پاسخگوی شما هستند." breadcrumbs={[{ label: 'تماس با ما' }]} />
      <div className="container-x grid gap-5 py-8 lg:grid-cols-[1fr_360px]">
        <ContactForm />
        <aside className="space-y-3">
          <div className="rounded-2xl border border-black/[.06] bg-white p-4 text-[12px]">
            <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">راه‌های ارتباطی</h3>
            <ul className="space-y-3 text-steel-500">
              <li className="flex items-start gap-2">
                <IconPhone width={16} height={16} className="mt-0.5 text-accent" />
                <span>
                  تلفن فروش: <a href={`tel:${String(settings.phone || '').replace(/[^\d+]/g, '')}`} className="num font-bold text-graphite-900">{faNum(settings.phone)}</a>
                  <br />
                  موبایل / واتساپ: <span className="num font-bold text-graphite-900">{faNum(settings.mobile)}</span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <IconTruck width={16} height={16} className="mt-0.5 text-accent" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <IconShield width={16} height={16} className="mt-0.5 text-accent" />
                <span>پشتیبانی پس از فروش و پیگیری مرسولات: <span className="num font-bold text-graphite-900">{faNum(settings.phone)}</span></span>
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-black/[.06] bg-graphite-900 p-4 text-white">
            <p className="text-[12px] font-extrabold">ساعت کاری</p>
            <p className="mt-1 text-[11.5px] text-white/55">{settings.work_hours}</p>
            <div className="mt-3 flex gap-2">
              {settings.social?.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-xl">
                  <img src={s.icon} alt={s.title} width={36} height={36} className="h-9 w-9 rounded-xl" loading="lazy" />
                </a>
              ))}
            </div>
          </div>

          <div className="relative h-40 overflow-hidden rounded-2xl border border-black/[.06] bg-surface">
            <div className="absolute inset-0 opacity-[.35]" style={{ backgroundImage: 'linear-gradient(#cbd1d6 1px, transparent 1px), linear-gradient(90deg, #cbd1d6 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-xl bg-white px-3 py-2 text-center shadow-card">
                <p className="text-[11px] font-extrabold text-graphite-900">فروشگاه لیفت تایر</p>
                <p className="mt-0.5 text-[10px] text-muted">تهران، بزرگراه شهید همت</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
