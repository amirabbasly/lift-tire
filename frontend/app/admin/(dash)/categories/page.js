'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { assetUrl, faNum } from '@/lib/format';
import { AdminPageHeader, Badge, Confirm, Field, ImageUploader, Input, Modal, Spinner, Textarea, Toggle } from '@/components/admin/UI';

const EMPTY = { name: '', slug: '', parent_id: '', image: '', description: '', sort: 0, is_active: true };

export default function AdminCategoriesPage() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => adminApi('/categories').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) await adminApi(`/categories/${editing}`, { method: 'PUT', body: form });
      else await adminApi('/categories', { method: 'POST', body: form });
      setModal(false);
      load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await adminApi(`/categories/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <AdminPageHeader title="دسته‌بندی‌ها" desc="ساختار دسته‌بندی محصولات فروشگاه">
        <button onClick={() => { setForm(EMPTY); setEditing(null); setError(''); setModal(true); }} className="btn-accent !py-2 text-[12px]">افزودن دسته</button>
      </AdminPageHeader>
      {error && !modal && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      {!items ? <Spinner /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="admin-card flex gap-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface">
                {c.image ? <img src={assetUrl(c.image)} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-muted">بدون تصویر</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold text-graphite-900">{c.name}</p>
                <p className="num text-[10px] text-muted" dir="ltr">/{c.slug}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge color={c.is_active ? '#16A34A' : '#6B7280'}>{c.is_active ? 'فعال' : 'غیرفعال'}</Badge>
                  <Badge color="#6B7280">{faNum(c.product_count || 0)} محصول</Badge>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => { setForm({ ...EMPTY, ...c, parent_id: c.parent_id || '' }); setEditing(c.id); setError(''); setModal(true); }} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500 hover:text-accent">ویرایش</button>
                  <Confirm text={`دسته «${c.name}» حذف شود؟`} onConfirm={() => remove(c.id)}>
                    <button className="rounded-lg bg-danger/10 px-2 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                  </Confirm>
                </div>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-[12px] text-muted">دسته‌بندی‌ای ثبت نشده است.</p>}
        </div>
      )}

      <Modal
        open={modal} onClose={() => setModal(false)} title={editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
        footer={<>
          <button onClick={() => setModal(false)} className="btn-ghost !py-2 text-[12px]">انصراف</button>
          <button onClick={save} disabled={saving} className="btn-accent !py-2 text-[12px]">{saving ? 'در حال ذخیره…' : 'ذخیره'}</button>
        </>}
      >
        {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="نامک"><Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" /></Field>
          <Field label="دسته والد">
            <select value={form.parent_id || ''} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="admin-input">
              <option value="">دسته اصلی</option>
              {items?.filter((c) => c.id !== editing).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="ترتیب"><Input value={form.sort ?? 0} onChange={(e) => setForm({ ...form, sort: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <div className="sm:col-span-2"><Field label="توضیح"><Textarea rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><ImageUploader value={form.image} onChange={(v) => setForm({ ...form, image: v })} multiple={false} label="تصویر دسته" /></div>
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال" />
        </div>
      </Modal>
    </div>
  );
}
