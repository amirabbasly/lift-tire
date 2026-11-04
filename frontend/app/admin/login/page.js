'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { adminApi, setAdminToken } from '@/lib/adminApi';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await adminApi('/login', { method: 'POST', body: form });
      setAdminToken(res.token);
      router.push('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-graphite-900 lg:block">
        <img src="/images/hero/hero-2.jpg" alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900 via-graphite-900/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="num text-[11px] tracking-[.3em] text-accent">LIFT TIRE ADMIN</p>
          <h2 className="mt-3 text-2xl font-extrabold leading-relaxed">مدیریت فروشگاه،<br />یک قدم سریع‌تر</h2>
          <p className="mt-3 max-w-sm text-[12px] leading-6 text-white/50">
            محصولات، سفارش‌ها، بنرها و گزارش فروش را از یک پنل ساده مدیریت کنید.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Logo size="md" />
          <h1 className="mt-6 text-lg font-extrabold text-graphite-900">ورود به پنل مدیریت</h1>
          <p className="mt-1 text-[12px] text-muted">برای ادامه، ایمیل و رمز عبور مدیر را وارد کنید.</p>

          <div className="mt-5 space-y-3">
            <div>
              <label className="label">ایمیل مدیر</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" dir="ltr" placeholder="admin@lift-tire.com" />
            </div>
            <div>
              <label className="label">رمز عبور</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field" dir="ltr" />
            </div>
            {error && <p className="rounded-xl bg-danger/10 p-3 text-[12px] font-bold text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="btn-accent w-full !py-3">{busy ? 'در حال ورود…' : 'ورود به پنل'}</button>
          </div>

          <div className="mt-4 rounded-xl bg-white p-3 text-[11px] text-steel-500 shadow-card">
            <p className="font-bold text-graphite-800">دسترسی نمایشی</p>
            <p className="mt-1">ایمیل: <span className="num" dir="ltr">admin@lift-tire.com</span></p>
            <p>رمز: <span className="num" dir="ltr">Lift@12345</span></p>
          </div>
        </form>
      </div>
    </div>
  );
}
