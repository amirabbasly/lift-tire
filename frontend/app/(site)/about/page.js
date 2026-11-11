import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import Counter from '@/components/Counter';
import { TRUST } from '@/lib/constants';
import { IconCheck } from '@/components/Icons';

export const metadata = { title: 'درباره لیفت تایر', description: 'لیفت تایر؛ از سال ۱۳۸۴ همراه رانندگان ایرانی در انتخاب لاستیک اصل و ایمن.', alternates: { canonical: '/about' } };

export default function AboutPage() {
  return (
    <>
      <PageHeader title="درباره لیفت تایر" subtitle="از سال ۱۳۸۴ در کنار رانندگان ایرانی؛ با تمرکز بر لاستیک اصل و مشاوره تخصصی" breadcrumbs={[{ label: 'درباره ما' }]} />

      <div className="container-x py-8">
        <Reveal>
          <div className="grid gap-6 rounded-2xl bg-graphite-900 p-6 text-white md:grid-cols-2 md:p-10">
            <div>
              <span className="num text-[11px] tracking-[.3em] text-accent">LIFT TIRE — GRIP THE ROAD</span>
              <h2 className="mt-3 text-2xl font-extrabold leading-relaxed md:text-3xl">
                لاستیک اصل،
                <br />
                ایمنی واقعی
              </h2>
              <p className="mt-4 text-[13px] leading-7 text-white/60">
                لیفت تایر با بیش از دو دهه تجربه در بازار لاستیک ایران، تأمین‌کننده لاستیک خودروهای سواری، شاسی‌بلند و باری است.
                تمرکز ما بر سه اصل ساده است: اصالت کالا، مشاوره درست و ارسال مطمئن به سراسر کشور.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { value: 4000, suffix: '+', label: 'مشتری راضی' },
                  { value: 20, suffix: '', label: 'سال تجربه' },
                  { value: 12000, suffix: '+', label: 'لاستیک فروخته‌شده' },
                  { value: 10, suffix: '', label: 'برند معتبر' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                    <p className="text-xl font-bold text-accent"><Counter value={s.value} suffix={s.suffix} /></p>
                    <p className="mt-1 text-[11px] text-white/45">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl">
              <img src="/images/hero/hero-1.jpg" alt="لیفت تایر" className="h-full w-full object-cover" />
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['داستان ما', 'لیفت تایر کار خود را با یک فروشگاه تخصصی لاستیک در تهران آغاز کرد. با رشد فروش اینترنتی، تصمیم گرفتیم تجربه خرید لاستیک را ساده‌تر کنیم: انتخاب سایز در چند کلیک، قیمت شفاف و ارسال به همه شهرها.'],
            ['تعهد ما', 'هر لاستیکی که از لیفت تایر می‌خرید دارای گارانتی اصالت و تاریخ تولید مشخص است. اگر محصول با توضیحات مطابقت نداشت، تا ۷ روز امکان بازگشت بدون قید و شرط وجود دارد.'],
            ['تیم ما', 'تیم کارشناسان ما سال‌ها در بازار لاستیک کار کرده‌اند و می‌توانند بر اساس خودرو، اقلیم و سبک رانندگی شما بهترین گزینه را پیشنهاد دهند — حتی اگر ارزان‌ترین نباشد.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-black/[.06] bg-white p-5">
              <h3 className="text-[14px] font-extrabold text-graphite-900">{title}</h3>
              <p className="mt-2 text-[12.5px] leading-7 text-steel-500">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-extrabold text-graphite-900">خدمات لیفت تایر</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TRUST.map((t) => (
              <div key={t.title} className="rounded-2xl border border-black/[.06] bg-white p-4 text-center">
                <img src={t.icon} alt={t.title} className="mx-auto h-12 w-12 object-contain" loading="lazy" />
                <p className="mt-2 text-[12px] font-extrabold text-graphite-900">{t.title}</p>
                <p className="mt-1 text-[10.5px] text-muted">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-accent/20 bg-accent-soft p-6 text-center">
          <h2 className="text-lg font-extrabold text-graphite-900">آماده انتخاب لاستیک درست برای خودروی شما هستیم</h2>
          <p className="mt-1.5 text-[12.5px] text-steel-500">همین حالا سایز لاستیک خود را جست‌وجو کنید یا با کارشناسان ما تماس بگیرید.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="/products" className="btn-accent !py-2.5 text-[12px]">مشاهده فروشگاه</a>
            <a href="tel:02191001234" className="btn-ghost !py-2.5 text-[12px]">۰۲۱-۹۱۰۰۱۲۳۴</a>
          </div>
        </div>
      </div>
    </>
  );
}
