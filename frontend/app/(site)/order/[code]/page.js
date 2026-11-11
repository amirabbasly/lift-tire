import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { serverGet } from '@/lib/api';
import { ORDER_STATUS, ORDER_TIMELINE } from '@/lib/constants';
import { faNum, formatDate, formatNumber, toman } from '@/lib/format';
import { IconCheck, IconTruck, IconShield, IconPhone } from '@/components/Icons';

export const revalidate = 0;
export const metadata = { title: 'جزئیات سفارش', robots: { index: false, follow: true } };

export default async function OrderPage({ params, searchParams }) {
  const { code } = await params;
  const sp = await searchParams;
  const order = await serverGet(`/orders/${code}`, null);
  if (!order) notFound();

  const st = ORDER_STATUS[order.status] || ORDER_STATUS.pending_payment;
  const activeStep = st.step;
  const address = order.address_snapshot || {};

  return (
    <>
      <PageHeader
        title={`سفارش ${order.code}`}
        subtitle={`تاریخ ثبت: ${formatDate(order.created_at, true)}`}
        breadcrumbs={[{ label: 'سفارش‌ها', href: '/account' }, { label: order.code }]}
      >
        <span className="rounded-xl px-3 py-1.5 text-[12px] font-bold text-white" style={{ background: st.color }}>{st.label}</span>
      </PageHeader>

      <div className="container-x py-6">
        {sp?.paid === '1' && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-success/20 bg-success/10 p-4 text-[12.5px] font-bold text-success">
            <IconCheck width={18} height={18} /> پرداخت شما با موفقیت ثبت شد. سفارش در حال آماده‌سازی است.
          </div>
        )}
        {sp?.new === '1' && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-accent/20 bg-accent-soft p-4 text-[12.5px] font-bold text-accent-dark">
            <IconCheck width={18} height={18} /> سفارش شما ثبت شد. همکاران ما برای هماهنگی ارسال تماس می‌گیرند.
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {/* تایم‌لاین */}
            <div className="rounded-2xl border border-black/[.06] bg-white p-5">
              <h3 className="mb-5 text-[13px] font-extrabold text-graphite-900">وضعیت سفارش</h3>
              {st.step === -1 ? (
                <p className="rounded-xl bg-danger/10 p-3 text-[12px] font-bold text-danger">این سفارش لغو شده است.</p>
              ) : (
                <ol className="relative flex justify-between">
                  <span className="absolute right-0 left-0 top-4 -z-0 h-0.5 bg-black/[.08]" />
                  <span className="absolute right-0 top-4 -z-0 h-0.5 bg-success transition-all" style={{ width: `${(activeStep / (ORDER_TIMELINE.length - 1)) * 100}%` }} />
                  {ORDER_TIMELINE.map((label, i) => (
                    <li key={label} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                      <span className={`grid h-8 w-8 place-items-center rounded-full border-2 text-[11px] font-bold ${i <= activeStep ? 'border-success bg-success text-white' : 'border-black/10 bg-white text-muted'}`}>
                        {i <= activeStep ? <IconCheck width={14} height={14} /> : faNum(i + 1)}
                      </span>
                      <span className={`text-center text-[10.5px] ${i <= activeStep ? 'font-bold text-graphite-900' : 'text-muted'}`}>{label}</span>
                    </li>
                  ))}
                </ol>
              )}
              {order.tracking_code && (
                <p className="mt-4 rounded-xl bg-surface p-3 text-[12px] text-steel-500">
                  کد رهگیری مرسوله: <span className="num font-bold text-graphite-900">{order.tracking_code}</span>
                </p>
              )}
            </div>

            {/* اقلام */}
            <div className="rounded-2xl border border-black/[.06] bg-white p-5">
              <h3 className="mb-4 text-[13px] font-extrabold text-graphite-900">اقلام سفارش</h3>
              <div className="space-y-3">
                {(order.items || []).map((it) => (
                  <div key={it.id} className="flex items-center gap-3 border-b border-black/[.05] pb-3 last:border-0 last:pb-0">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-surface p-1">
                      <img src={it.image || '/images/products/tire-passenger-a.png'} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold text-graphite-900">{it.name}</p>
                      <p className="num text-[10.5px] text-muted" dir="ltr">{it.size} × {faNum(it.qty)}</p>
                    </div>
                    <span className="num text-[12px] font-bold">{formatNumber(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-black/[.07] pt-3 text-[12px]">
                <div className="flex justify-between text-steel-500"><span>مبلغ کالاها</span><span className="num font-bold">{formatNumber(order.subtotal)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-success"><span>تخفیف {order.coupon_code}</span><span className="num font-bold">−{formatNumber(order.discount)}</span></div>}
                <div className="flex justify-between text-steel-500"><span>هزینه ارسال</span><span className="num font-bold">{formatNumber(order.shipping_cost)}</span></div>
                <div className="flex justify-between border-t border-black/[.07] pt-2 text-[13px] font-extrabold">
                  <span>مبلغ کل</span><span className="num text-accent-dark">{toman(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-black/[.06] bg-white p-4 text-[12px]">
              <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">اطلاعات ارسال</h3>
              <p className="font-bold text-graphite-800">{order.customer_name}</p>
              <p className="num mt-1 text-muted" dir="ltr">{faNum(order.phone)}</p>
              <p className="mt-2 leading-6 text-steel-500">
                {address.province}، {address.city}<br />
                {address.address}
                {address.postal_code && <><br />کد پستی: <span className="num">{faNum(address.postal_code)}</span></>}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                <IconTruck width={14} height={14} className="text-accent" />
                {order.shipping_method === 'post' ? 'پست پیشتاز' : order.shipping_method === 'freight' ? 'باربری' : 'پیک تهران'} — {order.payment_method === 'cod' ? 'پرداخت در محل' : 'پرداخت اینترنتی'}
              </p>
            </div>

            <div className="rounded-2xl border border-black/[.06] bg-white p-4">
              <h3 className="mb-2 text-[13px] font-extrabold text-graphite-900">پیگیری سفارش</h3>
              <p className="text-[11.5px] leading-6 text-muted">برای مشاهده وضعیت، کد سفارش و شماره موبایل خود را در صفحه پیگیری وارد کنید.</p>
              <Link href="/track" className="btn-ghost mt-3 w-full !py-2.5 text-[12px]">صفحه پیگیری</Link>
            </div>

            <div className="rounded-2xl bg-graphite-900 p-4 text-white">
              <p className="flex items-center gap-2 text-[12px] font-bold"><IconPhone width={15} height={15} className="text-accent" /> پشتیبانی سفارش</p>
              <p className="num mt-1 text-[13px] font-bold">۰۲۱-۹۱۰۰۱۲۳۴</p>
              <p className="mt-1 flex items-center gap-1 text-[10.5px] text-white/45"><IconShield width={12} height={12} /> ضمانت اصالت و ۷ روز بازگشت</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
