'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { assetUrl, faNum } from '@/lib/format';
import { AdminPageHeader, Badge, Confirm, Field, ImageUploader, Input, Modal, Spinner, Textarea, Toggle } from '@/components/admin/UI';

const EMPTY = { name_fa: '', name_en: '', slug: '', logo: '', cover: '', description: '', sort: 0, is_active: true, is_featured: false };

export default function AdminBrandsPage() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => adminApi('/brands').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await adminApi(`/brands/${editing}`, { method: 'PUT', body: form });
      else await adminApi('/brands', { method: 'POST', body: form });
      setModal(false); load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await adminApi(`/brands/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <AdminPageHeader title="برندها" desc="مدیریت برندها، لوگو، بنر و برندهای ویژه نوار بالای سایت">
        <button onClick={() => { setForm(EMPTY); setEditing(null); setError(''); setModal(true); }} className="btn-accent !py-2 text-[12px]">افزودن برند</button>
      </AdminPageHeader>
      {error && !modal && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      <div className="admin-card overflow-x-auto p-0">
        {!items ? <Spinner /> : (
          <table className="w-full min-w-[720px] text-right text-[12px]">
            <thead className="bg-surface text-[11px] text-muted">
              <tr><th className="p-3">لوگو</th><th className="p-3">نام فارسی</th><th className="p-3">نام لاتین</th><th className="p-3">محصولات</th><th className="p-3">وضعیت</th><th className="p-3">عملیات</th></tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-t border-black/[.05] hover:bg-surface/50">
                  <td className="p-3">
                    <div className="grid h-10 w-16 place-items-center rounded-lg bg-surface p-1">
                      {b.logo ? <img src={assetUrl(b.logo)} alt="" className="max-h-7 max-w-full object-contain" /> : <span className="text-[9px] text-muted">-</span>}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-graphite-900">{b.name_fa}</td>
                  <td className="num p-3" dir="ltr">{b.name_en}</td>
                  <td className="num p-3">{faNum(b.product_count || 0)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge color={b.is_active ? '#16A34A' : '#6B7280'}>{b.is_active ? 'فعال' : 'غیرفعال'}</Badge>
                      {b.is_featured && <Badge color="#FF6A13">ویژه</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => { setForm({ ...EMPTY, ...b }); setEditing(b.id); setError(''); setModal(true); }} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500 hover:text-accent">ویرایش</button>
                      <Confirm text={`برند «${b.name_fa}» حذف شود؟`} onConfirm={() => remove(b.id)}>
                        <button className="rounded-lg bg-danger/10 px-2 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                      </Confirm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal} onClose={() => setModal(false)} title={editing ? 'ویرایش برند' : 'برند جدید'}
        footer={<>
          <button onClick={() => setModal(false)} className="btn-ghost !py-2 text-[12px]">انصراف</button>
          <button onClick={save} disabled={saving} className="btn-accent !py-2 text-[12px]">{saving ? 'در حال ذخیره…' : 'ذخیره'}</button>
        </>}
      >
        {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام فارسی *"><Input value={form.name_fa} onChange={(e) => setForm({ ...form, name_fa: e.target.value })} /></Field>
          <Field label="نام لاتین *"><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} dir="ltr" /></Field>
          <Field label="نامک"><Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" /></Field>
          <Field label="ترتیب"><Input value={form.sort ?? 0} onChange={(e) => setForm({ ...form, sort: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <div className="sm:col-span-2"><Field label="توضیح"><Textarea rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <ImageUploader value={form.logo} onChange={(v) => setForm({ ...form, logo: v })} multiple={false} label="لوگو برند" />
          <ImageUploader value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} multiple={false} label="بنر / کاور برند" />
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال" />
          <Toggle checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} label="برند ویژه (نوار بالای سایت)" />
        </div>
      </Modal>
    </div>
  );
}
