'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from './PageHeader';
import { useAuth, useToast } from './Providers';
import { api } from '@/lib/api';
import { ORDER_STATUS } from '@/lib/constants';
import { assetUrl, faNum, formatDate, formatNumber, toman } from '@/lib/format';
import { IconUser, IconCheck, IconTrash, IconCart, IconHeart } from './Icons';

const TABS = [
  { id: 'profile', label: 'پروفایل' },
  { id: 'orders', label: 'سفارش‌ها' },
  { id: 'addresses', label: 'آدرس‌ها' },
  { id: 'wishlist', label: 'علاقه‌مندی‌ها' },
  { id: 'password', label: 'تغییر رمز' },
];

export default function AccountClient() {
  const { token, customer, ready, login, register, logout, updateCustomer } = useAuth();
  const { show } = useToast();
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState('login');
  const [tab, setTab] = useState(sp.get('tab') || 'profile');
  const [busy, setBusy] = useState(false);
  const [auth, setAuth] = useState({ name: '', phone: '', password: '', email: '' });
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [pass, setPass] = useState({ current_password: '', new_password: '' });
  const [addr, setAddr] = useState({ title: 'خانه', province: 'تهران', city: 'تهران', address: '', postal_code: '', receiver: '', phone: '', is_default: false });
  const [showAddr, setShowAddr] = useState(false);

  useEffect(() => {
    if (customer) setProfile({ name: customer.name || '', email: customer.email || '' });
  }, [customer]);

  useEffect(() => {
    if (!token) return;
    api('/customer/orders', { token }).then(setOrders).catch(() => {});
    api('/customer/addresses', { token }).then(setAddresses).catch(() => {});
    api('/customer/wishlist', { token }).then(setWishlist).catch(() => {});
  }, [token]);

  const submitAuth = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(auth.phone, auth.password);
        show('خوش آمدید!');
      } else {
        await register({ name: auth.name, phone: auth.phone, password: auth.password, email: auth.email });
        show('حساب کاربری شما ساخته شد.');
      }
      const redirect = sp.get('redirect');
      if (redirect) router.push(redirect);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/customer/me', { method: 'PUT', token, body: profile });
      updateCustomer({ ...customer, ...res });
      show('اطلاعات شما ذخیره شد.');
    } catch (err) { show(err.message, 'error'); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/customer/password', { method: 'PUT', token, body: pass });
      show(res.message);
      setPass({ current_password: '', new_password: '' });
    } catch (err) { show(err.message, 'error'); }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api('/customer/addresses', { method: 'POST', token, body: addr });
      setAddresses((a) => [res, ...a]);
      setShowAddr(false);
      setAddr({ title: 'خانه', province: 'تهران', city: 'تهران', address: '', postal_code: '', receiver: '', phone: '', is_default: false });
      show('آدرس جدید ثبت شد.');
    } catch (err) { show(err.message, 'error'); }
  };

  const removeAddress = async (id) => {
    await api(`/customer/addresses/${id}`, { method: 'DELETE', token }).catch(() => {});
    setAddresses((a) => a.filter((x) => x.id !== id));
    show('آدرس حذف شد.', 'info');
  };

  const removeWish = async (pid) => {
    await api('/customer/wishlist', { method: 'POST', token, body: { product_id: pid } }).catch(() => {});
    setWishlist((w) => w.filter((x) => x.id !== pid));
  };

  if (!ready) return <div className="container-x py-16 text-center text-sm text-muted">در حال بارگذاری…</div>;

  if (!token) {
    return (
      <>
        <PageHeader title="حساب کاربری" subtitle="ورود یا ثبت‌نام برای پیگیری سفارش‌ها و ذخیره آدرس‌ها" breadcrumbs={[{ label: 'حساب کاربری' }]} />
        <div className="container-x py-8">
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
            <form onSubmit={submitAuth} className="rounded-2xl border border-black/[.06] bg-white p-5">
              <div className="mb-4 flex rounded-xl bg-surface p-1">
                {[['login', 'ورود'], ['register', 'ثبت‌نام']].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setMode(id)} className={`flex-1 rounded-lg py-2 text-[12px] font-bold transition ${mode === id ? 'bg-white text-graphite-900 shadow-sm' : 'text-muted'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className="label">نام و نام خانوادگی</label>
                    <input required value={auth.name} onChange={(e) => setAuth({ ...auth, name: e.target.value })} className="field" />
                  </div>
                )}
                <div>
                  <label className="label">شماره موبایل</label>
                  <input required value={auth.phone} onChange={(e) => setAuth({ ...auth, phone: e.target.value })} className="field" placeholder="۰۹۱۲۱۲۳۴۵۶۷" inputMode="tel" dir="ltr" />
                </div>
                {mode === 'register' && (
                  <div>
                    <label className="label">ایمیل (اختیاری)</label>
                    <input type="email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} className="field" dir="ltr" />
                  </div>
                )}
                <div>
                  <label className="label">رمز عبور</label>
                  <input required type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} className="field" dir="ltr" />
                </div>
                <button type="submit" disabled={busy} className="btn-accent w-full !py-3">
                  {busy ? 'لطفاً صبر کنید…' : mode === 'login' ? 'ورود به حساب' : 'ایجاد حساب'}
                </button>
              </div>

              {mode === 'login' && (
                <div className="mt-3 rounded-xl bg-surface p-3 text-[11px] text-steel-500">
                  حساب نمایشی: <span className="num font-bold" dir="ltr">09121234567</span> / رمز: <span className="num font-bold" dir="ltr">test1234</span>
                </div>
              )}
            </form>

            <div className="rounded-2xl bg-graphite-900 p-5 text-white">
              <IconUser width={32} height={32} className="text-accent" />
              <h3 className="mt-3 text-lg font-extrabold">مزایای حساب کاربری</h3>
              <ul className="mt-3 space-y-2.5 text-[12px] text-white/60">
                {['پیگیری آسان سفارش‌ها و مرسوله‌ها', 'ذخیره چند آدرس برای ارسال سریع‌تر', 'دسترسی به علاقه‌مندی‌ها در همه دستگاه‌ها', 'اطلاع از تخفیف‌ها و پیشنهادهای ویژه'].map((t) => (
                  <li key={t} className="flex items-start gap-2"><IconCheck width={15} height={15} className="mt-0.5 shrink-0 text-success" /> {t}</li>
                ))}
              </ul>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] text-white/50">
                سفارش خود را گم کرده‌اید؟ از صفحه <Link href="/track" className="text-accent underline">پیگیری سفارش</Link> با کد سفارش و شماره موبایل وضعیت را ببینید.
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`سلام ${customer?.name || 'کاربر عزیز'}`} subtitle={`شماره موبایل: ${faNum(customer?.phone || '')}`} breadcrumbs={[{ label: 'حساب کاربری' }]}>
        <button onClick={() => { logout(); show('از حساب خود خارج شدید.', 'info'); }} className="btn-ghost !py-2 text-[12px]">خروج از حساب</button>
      </PageHeader>

      <div className="container-x py-6">
        <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <aside className="h-fit rounded-2xl border border-black/[.06] bg-white p-2">
            <nav className="flex gap-1 overflow-x-auto lg:flex-col">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-xl px-3 py-2.5 text-right text-[12px] font-bold transition ${tab === t.id ? 'bg-accent-soft text-accent-dark' : 'text-steel-500 hover:bg-surface'}`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          <div>
            {tab === 'profile' && (
              <form onSubmit={saveProfile} className="rounded-2xl border border-black/[.06] bg-white p-5">
                <h3 className="mb-4 text-[14px] font-extrabold text-graphite-900">اطلاعات حساب</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">نام و نام خانوادگی</label><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="field" /></div>
                  <div><label className="label">شماره موبایل</label><input value={customer?.phone || ''} disabled className="field num bg-surface/60" dir="ltr" /></div>
                  <div className="sm:col-span-2"><label className="label">ایمیل</label><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="field" dir="ltr" /></div>
                </div>
                <button type="submit" className="btn-accent mt-4 !py-2.5 text-[12px]">ذخیره تغییرات</button>
              </form>
            )}

            {tab === 'orders' && (
              <div className="space-y-3">
                {orders.length === 0 && <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-[12px] text-muted">هنوز سفارشی ثبت نکرده‌اید.</div>}
                {orders.map((o) => {
                  const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending_payment;
                  return (
                    <div key={o.id} className="rounded-2xl border border-black/[.06] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="num text-[13px] font-extrabold text-graphite-900">{o.code}</p>
                          <p className="text-[10.5px] text-muted">{formatDate(o.created_at, true)}</p>
                        </div>
                        <span className="rounded-lg px-2.5 py-1 text-[10.5px] font-bold text-white" style={{ background: st.color }}>{st.label}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-black/[.06] pt-3">
                        <span className="num text-[12.5px] font-extrabold">{toman(o.total)}</span>
                        <Link href={`/order/${o.code}`} className="text-[11.5px] font-bold text-accent-dark hover:underline">مشاهده جزئیات</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'addresses' && (
              <div className="space-y-3">
                <button onClick={() => setShowAddr((v) => !v)} className="btn-accent !py-2.5 text-[12px]">افزودن آدرس جدید</button>
                {showAddr && (
                  <form onSubmit={addAddress} className="grid gap-3 rounded-2xl border border-black/[.06] bg-white p-4 sm:grid-cols-2">
                    <div><label className="label">عنوان</label><input value={addr.title} onChange={(e) => setAddr({ ...addr, title: e.target.value })} className="field" /></div>
                    <div><label className="label">استان</label><input value={addr.province} onChange={(e) => setAddr({ ...addr, province: e.target.value })} className="field" /></div>
                    <div><label className="label">شهر</label><input required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="field" /></div>
                    <div><label className="label">کد پستی</label><input value={addr.postal_code} onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })} className="field" dir="ltr" /></div>
                    <div className="sm:col-span-2"><label className="label">نشانی</label><textarea required rows={2} value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} className="field" /></div>
                    <div><label className="label">گیرنده</label><input required value={addr.receiver} onChange={(e) => setAddr({ ...addr, receiver: e.target.value })} className="field" /></div>
                    <div><label className="label">تلفن</label><input required value={addr.phone} onChange={(e) => setAddr({ ...addr, phone: e.target.value })} className="field" dir="ltr" /></div>
                    <div className="sm:col-span-2"><button type="submit" className="btn-accent !py-2.5 text-[12px]">ثبت آدرس</button></div>
                  </form>
                )}
                {addresses.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 rounded-2xl border border-black/[.06] bg-white p-4">
                    <div className="text-[12px]">
                      <p className="font-extrabold text-graphite-900">{a.title} {a.is_default && <span className="mr-1 rounded bg-success/10 px-1.5 py-0.5 text-[9px] text-success">پیش‌فرض</span>}</p>
                      <p className="mt-1 leading-6 text-steel-500">{a.province}، {a.city}، {a.address}</p>
                      <p className="num mt-1 text-[10.5px] text-muted">{a.receiver} · {faNum(a.phone)}</p>
                    </div>
                    <button onClick={() => removeAddress(a.id)} className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger" aria-label="حذف"><IconTrash width={16} height={16} /></button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'wishlist' && (
              <div className="grid gap-3 sm:grid-cols-2">
                {wishlist.length === 0 && <div className="sm:col-span-2 rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-[12px] text-muted">لیست علاقه‌مندی‌های شما خالی است.</div>}
                {wishlist.map((p) => (
                  <div key={p.id} className="flex gap-3 rounded-2xl border border-black/[.06] bg-white p-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-surface p-1"><img src={assetUrl(p.image)} alt="" className="h-full w-full object-contain" /></div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${p.slug}`} className="block truncate text-[12px] font-extrabold hover:text-accent-dark">{p.name}</Link>
                      <p className="num text-[10.5px] text-muted" dir="ltr">{p.size}</p>
                      <p className="num mt-1 text-[12px] font-bold">{formatNumber(p.price)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => removeWish(p.id)} className="rounded-lg p-1 text-muted hover:text-danger" aria-label="حذف"><IconHeart width={16} height={16} filled /></button>
                      <Link href={`/products/${p.slug}`} className="rounded-lg p-1 text-accent" aria-label="مشاهده"><IconCart width={16} height={16} /></Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'password' && (
              <form onSubmit={savePassword} className="max-w-md rounded-2xl border border-black/[.06] bg-white p-5">
                <h3 className="mb-4 text-[14px] font-extrabold text-graphite-900">تغییر رمز عبور</h3>
                <div className="space-y-3">
                  <div><label className="label">رمز فعلی</label><input required type="password" value={pass.current_password} onChange={(e) => setPass({ ...pass, current_password: e.target.value })} className="field" dir="ltr" /></div>
                  <div><label className="label">رمز جدید</label><input required type="password" value={pass.new_password} onChange={(e) => setPass({ ...pass, new_password: e.target.value })} className="field" dir="ltr" /></div>
                  <button type="submit" className="btn-accent !py-2.5 text-[12px]">به‌روزرسانی رمز</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
