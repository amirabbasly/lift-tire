'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { faNum, formatDate } from '@/lib/format';
import { AdminPageHeader, Badge, Confirm, EmptyRow, Spinner } from '@/components/admin/UI';

export default function AdminSubscribersPage() {
  const [subs, setSubs] = useState(null);
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('messages');

  const load = () => {
    adminApi('/subscribers').then(setSubs).catch((e) => setError(e.message));
    adminApi('/messages').then(setMessages).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const delSub = async (id) => { await adminApi(`/subscribers/${id}`, { method: 'DELETE' }).catch(() => {}); load(); };
  const delMsg = async (id) => { await adminApi(`/messages/${id}`, { method: 'DELETE' }).catch(() => {}); load(); };
  const markRead = async (m) => { await adminApi(`/messages/${m.id}`, { method: 'PATCH', body: { is_read: !m.is_read } }).catch(() => {}); load(); };

  return (
    <div>
      <AdminPageHeader title="خبرنامه و پیام‌ها" desc="اعضای خبرنامه و پیام‌های فرم تماس">
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-card">
          <button onClick={() => setTab('messages')} className={`rounded-lg px-3 py-1.5 text-[11.5px] font-bold ${tab === 'messages' ? 'bg-graphite-900 text-white' : 'text-steel-500'}`}>پیام‌ها ({faNum(messages?.filter((m) => !m.is_read).length || 0)})</button>
          <button onClick={() => setTab('subs')} className={`rounded-lg px-3 py-1.5 text-[11.5px] font-bold ${tab === 'subs' ? 'bg-graphite-900 text-white' : 'text-steel-500'}`}>خبرنامه ({faNum(subs?.length || 0)})</button>
        </div>
      </AdminPageHeader>
      {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      {tab === 'messages' && (
        !messages ? <Spinner /> : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`admin-card ${m.is_read ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[12.5px] font-extrabold text-graphite-900">{m.name} <span className="num text-[10px] font-normal text-muted">{faNum(m.phone)}</span></p>
                    <p className="text-[10.5px] text-muted">{m.subject} · {formatDate(m.created_at, true)} {m.email && `· ${m.email}`}</p>
                  </div>
                  <Badge color={m.is_read ? '#6B7280' : '#FF6A13'}>{m.is_read ? 'خوانده شده' : 'جدید'}</Badge>
                </div>
                <p className="mt-2 rounded-lg bg-surface p-2.5 text-[12px] leading-6 text-steel-500">{m.message}</p>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => markRead(m)} className="rounded-lg bg-surface px-2.5 py-1 text-[10.5px] font-bold text-steel-500">{m.is_read ? 'علامت خوانده‌نشده' : 'علامت خوانده‌شده'}</button>
                  <Confirm text="این پیام حذف شود؟" onConfirm={() => delMsg(m.id)}>
                    <button className="rounded-lg bg-danger/10 px-2.5 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                  </Confirm>
                </div>
              </div>
            ))}
            {!messages.length && <p className="text-[12px] text-muted">پیامی ثبت نشده است.</p>}
          </div>
        )
      )}

      {tab === 'subs' && (
        <div className="admin-card overflow-x-auto p-0">
          {!subs ? <Spinner /> : (
            <table className="w-full min-w-[420px] text-right text-[12px]">
              <thead className="bg-surface text-[11px] text-muted"><tr><th className="p-3">ایمیل</th><th className="p-3">تاریخ عضویت</th><th className="p-3">عملیات</th></tr></thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-black/[.05]">
                    <td className="p-3 font-bold" dir="ltr">{s.email}</td>
                    <td className="p-3 text-[10.5px] text-muted">{formatDate(s.created_at)}</td>
                    <td className="p-3"><button onClick={() => delSub(s.id)} className="rounded-lg bg-danger/10 px-2 py-1 text-[10.5px] font-bold text-danger">حذف</button></td>
                  </tr>
                ))}
                {!subs.length && <EmptyRow colSpan={3} />}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
