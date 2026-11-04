'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { assetUrl } from '@/lib/format';
import { AdminPageHeader, Badge, Confirm, Field, ImageUploader, Input, Modal, Select, Spinner, Textarea, Toggle } from '@/components/admin/UI';

const EMPTY = { title: '', subtitle: '', badge: '', image: '', link: '/products', cta_text: 'مشاهده محصولات', placement: 'hero', stat1_value: '', stat1_label: '', stat2_value: '', stat2_label: '', sort: 0, is_active: true };
const PLACEMENTS = [
  { value: 'hero', label: 'اسلایدر هیرو' },
  { value: 'strip', label: 'بنر نواری' },
  { value: 'category', label: 'بنر دسته‌بندی' },
];

export default function AdminBannersPage() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => adminApi('/banners').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await adminApi(`/banners/${editing}`, { method: 'PUT', body: form });
      else await adminApi('/banners', { method: 'POST', body: form });
      setModal(false); load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await adminApi(`/banners/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <AdminPageHeader title="بنرها و اسلایدر" desc="مدیریت تصاویر هیرو، بنرهای دسته‌بندی و نوارهای تبلیغاتی">
        <button onClick={() => { setForm(EMPTY); setEditing(null); setError(''); setModal(true); }} className="btn-accent !py-2 text-[12px]">افزودن بنر</button>
      </AdminPageHeader>
      {error && !modal && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      {!items ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => (
            <div key={b.id} className="admin-card overflow-hidden p-0">
              <div className="relative aspect-[16/8] bg-graphite-800">
                {b.image ? <img src={assetUrl(b.image)} alt="" className="h-full w-full object-cover" /> : null}
                <span className="absolute right-2 top-2"><Badge color="#FF6A13" soft={false}>{PLACEMENTS.find((p) => p.value === b.placement)?.label}</Badge></span>
                <span className="absolute left-2 top-2"><Badge color={b.is_active ? '#16A34A' : '#DC2626'} soft={false}>{b.is_active ? 'فعال' : 'غیرفعال'}</Badge></span>
              </div>
              <div className="p-3">
                <p className="truncate text-[12.5px] font-extrabold text-graphite-900">{b.title || 'بدون عنوان'}</p>
                <p className="truncate text-[10.5px] text-muted">{b.subtitle}</p>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => { setForm({ ...EMPTY, ...b }); setEditing(b.id); setError(''); setModal(true); }} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500 hover:text-accent">ویرایش</button>
                  <Confirm text="این بنر حذف شود؟" onConfirm={() => remove(b.id)}>
                    <button className="rounded-lg bg-danger/10 px-2 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                  </Confirm>
                </div>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-[12px] text-muted">بنری ثبت نشده است.</p>}
        </div>
      )}

      <Modal
        open={modal} onClose={() => setModal(false)} title={editing ? 'ویرایش بنر' : 'بنر جدید'} wide
        footer={<>
          <button onClick={() => setModal(false)} className="btn-ghost !py-2 text-[12px]">انصراف</button>
          <button onClick={save} disabled={saving} className="btn-accent !py-2 text-[12px]">{saving ? 'در حال ذخیره…' : 'ذخیره بنر'}</button>
        </>}
      >
        {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="محل نمایش"><Select options={PLACEMENTS} value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} /></Field>
          <Field label="ترتیب"><Input value={form.sort ?? 0} onChange={(e) => setForm({ ...form, sort: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <Field label="عنوان"><Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="برچسب بالای عنوان"><Input value={form.badge || ''} onChange={(e) => setForm({ ...form, badge: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="زیرعنوان"><Textarea rows={2} value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></Field></div>
          <Field label="لینک دکمه"><Input value={form.link || ''} onChange={(e) => setForm({ ...form, link: e.target.value })} dir="ltr" /></Field>
          <Field label="متن دکمه"><Input value={form.cta_text || ''} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} /></Field>
          <Field label="آمار ۱ (مقدار)"><Input value={form.stat1_value || ''} onChange={(e) => setForm({ ...form, stat1_value: e.target.value })} /></Field>
          <Field label="آمار ۱ (برچسب)"><Input value={form.stat1_label || ''} onChange={(e) => setForm({ ...form, stat1_label: e.target.value })} /></Field>
          <Field label="آمار ۲ (مقدار)"><Input value={form.stat2_value || ''} onChange={(e) => setForm({ ...form, stat2_value: e.target.value })} /></Field>
          <Field label="آمار ۲ (برچسب)"><Input value={form.stat2_label || ''} onChange={(e) => setForm({ ...form, stat2_label: e.target.value })} /></Field>
          <div className="sm:col-span-2"><ImageUploader value={form.image} onChange={(v) => setForm({ ...form, image: v })} multiple={false} label="تصویر بنر" /></div>
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال" />
        </div>
      </Modal>
    </div>
  );
}
