import ProductRail from './ProductRail';
import Countdown from './Countdown';
import SectionTitle from './SectionTitle';
import { IconArrowLeft } from './Icons';
import Link from 'next/link';

export default function DealsSection({ products = [] }) {
  if (!products.length) return null;
  return (
    <section className="section pt-0">
      <div className="container-x">
        <div className="overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-l from-accent-soft/70 via-white to-white p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-white shadow-glow">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                  <circle cx="12" cy="12" r="3.6" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-graphite-900 md:text-xl">پیشنهاد لحظه‌ای لیفت تایر</h2>
                <p className="text-[11.5px] text-muted">تخفیف‌های ویژه امروز — تا پایان روز</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Countdown />
              <Link href="/products?on_sale=1" className="hidden items-center gap-1 text-[12px] font-bold text-accent-dark hover:gap-2 sm:flex">
                همه پیشنهادها <IconArrowLeft width={15} height={15} />
              </Link>
            </div>
          </div>
          <ProductRail
            products={products}
            leading={
              <div className="flex w-[calc(50%-6px)] shrink-0 snap-start sm:w-[220px] lg:w-[calc(20%-10px)]">
                <Link href="/products?on_sale=1" className="relative flex w-full flex-col justify-between overflow-hidden rounded-2xl bg-graphite-900 p-4 text-white">
                  <div className="tire-pattern absolute inset-0 opacity-40" />
                  <div className="relative">
                    <span className="text-[10px] font-bold text-accent">پیشنهاد شگفت‌انگیز</span>
                    <p className="mt-2 text-[15px] font-extrabold leading-6">تخفیف تا ۲۰٪ روی لاستیک‌های منتخب</p>
                  </div>
                  <img src="/images/products/tire-sport.png" alt="" className="relative mx-auto my-2 h-24 w-24 object-contain drop-shadow" loading="lazy" />
                  <span className="relative inline-flex items-center justify-center gap-1 rounded-xl bg-accent py-2 text-[11px] font-bold">
                    مشاهده همه <IconArrowLeft width={14} height={14} />
                  </span>
                </Link>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}
