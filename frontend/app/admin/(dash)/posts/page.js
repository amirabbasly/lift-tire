'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { assetUrl, formatDate } from '@/lib/format';
import { AdminPageHeader, Badge, Confirm, Field, ImageUploader, Input, Modal, Spinner, Textarea, Toggle } from '@/components/admin/UI';

const EMPTY = { title: '', slug: '', excerpt: '', content: '', cover: '', author: 'تیم لیفت تایر', tag: 'راهنمای خرید', read_time: 5, is_published: true };

export default function AdminPostsPage() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => adminApi('/posts').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await adminApi(`/posts/${editing}`, { method: 'PUT', body: form });
      else await adminApi('/posts', { method: 'POST', body: form });
      setModal(false); load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await adminApi(`/posts/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <AdminPageHeader title="مقالات مجله" desc="مدیریت محتوای مجله لیفت تایر">
        <button onClick={() => { setForm(EMPTY); setEditing(null); setError(''); setModal(true); }} className="btn-accent !py-2 text-[12px]">مقاله جدید</button>
      </AdminPageHeader>
      {error && !modal && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      {!items ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="admin-card overflow-hidden p-0">
              <div className="aspect-[16/9] bg-graphite-800">
                {p.cover && <img src={assetUrl(p.cover)} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Badge color={p.is_published ? '#16A34A' : '#6B7280'}>{p.is_published ? 'منتشر شده' : 'پیش‌نویس'}</Badge>
                  <Badge color="#6B7280">{p.tag}</Badge>
                </div>
                <p className="line-clamp-2 text-[12.5px] font-extrabold text-graphite-900">{p.title}</p>
                <p className="mt-1 text-[10px] text-muted">{formatDate(p.created_at)}</p>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => { setForm({ ...EMPTY, ...p }); setEditing(p.id); setError(''); setModal(true); }} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500 hover:text-accent">ویرایش</button>
                  <Confirm text="این مقاله حذف شود؟" onConfirm={() => remove(p.id)}>
                    <button className="rounded-lg bg-danger/10 px-2 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                  </Confirm>
                </div>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-[12px] text-muted">مقاله‌ای ثبت نشده است.</p>}
        </div>
      )}

      <Modal
        open={modal} onClose={() => setModal(false)} title={editing ? 'ویرایش مقاله' : 'مقاله جدید'} wide
        footer={<>
          <button onClick={() => setModal(false)} className="btn-ghost !py-2 text-[12px]">انصراف</button>
          <button onClick={save} disabled={saving} className="btn-accent !py-2 text-[12px]">{saving ? 'در حال ذخیره…' : 'ذخیره مقاله'}</button>
        </>}
      >
        {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="عنوان *" className="sm:col-span-2"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="نامک"><Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" /></Field>
          <Field label="برچسب"><Input value={form.tag || ''} onChange={(e) => setForm({ ...form, tag: e.target.value })} /></Field>
          <Field label="نویسنده"><Input value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
          <Field label="زمان مطالعه (دقیقه)"><Input value={form.read_time || 5} onChange={(e) => setForm({ ...form, read_time: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <div className="sm:col-span-2"><Field label="خلاصه"><Textarea rows={2} value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></Field></div>
          <div className="sm:col-span-2"><Field label="محتوا (HTML)"><Textarea rows={8} value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} dir="ltr" /></Field></div>
          <div className="sm:col-span-2"><ImageUploader value={form.cover} onChange={(v) => setForm({ ...form, cover: v })} multiple={false} label="تصویر کاور" /></div>
          <Toggle checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} label="منتشر شود" />
        </div>
      </Modal>
    </div>
  );
}
