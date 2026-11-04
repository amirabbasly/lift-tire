'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from './PageHeader';
import { useAuth, useCart, useToast } from './Providers';
import { api } from '@/lib/api';
import { assetUrl, faNum, formatNumber, toman } from '@/lib/format';
import { SHIPPING_FALLBACK } from '@/lib/constants';
import { IconCheck, IconTruck, IconShield, IconArrowLeft } from './Icons';

const PROVINCES = ['تهران', 'البرز', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'آذربایجان غربی', 'خوزستان', 'گیلان', 'مازندران', 'کرمان', 'یزد', 'قم', 'کرمانشاه', 'هرمزگان', 'سیستان و بلوچستان', 'همدان', 'مرکزی', 'گلستان', 'اردبیل', 'زنجان', 'قزوین', 'لرستان', 'بوشهر', 'کردستان', 'چهارمحال و بختیاری', 'سمنان', 'ایلام', 'خراسان شمالی', 'خراسان جنوبی', 'کهگیلویه و بویراحمد'];

export default function CheckoutClient() {
  const { items, subtotal, clear, ready } = useCart();
  const { token, customer } = useAuth();
  const { show } = useToast();
  const router = useRouter();

  const [shipping, setShipping] = useState('post');
  const [payment, setPayment] = useState('gateway');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState('new');
  const [shippingList, setShippingList] = useState(SHIPPING_FALLBACK);
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ customer_name: '', phone: '', email: '', province: 'تهران', city: 'تهران', address: '', postal_code: '', receiver: '', note: '' });

  useEffect(() => {
    if (customer) setForm((f) => ({ ...f, customer_name: customer.name || '', phone: customer.phone || '', email: customer.email || '' }));
  }, [customer]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lift-coupon') || 'null');
      if (saved?.code) setCoupon(saved);
    } catch {}
    api('/shipping-options').then(setShippingList).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
    api('/customer/addresses', { token })
      .then((list) => {
        setAddresses(list || []);
        if (list?.length) setSelectedAddr(String(list[0].id));
      })
      .catch(() => {});
  }, [token]);

  const ship = shippingList.find((s) => s.id === shipping) || SHIPPING_FALLBACK[1];
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount) + ship.cost;

  const addressPayload = useMemo(() => {
    if (selectedAddr !== 'new') {
      const a = addresses.find((x) => String(x.id) === String(selectedAddr));
      if (a) return { province: a.province, city: a.city, address: a.address, postal_code: a.postal_code, receiver: a.receiver, phone: a.phone };
    }
    return {
      province: form.province, city: form.city, address: form.address, postal_code: form.postal_code,
      receiver: form.receiver || form.customer_name, phone: form.phone,
    };
  }, [selectedAddr, addresses, form]);

  const submit = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    try {
      const res = await api('/orders', {
        method: 'POST',
        token: token || undefined,
        body: {
          ...form,
          items: items.map((i) => ({ product_id: i.id, qty: i.qty })),
          shipping_method: shipping,
          payment_method: payment,
          coupon_code: coupon?.code || null,
          address: addressPayload,
        },
      });
      clear();
      localStorage.removeItem('lift-coupon');
      if (res.payment?.redirect_url) {
        router.push(res.payment.redirect_url);
      } else {
        router.push(`/order/${res.order.code}?new=1`);
      }
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return <div className="container-x py-16 text-center text-sm text-muted">در حال بارگذاری…</div>;

  if (!items.length) {
    return (
      <>
        <PageHeader title="تکمیل خرید" breadcrumbs={[{ label: 'سبد خرید', href: '/cart' }, { label: 'تکمیل خرید' }]} />
        <div className="container-x py-16 text-center">
          <p className="text-sm font-extrabold text-graphite-900">سبد خرید شما خالی است</p>
          <p className="mt-1 text-[12px] text-muted">برای ثبت سفارش ابتدا محصولی به سبد اضافه کنید.</p>
          <Link href="/products" className="btn-accent mt-4">مشاهده محصولات</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="تکمیل خرید" breadcrumbs={[{ label: 'سبد خرید', href: '/cart' }, { label: 'تکمیل خرید' }]} subtitle="اطلاعات ارسال و روش پرداخت را انتخاب کنید." />
      <form onSubmit={submit} className="container-x grid gap-5 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* اطلاعات گیرنده */}
          <section className="rounded-2xl border border-black/[.06] bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-graphite-900">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[11px] text-white">۱</span> اطلاعات گیرنده
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">نام و نام خانوادگی *</label>
                <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="field" placeholder="مثلاً مهدی رضایی" />
              </div>
              <div>
                <label className="label">شماره موبایل *</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" placeholder="۰۹۱۲۱۲۳۴۵۶۷" inputMode="tel" dir="ltr" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">ایمیل (اختیاری)</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" dir="ltr" />
              </div>
            </div>
          </section>

          {/* آدرس */}
          <section className="rounded-2xl border border-black/[.06] bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-graphite-900">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[11px] text-white">۲</span> آدرس تحویل
            </h3>
            {addresses.length > 0 && (
              <div className="mb-3 space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-[12px] transition ${String(selectedAddr) === String(a.id) ? 'border-accent bg-accent-soft/40' : 'border-black/10'}`}>
                    <input type="radio" name="addr" checked={String(selectedAddr) === String(a.id)} onChange={() => setSelectedAddr(String(a.id))} className="mt-0.5 accent-[#FF6A13]" />
                    <span>
                      <span className="font-extrabold text-graphite-900">{a.title}</span> — {a.province}، {a.city}، {a.address}
                      <span className="num block text-[10.5px] text-muted">گیرنده: {a.receiver} · {faNum(a.phone)}</span>
                    </span>
                  </label>
                ))}
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-[12px] font-bold ${selectedAddr === 'new' ? 'border-accent bg-accent-soft/40' : 'border-black/10'}`}>
                  <input type="radio" name="addr" checked={selectedAddr === 'new'} onChange={() => setSelectedAddr('new')} className="accent-[#FF6A13]" />
                  ثبت آدرس جدید
                </label>
              </div>
            )}

            {selectedAddr === 'new' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">استان *</label>
                  <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="field">
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">شهر *</label>
                  <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">نشانی کامل *</label>
                  <textarea required rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="field" placeholder="خیابان، کوچه، پلاک، واحد" />
                </div>
                <div>
                  <label className="label">کد پستی</label>
                  <input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="field" inputMode="numeric" dir="ltr" />
                </div>
                <div>
                  <label className="label">نام گیرنده</label>
                  <input value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} className="field" placeholder="در صورت متفاوت بودن با خریدار" />
                </div>
              </div>
            )}
          </section>

          {/* ارسال */}
          <section className="rounded-2xl border border-black/[.06] bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-graphite-900">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[11px] text-white">۳</span> روش ارسال
            </h3>
            <div className="space-y-2">
              {shippingList.map((s) => (
                <label key={s.id} className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 text-[12px] transition ${shipping === s.id ? 'border-accent bg-accent-soft/40' : 'border-black/10'}`}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="ship" checked={shipping === s.id} onChange={() => setShipping(s.id)} className="accent-[#FF6A13]" />
                    <span>
                      <span className="block font-extrabold text-graphite-900">{s.title}</span>
                      <span className="block text-[10.5px] text-muted">{s.days}</span>
                    </span>
                  </span>
                  <span className="num text-[12px] font-bold text-graphite-900">{s.cost ? toman(s.cost) : 'رایگان'}</span>
                </label>
              ))}
            </div>
          </section>

          {/* پرداخت */}
          <section className="rounded-2xl border border-black/[.06] bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[13px] font-extrabold text-graphite-900">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-[11px] text-white">۴</span> روش پرداخت
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['gateway', 'پرداخت اینترنتی', 'درگاه امن بانکی'],
                ['cod', 'پرداخت در محل', 'برای تهران و کرج — هنگام تحویل'],
              ].map(([id, title, desc]) => (
                <label key={id} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-[12px] transition ${payment === id ? 'border-accent bg-accent-soft/40' : 'border-black/10'}`}>
                  <input type="radio" name="pay" checked={payment === id} onChange={() => setPayment(id)} className="mt-0.5 accent-[#FF6A13]" />
                  <span>
                    <span className="block font-extrabold text-graphite-900">{title}</span>
                    <span className="block text-[10.5px] text-muted">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="label">توضیحات سفارش (اختیاری)</label>
              <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="field" placeholder="مثلاً ساعت تحویل مناسب…" />
            </div>
          </section>
        </div>

        {/* خلاصه */}
        <aside className="h-fit space-y-3 lg:sticky lg:top-[150px]">
          <div className="rounded-2xl border border-black/[.06] bg-white p-4">
            <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">سفارش شما</h3>
            <div className="max-h-[260px] space-y-2 overflow-y-auto pl-1">
              {items.map((i) => (
                <div key={i.id} className="flex items-center gap-2">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface p-1">
                    <img src={assetUrl(i.image)} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-graphite-900">{i.name}</p>
                    <p className="num text-[10px] text-muted" dir="ltr">{i.size} × {faNum(i.qty)}</p>
                  </div>
                  <span className="num text-[11px] font-bold">{formatNumber(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2 border-t border-black/[.07] pt-3 text-[12px]">
              <div className="flex justify-between text-steel-500"><span>مبلغ کالاها</span><span className="num font-bold text-graphite-900">{formatNumber(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success"><span>تخفیف {coupon.code}</span><span className="num font-bold">−{formatNumber(discount)}</span></div>}
              <div className="flex justify-between text-steel-500"><span>هزینه ارسال</span><span className="num font-bold text-graphite-900">{formatNumber(ship.cost)}</span></div>
              <div className="flex items-center justify-between border-t border-black/[.07] pt-2.5">
                <span className="text-[13px] font-extrabold">مبلغ قابل پرداخت</span>
                <span className="num text-[16px] font-extrabold text-accent-dark">{toman(total)}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-accent mt-4 w-full !py-3.5">
              {loading ? 'در حال ثبت سفارش…' : payment === 'cod' ? 'ثبت سفارش (پرداخت در محل)' : 'پرداخت و ثبت سفارش'}
              {!loading && <IconArrowLeft width={16} height={16} />}
            </button>
            <div className="mt-3 space-y-1.5 text-[10.5px] text-muted">
              <p className="flex items-center gap-1"><IconShield width={12} height={12} className="text-success" /> پرداخت امن با درگاه بانکی</p>
              <p className="flex items-center gap-1"><IconTruck width={12} height={12} className="text-success" /> ارسال به سراسر ایران با باربری و پست پیشتاز</p>
              <p className="flex items-center gap-1"><IconCheck width={12} height={12} className="text-success" /> ۷ روز ضمانت بازگشت</p>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
