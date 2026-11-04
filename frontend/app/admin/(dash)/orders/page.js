'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { ORDER_STATUS } from '@/lib/constants';
import { faNum, formatDate, formatNumber, toman } from '@/lib/format';
import { AdminPageHeader, Badge, Confirm, EmptyRow, Field, Input, Modal, Pagination, Select, Spinner } from '@/components/admin/UI';

export default function AdminOrdersPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ status: '', tracking_code: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => adminApi(`/orders?page=${page}&limit=10&status=${status}&q=${encodeURIComponent(q)}`).then(setData).catch((e) => setError(e.message));
  useEffect(load, [page, status]);

  const openDetail = async (id) => {
    try {
      const o = await adminApi(`/orders/${id}`);
      setDetail(o);
      setForm({ status: o.status, tracking_code: o.tracking_code || '' });
    } catch (e) { setError(e.message); }
  };

  const save = async () => {
    setBusy(true);
    try {
      const updated = await adminApi(`/orders/${detail.id}`, { method: 'PATCH', body: form });
      setDetail({ ...detail, ...updated });
      load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const remove = async (id) => {
    try { await adminApi(`/orders/${id}`, { method: 'DELETE' }); setDetail(null); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <AdminPageHeader title="سفارش‌ها" desc="مدیریت وضعیت، ارسال و پیگیری سفارش‌ها">
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={[{ value: '', label: 'همه وضعیت‌ها' }, ...Object.entries(ORDER_STATUS).map(([k, v]) => ({ value: k, label: v.label }))]}
          className="!w-40"
        />
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="کد سفارش، نام یا موبایل" className="!w-48" />
        <button onClick={load} className="btn-ghost !py-2 text-[12px]">جست‌وجو</button>
      </AdminPageHeader>
      {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      <div className="admin-card overflow-x-auto p-0">
        {!data ? <Spinner /> : (
          <table className="w-full min-w-[760px] text-right text-[12px]">
            <thead className="bg-surface text-[11px] text-muted">
              <tr><th className="p-3">کد</th><th className="p-3">مشتری</th><th className="p-3">مبلغ</th><th className="p-3">وضعیت</th><th className="p-3">تاریخ</th><th className="p-3">عملیات</th></tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="border-t border-black/[.05] hover:bg-surface/50">
                  <td className="num p-3 font-bold text-graphite-900">{o.code}</td>
                  <td className="p-3"><p className="font-bold">{o.customer_name}</p><p className="num text-[10px] text-muted">{faNum(o.phone)}</p></td>
                  <td className="num p-3">{formatNumber(o.total)}</td>
                  <td className="p-3"><Badge color={ORDER_STATUS[o.status]?.color || '#6B7280'}>{ORDER_STATUS[o.status]?.label || o.status}</Badge></td>
                  <td className="p-3 text-[10.5px] text-muted">{formatDate(o.created_at, true)}</td>
                  <td className="p-3"><button onClick={() => openDetail(o.id)} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500 hover:text-accent">جزئیات</button></td>
                </tr>
              ))}
              {!data.items.length && <EmptyRow colSpan={6} text="سفارشی یافت نشد." />}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={data?.page || 1} pages={data?.pages || 1} onPage={setPage} />

      <Modal
        open={!!detail} onClose={() => setDetail(null)} title={`سفارش ${detail?.code || ''}`} wide
        footer={<>
          <Confirm text="این سفارش کامل حذف شود؟" onConfirm={() => remove(detail.id)}>
            <button className="btn !bg-danger/10 !py-2 text-[12px] text-danger">حذف سفارش</button>
          </Confirm>
          <button onClick={save} disabled={busy} className="btn-accent !py-2 text-[12px]">{busy ? '…' : 'ذخیره وضعیت'}</button>
        </>}
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="وضعیت سفارش">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={Object.entries(ORDER_STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
              </Field>
              <Field label="کد رهگیری مرسوله"><Input value={form.tracking_code} onChange={(e) => setForm({ ...form, tracking_code: e.target.value })} dir="ltr" /></Field>
            </div>

            <div className="rounded-xl bg-surface p-3 text-[12px]">
              <p className="font-bold text-graphite-900">{detail.customer_name} — <span className="num">{faNum(detail.phone)}</span></p>
              <p className="mt-1 text-steel-500">{detail.address_snapshot?.province}، {detail.address_snapshot?.city}، {detail.address_snapshot?.address}</p>
              <p className="mt-1 text-[10.5px] text-muted">
                روش ارسال: {detail.shipping_method === 'post' ? 'پست پیشتاز' : detail.shipping_method === 'freight' ? 'باربری' : 'پیک تهران'} ·
                پرداخت: {detail.payment_method === 'cod' ? 'در محل' : 'اینترنتی'} · تاریخ: {formatDate(detail.created_at, true)}
              </p>
            </div>

            <div className="rounded-xl border border-black/[.07]">
              <table className="w-full text-[11.5px]">
                <thead className="bg-surface text-[10.5px] text-muted"><tr><th className="p-2 text-right">محصول</th><th className="p-2">سایز</th><th className="p-2">تعداد</th><th className="p-2">قیمت</th></tr></thead>
                <tbody>
                  {detail.items?.map((it) => (
                    <tr key={it.id} className="border-t border-black/[.05]">
                      <td className="p-2">{it.name}</td>
                      <td className="num p-2 text-center" dir="ltr">{it.size}</td>
                      <td className="num p-2 text-center">{faNum(it.qty)}</td>
                      <td className="num p-2 text-center">{formatNumber(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 rounded-xl bg-surface p-3 text-[12px]">
              <div className="flex justify-between"><span className="text-muted">جمع کالا</span><span className="num">{formatNumber(detail.subtotal)}</span></div>
              {detail.discount > 0 && <div className="flex justify-between text-success"><span>تخفیف ({detail.coupon_code})</span><span className="num">−{formatNumber(detail.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted">ارسال</span><span className="num">{formatNumber(detail.shipping_cost)}</span></div>
              <div className="flex justify-between border-t border-black/[.07] pt-1.5 font-extrabold"><span>مبلغ کل</span><span className="num">{toman(detail.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
