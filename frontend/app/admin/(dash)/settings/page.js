'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { AdminPageHeader, Field, Input, Spinner, Textarea } from '@/components/admin/UI';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi('/settings').then(setSettings).catch((e) => setError(e.message));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const updated = await adminApi('/settings', { method: 'PUT', body: settings });
      setSettings(updated);
      setMsg('تنظیمات با موفقیت ذخیره شد.');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  if (!settings) return <Spinner />;

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const shipping = settings.shipping || [];
  const services = settings.services || [];

  return (
    <div>
      <AdminPageHeader title="تنظیمات سایت" desc="اطلاعات فروشگاه، تماس، شبکه‌های اجتماعی و هزینه‌های ارسال">
        <button onClick={save} disabled={saving} className="btn-accent !py-2 text-[12px]">{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}</button>
      </AdminPageHeader>
      {msg && <p className="mb-3 rounded-xl bg-success/10 p-3 text-[12px] font-bold text-success">{msg}</p>}
      {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card">
          <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">اطلاعات فروشگاه</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام سایت"><Input value={settings.site_name || ''} onChange={(e) => set('site_name', e.target.value)} /></Field>
            <Field label="نام لاتین"><Input value={settings.site_name_en || ''} onChange={(e) => set('site_name_en', e.target.value)} dir="ltr" /></Field>
            <Field label="شعار" className="sm:col-span-2"><Input value={settings.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
            <Field label="تلفن"><Input value={settings.phone || ''} onChange={(e) => set('phone', e.target.value)} dir="ltr" /></Field>
            <Field label="موبایل"><Input value={settings.mobile || ''} onChange={(e) => set('mobile', e.target.value)} dir="ltr" /></Field>
            <Field label="ایمیل"><Input value={settings.email || ''} onChange={(e) => set('email', e.target.value)} dir="ltr" /></Field>
            <Field label="ساعت کاری"><Input value={settings.work_hours || ''} onChange={(e) => set('work_hours', e.target.value)} /></Field>
            <Field label="آدرس" className="sm:col-span-2"><Textarea rows={2} value={settings.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="متن فوتر" className="sm:col-span-2"><Textarea rows={3} value={settings.footer_text || ''} onChange={(e) => set('footer_text', e.target.value)} /></Field>
            <Field label="توضیح متا" className="sm:col-span-2"><Textarea rows={2} value={settings.meta_description || ''} onChange={(e) => set('meta_description', e.target.value)} /></Field>
          </div>
        </div>

        <div className="space-y-4">
          <div className="admin-card">
            <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">شبکه‌های اجتماعی</h3>
            <div className="space-y-2">
              <Field label="اینستاگرام"><Input value={settings.instagram || ''} onChange={(e) => set('instagram', e.target.value)} dir="ltr" /></Field>
              <Field label="تلگرام"><Input value={settings.telegram || ''} onChange={(e) => set('telegram', e.target.value)} dir="ltr" /></Field>
              <Field label="واتساپ"><Input value={settings.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} dir="ltr" /></Field>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">هزینه ارسال</h3>
            <div className="space-y-2">
              {shipping.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-24 text-[11px] font-bold text-graphite-800">{s.title}</span>
                  <Input
                    value={s.cost}
                    onChange={(e) => set('shipping', shipping.map((x, k) => (k === i ? { ...x, cost: Number(e.target.value) || 0 } : x)))}
                    inputMode="numeric" dir="ltr" className="!py-1.5 !text-[11px]"
                  />
                  <span className="text-[10px] text-muted">تومان</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted">تغییرات هزینه ارسال در محاسبه سفارش جدید اعمال می‌شود.</p>
          </div>

          <div className="admin-card">
            <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">سرویس‌های اعتماد (فوتر)</h3>
            <div className="space-y-2">
              {services.map((s, i) => (
                <div key={s.title} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <Input value={s.title} onChange={(e) => set('services', services.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className="!py-1.5 !text-[11px]" />
                  <Input value={s.desc} onChange={(e) => set('services', services.map((x, k) => (k === i ? { ...x, desc: e.target.value } : x)))} className="!py-1.5 !text-[11px]" />
                  <img src={s.icon} alt="" className="h-7 w-7 object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
