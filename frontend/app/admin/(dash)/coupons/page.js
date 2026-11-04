'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { faNum, formatNumber } from '@/lib/format';
import { AdminPageHeader, Badge, Confirm, EmptyRow, Field, Input, Modal, Select, Spinner, Toggle } from '@/components/admin/UI';

const EMPTY = { code: '', type: 'percent', value: 10, min_subtotal: 0, max_discount: '', usage_limit: '', expires_at: '', is_active: true };
const TYPES = [
  { value: 'percent', label: 'درصدی' },
  { value: 'fixed', label: 'مبلغ ثابت' },
  { value: 'shipping', label: 'تخفیف ارسال' },
];

export default function AdminCouponsPage() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => adminApi('/coupons').then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError('');
    try {
      if (editing) await adminApi(`/coupons/${editing}`, { method: 'PUT', body: form });
      else await adminApi('/coupons', { method: 'POST', body: form });
      setModal(false); load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await adminApi(`/coupons/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <AdminPageHeader title="کدهای تخفیف" desc="ساخت و مدیریت کوپن‌های درصدی، مبلغی و ارسال">
        <button onClick={() => { setForm(EMPTY); setEditing(null); setError(''); setModal(true); }} className="btn-accent !py-2 text-[12px]">کد جدید</button>
      </AdminPageHeader>
      {error && !modal && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      <div className="admin-card overflow-x-auto p-0">
        {!items ? <Spinner /> : (
          <table className="w-full min-w-[700px] text-right text-[12px]">
            <thead className="bg-surface text-[11px] text-muted"><tr><th className="p-3">کد</th><th className="p-3">نوع</th><th className="p-3">مقدار</th><th className="p-3">حداقل سبد</th><th className="p-3">استفاده</th><th className="p-3">وضعیت</th><th className="p-3">عملیات</th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-black/[.05]">
                  <td className="num p-3 font-extrabold text-graphite-900" dir="ltr">{c.code}</td>
                  <td className="p-3">{TYPES.find((t) => t.value === c.type)?.label}</td>
                  <td className="num p-3">{c.type === 'percent' ? `${faNum(c.value)}٪` : c.type === 'fixed' ? formatNumber(c.value) : 'هزینه ارسال'}</td>
                  <td className="num p-3">{formatNumber(c.min_subtotal)}</td>
                  <td className="num p-3">{faNum(c.used_count)} {c.usage_limit ? `/ ${faNum(c.usage_limit)}` : ''}</td>
                  <td className="p-3"><Badge color={c.is_active ? '#16A34A' : '#6B7280'}>{c.is_active ? 'فعال' : 'غیرفعال'}</Badge></td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => { setForm({ ...EMPTY, ...c, expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : '' }); setEditing(c.id); setError(''); setModal(true); }} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500 hover:text-accent">ویرایش</button>
                      <Confirm text="این کد حذف شود؟" onConfirm={() => remove(c.id)}>
                        <button className="rounded-lg bg-danger/10 px-2 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                      </Confirm>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && <EmptyRow colSpan={7} />}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal} onClose={() => setModal(false)} title={editing ? 'ویرایش کد تخفیف' : 'کد تخفیف جدید'}
        footer={<>
          <button onClick={() => setModal(false)} className="btn-ghost !py-2 text-[12px]">انصراف</button>
          <button onClick={save} disabled={saving} className="btn-accent !py-2 text-[12px]">{saving ? '…' : 'ذخیره'}</button>
        </>}
      >
        {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="کد *"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} dir="ltr" placeholder="LIFT10" /></Field>
          <Field label="نوع"><Select options={TYPES} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Field>
          <Field label="مقدار"><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <Field label="حداقل مبلغ سبد"><Input value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <Field label="حداکثر تخفیف"><Input value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <Field label="محدودیت تعداد استفاده"><Input value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} inputMode="numeric" dir="ltr" /></Field>
          <Field label="تاریخ انقضا"><Input type="date" value={form.expires_at || ''} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} dir="ltr" /></Field>
          <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label="فعال" />
        </div>
      </Modal>
    </div>
  );
}
