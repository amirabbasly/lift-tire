'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { faNum, formatDate } from '@/lib/format';
import Stars from '@/components/Stars';
import { AdminPageHeader, Badge, Confirm, Spinner } from '@/components/admin/UI';

const FILTERS = [
  { id: '', label: 'همه' },
  { id: 'pending', label: 'در انتظار تأیید' },
  { id: 'approved', label: 'تأیید شده' },
  { id: 'rejected', label: 'رد شده' },
];

export default function AdminReviewsPage() {
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = () => adminApi(`/reviews?status=${status}`).then(setItems).catch((e) => setError(e.message));
  useEffect(load, [status]);

  const setStatusOf = async (id, s) => {
    try { await adminApi(`/reviews/${id}`, { method: 'PATCH', body: { status: s } }); load(); } catch (e) { setError(e.message); }
  };
  const remove = async (id) => {
    try { await adminApi(`/reviews/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <AdminPageHeader title="نظرات کاربران" desc="تأیید، رد یا حذف نظرات ثبت‌شده روی محصولات">
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-card">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setStatus(f.id)} className={`rounded-lg px-3 py-1.5 text-[11.5px] font-bold transition ${status === f.id ? 'bg-graphite-900 text-white' : 'text-steel-500'}`}>{f.label}</button>
          ))}
        </div>
      </AdminPageHeader>
      {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      {!items ? <Spinner /> : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="admin-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[12.5px] font-extrabold text-graphite-900">{r.name} <span className="num text-[10px] font-normal text-muted">({faNum(r.phone || '')})</span></p>
                  <p className="text-[10.5px] text-muted">{r.product_name} · {formatDate(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} size={12} />
                  <Badge color={r.status === 'approved' ? '#16A34A' : r.status === 'rejected' ? '#DC2626' : '#F59E0B'}>
                    {r.status === 'approved' ? 'تأیید شده' : r.status === 'rejected' ? 'رد شده' : 'در انتظار'}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 rounded-lg bg-surface p-2.5 text-[12px] leading-6 text-steel-500">{r.comment}</p>
              <div className="mt-2 flex gap-1.5">
                {r.status !== 'approved' && <button onClick={() => setStatusOf(r.id, 'approved')} className="rounded-lg bg-success/10 px-2.5 py-1 text-[10.5px] font-bold text-success">تأیید</button>}
                {r.status !== 'rejected' && <button onClick={() => setStatusOf(r.id, 'rejected')} className="rounded-lg bg-warning/10 px-2.5 py-1 text-[10.5px] font-bold text-[#92400E]">رد</button>}
                <Confirm text="این نظر حذف شود؟" onConfirm={() => remove(r.id)}>
                  <button className="rounded-lg bg-danger/10 px-2.5 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                </Confirm>
              </div>
            </div>
          ))}
          {!items.length && <p className="text-[12px] text-muted">نظری در این وضعیت وجود ندارد.</p>}
        </div>
      )}
    </div>
  );
}
