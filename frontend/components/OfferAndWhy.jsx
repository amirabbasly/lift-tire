import Link from 'next/link';
import Reveal from './Reveal';
import { TRUST } from '@/lib/constants';
import { assetUrl, faNum } from '@/lib/format';
import { IconArrowLeft, IconCheck } from './Icons';

export default function OfferAndWhy({ settings }) {
  const services = settings?.services?.length ? settings.services : TRUST;
  return (
    <section className="section bg-graphite-900">
      <div className="container-x grid gap-6 lg:grid-cols-2">
        {/* پیشنهاد ویژه ماه */}
        <Reveal>
          <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-graphite-800">
            <img
              src="/images/banners/offer-month.jpg"
              alt="پیشنهاد ویژه ماه"
              className="absolute inset-0 h-full w-full object-cover opacity-45"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-graphite-900 via-graphite-900/85 to-graphite-900/40" />
            <div className="relative flex h-full flex-col justify-between gap-6 p-6 md:p-8">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10.5px] font-bold text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  پیشنهاد ویژه ماه
                </span>
                <h3 className="mt-4 text-2xl font-extrabold leading-snug text-white md:text-[28px]">
                  تا {faNum(20)}٪ تخفیف روی
                  <br />
                  لاستیک‌های اسپرت منتخب
                </h3>
                <p className="mt-2 max-w-sm text-[12.5px] leading-6 text-white/55">
                  مجموعه‌ای از لاستیک‌های تابستانی و پرفورمنس با چسبندگی بالا؛ همراه با نصب رایگان در تهران و ضمانت اصالت.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/products?on_sale=1" className="btn-accent">
                  مشاهده پیشنهادها <IconArrowLeft width={16} height={16} />
                </Link>
                <span className="text-[11px] text-white/40">تا پایان موجودی</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* چرا لیفت تایر */}
        <Reveal delay={0.1}>
          <div className="h-full rounded-2xl border border-white/10 bg-white/[.03] p-6 md:p-8">
            <div className="mb-5">
              <span className="text-[10.5px] font-bold tracking-widest text-accent">LIFT TIRE ADVANTAGE</span>
              <h3 className="mt-1 text-2xl font-extrabold text-white">چرا لیفت تایر؟</h3>
              <p className="mt-1 text-[12.5px] text-white/50">تجربه‌ای مطمئن از خرید لاستیک، از انتخاب تا نصب</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {services.slice(0, 4).map((s) => (
                <li key={s.title} className="flex items-start gap-3 rounded-xl border border-white/[.07] bg-white/[.02] p-3">
                  <img src={assetUrl(s.icon)} alt={s.title} className="h-9 w-9 shrink-0 object-contain" loading="lazy" />
                  <div>
                    <p className="text-[12px] font-extrabold text-white">{s.title}</p>
                    <p className="mt-0.5 text-[10.5px] leading-5 text-white/45">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
              {[
                ['۴۰۰۰+', 'مشتری راضی'],
                ['۹۸٪', 'رضایت خرید'],
                ['۲۴ ساعت', 'پاسخ‌گویی'],
              ].map(([v, l]) => (
                <div key={l} className="text-center">
                  <p className="num text-lg font-bold text-accent">{v}</p>
                  <p className="mt-0.5 text-[10.5px] text-white/45">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
              {['ضمانت اصالت کتبی', 'فاکتور رسمی', 'نصب تخصصی', 'مشاوره رایگان'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] text-white/55">
                  <IconCheck width={13} height={13} className="text-success" /> {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
