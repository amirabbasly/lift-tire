'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from './Providers';

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: 'مشاوره خرید لاستیک', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { show } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api('/contact', { method: 'POST', body: form });
      show(res.message);
      setSent(true);
      setForm({ name: '', phone: '', email: '', subject: 'مشاوره خرید لاستیک', message: '' });
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/[.06] bg-white p-5">
      <h3 className="mb-1 text-[14px] font-extrabold text-graphite-900">ارسال پیام به لیفت تایر</h3>
      <p className="mb-4 text-[11.5px] text-muted">فرم زیر را پر کنید؛ در اولین فرصت با شما تماس می‌گیریم.</p>
      {sent && <p className="mb-4 rounded-xl bg-success/10 p-3 text-[12px] font-bold text-success">پیام شما ثبت شد. کارشناسان ما به‌زودی پاسخ می‌دهند.</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">نام و نام خانوادگی *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" /></div>
        <div><label className="label">شماره موبایل *</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" inputMode="tel" dir="ltr" placeholder="09121234567" /></div>
        <div><label className="label">ایمیل</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" dir="ltr" /></div>
        <div>
          <label className="label">موضوع</label>
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="field">
            {['مشاوره خرید لاستیک', 'پیگیری سفارش', 'گارانتی و بازگشت کالا', 'همکاری و نمایندگی', 'سایر موارد'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2"><label className="label">متن پیام *</label><textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="field" placeholder="سایز لاستیک یا مدل خودروی خود را بنویسید تا دقیق‌تر راهنمایی کنیم." /></div>
      </div>
      <button type="submit" disabled={loading} className="btn-accent mt-4 !py-3">{loading ? 'در حال ارسال…' : 'ارسال پیام'}</button>
    </form>
  );
}
