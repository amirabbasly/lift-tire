import Link from 'next/link';

export const metadata = { title: 'صفحه یافت نشد' };

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-graphite-900 px-4 text-center text-white">
      <div>
        <p className="num text-[86px] font-bold leading-none text-accent/90">404</p>
        <h1 className="mt-3 text-xl font-extrabold">این مسیر در جاده وجود ندارد!</h1>
        <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-6 text-white/50">
          صفحه‌ای که به دنبال آن هستید حذف شده یا آدرس آن تغییر کرده است. می‌توانید از فروشگاه ادامه دهید.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn-accent !py-2.5 text-[12px]">صفحه اصلی</Link>
          <Link href="/products" className="rounded-xl border border-white/20 px-5 py-2.5 text-[12px] font-bold text-white/80 hover:border-accent hover:text-accent">فروشگاه لاستیک</Link>
          <Link href="/contact" className="rounded-xl border border-white/20 px-5 py-2.5 text-[12px] font-bold text-white/80 hover:border-accent hover:text-accent">تماس با ما</Link>
        </div>
        <p className="num mt-10 text-[10px] tracking-[.3em] text-white/20">LIFT TIRE — GRIP THE ROAD</p>
      </div>
    </div>
  );
}
