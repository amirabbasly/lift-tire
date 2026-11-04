'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { ORDER_STATUS } from '@/lib/constants';
import { faNum, formatDate, toman } from '@/lib/format';
import { Spinner, AdminPageHeader, Badge } from '@/components/admin/UI';

function Stat({ label, value, hint, color = '#FF6A13' }) {
  return (
    <div className="admin-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted">{label}</span>
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      </div>
      <p className="num mt-2 text-[22px] font-extrabold text-graphite-900">{value}</p>
      {hint && <p className="mt-1 text-[10.5px] text-muted">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="rounded-xl bg-danger/10 p-4 text-[12px] text-danger">{error}</p>;
  if (!data) return <Spinner />;

  const maxDaily = Math.max(1, ...(data.daily || []).map((d) => d.total));

  return (
    <div>
      <AdminPageHeader title="داشبورد" desc="نمای کلی فروش، سفارش‌ها و موجودی فروشگاه" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="سفارش‌های ثبت‌شده" value={faNum(data.total_orders)} hint="کل سفارش‌ها" />
        <Stat label="درآمد کل" value={toman(data.total_revenue)} hint="بدون سفارش‌های لغوشده" color="#16A34A" />
        <Stat label="مشتریان" value={faNum(data.total_customers)} hint="حساب‌های ثبت‌شده" color="#2563EB" />
        <Stat label="محصولات" value={faNum(data.total_products)} hint="فعال و غیرفعال" color="#6B7280" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="admin-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[13px] font-extrabold text-graphite-900">فروش ۱۴ روز اخیر</h3>
            <span className="text-[10.5px] text-muted">تومان</span>
          </div>
          <div className="relative flex h-44 items-end gap-1.5 border-b border-black/[.06] pb-1">
            {(data.daily || []).map((d) => (
              <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
                <span className="num absolute -top-4 hidden text-[9px] text-muted group-hover:block">{faNum(Math.round(d.total / 1000))}k</span>
                <div className="w-full rounded-t-md bg-accent/85 transition-all group-hover:bg-accent" style={{ height: `${Math.max(6, (d.total / maxDaily) * 150)}px` }} />
                <span className="num mt-1 text-[8px] text-muted">{faNum(String(d.day || '').slice(8))}</span>
              </div>
            ))}
            {(!data.daily || data.daily.length === 0) && (
              <div className="absolute inset-0 grid place-items-center">
                <p className="text-[12px] text-muted">هنوز فروشی ثبت نشده است.</p>
              </div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">وضعیت سفارش‌ها</h3>
          <div className="space-y-2">
            {(data.by_status || []).map((s) => (
              <div key={s.status} className="flex items-center justify-between text-[12px]">
                <Badge color={ORDER_STATUS[s.status]?.color || '#6B7280'}>{ORDER_STATUS[s.status]?.label || s.status}</Badge>
                <span className="num font-bold">{faNum(s.c)}</span>
              </div>
            ))}
            {(!data.by_status || !data.by_status.length) && <p className="text-[12px] text-muted">سفارشی وجود ندارد.</p>}
          </div>
          {(data.pending_reviews > 0 || data.unread_messages > 0) && (
            <div className="mt-4 space-y-1.5 border-t border-black/[.06] pt-3 text-[11.5px]">
              {data.pending_reviews > 0 && <p className="flex justify-between"><span className="text-muted">نظرات در انتظار تأیید</span><Link href="/admin/reviews" className="num font-bold text-accent-dark">{faNum(data.pending_reviews)}</Link></p>}
              {data.unread_messages > 0 && <p className="flex justify-between"><span className="text-muted">پیام‌های خوانده‌نشده</span><Link href="/admin/subscribers" className="num font-bold text-accent-dark">{faNum(data.unread_messages)}</Link></p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="admin-card">
          <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">پرفروش‌ترین محصولات</h3>
          <div className="space-y-2.5">
            {(data.top_products || []).map((p, i) => (
              <div key={`${p.name}-${i}`} className="flex items-center gap-2 text-[12px]">
                <span className="num grid h-6 w-6 place-items-center rounded-lg bg-surface text-[10px] font-bold text-steel-500">{faNum(i + 1)}</span>
                <span className="min-w-0 flex-1 truncate text-graphite-800">{p.name}</span>
                <span className="num text-muted">{faNum(p.qty)} عدد</span>
              </div>
            ))}
            {!data.top_products?.length && <p className="text-[12px] text-muted">هنوز فروشی ثبت نشده است.</p>}
          </div>
        </div>

        <div className="admin-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-extrabold text-graphite-900">آخرین سفارش‌ها</h3>
            <Link href="/admin/orders" className="text-[10.5px] font-bold text-accent-dark">همه</Link>
          </div>
          <div className="space-y-2">
            {(data.recent_orders || []).map((o) => (
              <div key={o.id} className="flex items-center justify-between border-b border-black/[.05] pb-2 text-[11.5px] last:border-0">
                <div>
                  <p className="num font-bold text-graphite-900">{o.code}</p>
                  <p className="text-[10px] text-muted">{o.customer_name} · {formatDate(o.created_at)}</p>
                </div>
                <div className="text-left">
                  <p className="num font-bold">{toman(o.total)}</p>
                  <Badge color={ORDER_STATUS[o.status]?.color || '#6B7280'}>{ORDER_STATUS[o.status]?.label || o.status}</Badge>
                </div>
              </div>
            ))}
            {!data.recent_orders?.length && <p className="text-[12px] text-muted">سفارشی ثبت نشده است.</p>}
          </div>
        </div>
      </div>

      {data.low_stock?.length > 0 && (
        <div className="admin-card mt-4">
          <h3 className="mb-3 text-[13px] font-extrabold text-graphite-900">هشدار موجودی کم</h3>
          <div className="flex flex-wrap gap-2">
            {data.low_stock.map((p) => (
              <Link key={p.id} href="/admin/products" className="rounded-lg bg-warning/10 px-2.5 py-1.5 text-[11px] text-[#92400E]">
                {p.name} — <span className="num">{faNum(p.stock)}</span> عدد
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
