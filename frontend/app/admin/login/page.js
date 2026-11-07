'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import Logo from '@/components/Logo';
import { adminApi, setAdminToken } from '@/lib/adminApi';
import { IconMail, IconLock, IconEye, IconArrowLeft, IconCheck, IconShield } from '@/components/Icons';

const PERKS = [
  'مدیریت کامل محصولات، موجودی و قیمت‌ها',
  'پیگیری سفارش‌ها از ثبت تا تحویل',
  'بنر و اسلایدر صفحهٔ اصلی',
  'گزارش فروش، تخفیف‌ها و مشتریان',
];

const inputCls =
  'h-12 w-full rounded-xl border border-white/10 bg-black/35 pl-11 pr-4 text-[13px] font-medium text-white outline-none transition placeholder:text-white/25 focus:border-accent focus:ring-4 focus:ring-accent/15';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await adminApi('/login', { method: 'POST', body: form });
      setAdminToken(res.token);
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-graphite-900 lg:grid-cols-[1.05fr_.95fr]">
      {/* هالهٔ نارنجی پس‌زمینه */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-accent/10 blur-[110px]" />
      <div className="tire-pattern pointer-events-none absolute inset-0 opacity-[.16]" />

      {/* ── پنل تصویری ── */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/images/hero/admin-login.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900 via-graphite-900/45 to-graphite-900/70" />
        <div className="absolute inset-0 bg-gradient-to-l from-graphite-900/85 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-graphite-900 to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
          <Logo variant="dark" size="lg" href="/" />

          <div>
            <motion.span
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="num inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[10.5px] font-bold tracking-[.28em] text-accent backdrop-blur-sm"
            >
              <IconShield width={13} height={13} />
              LIFT TIRE ADMIN
            </motion.span>
            <motion.h2
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="mt-4 text-[30px] font-extrabold leading-[1.35] text-white xl:text-[34px]"
            >
              مدیریت فروشگاه،
              <br />
              <span className="text-accent">یک قدم سریع‌تر</span>
            </motion.h2>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16 }}
              className="mt-3 max-w-sm text-[12.5px] leading-6 text-white/55"
            >
              محصولات، سفارش‌ها، بنرها و گزارش فروش را از یک پنل ساده مدیریت کنید.
            </motion.p>

            <motion.ul
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-7 grid gap-2.5"
            >
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[12.5px] text-white/70">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                    <IconCheck width={13} height={13} />
                  </span>
                  {p}
                </li>
              ))}
            </motion.ul>
          </div>
        </div>
      </div>

      {/* ── فرم ورود ── */}
      <div className="relative flex items-center justify-center p-5 sm:p-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px] rounded-3xl border border-white/10 bg-white/[.045] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,.9)] backdrop-blur-xl sm:p-8"
        >
          <div className="lg:hidden">
            <Logo variant="dark" size="md" href="/" />
          </div>

          <div className="mt-5 lg:mt-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              ورود مدیر
            </span>
            <h1 className="mt-3 text-[22px] font-extrabold leading-8 text-white">ورود به پنل مدیریت</h1>
            <p className="mt-1.5 text-[12px] leading-5 text-white/45">
              ایمیل و رمز عبور مدیر را وارد کنید تا به داشبورد فروشگاه برسید.
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-white/70">ایمیل مدیر</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">
                  <IconMail width={17} height={17} />
                </span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  dir="ltr"
                  placeholder="admin@lift-tire.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-white/70">رمز عبور</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35">
                  <IconLock width={17} height={17} />
                </span>
                <input
                  required
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${inputCls} pr-11`}
                  dir="ltr"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <IconEye off={!show} width={17} height={17} />
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-[12px] font-bold text-danger"
              >
                {error}
              </motion.p>
            )}

            <button type="submit" disabled={busy} className="btn-accent group relative h-12 w-full overflow-hidden !text-[13px]">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {busy && (
                  <svg viewBox="0 0 24 24" width={16} height={16} className="animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" opacity=".9" />
                  </svg>
                )}
                {busy ? 'در حال ورود…' : 'ورود به پنل'}
                {!busy && <IconArrowLeft width={16} height={16} className="transition group-hover:-translate-x-1" />}
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-3.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-white/70">
              <IconShield width={14} height={14} className="text-accent" />
              دسترسی نمایشی
            </p>
            <div className="mt-2 grid gap-1.5">
              <p className="flex items-center justify-between text-[11px] text-white/45">
                ایمیل
                <span className="num rounded-lg bg-white/[.07] px-2 py-1 font-bold text-white/80" dir="ltr">admin@lift-tire.com</span>
              </p>
              <p className="flex items-center justify-between text-[11px] text-white/45">
                رمز عبور
                <span className="num rounded-lg bg-white/[.07] px-2 py-1 font-bold text-white/80" dir="ltr">Lift@12345</span>
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] font-bold text-white/40 transition hover:text-accent"
          >
            <IconArrowLeft width={14} height={14} className="rotate-180" />
            بازگشت به فروشگاه
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
