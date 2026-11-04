'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { formatNumber, toman, faNum } from '@/lib/format';
import Logo from './Logo';
import { IconShield } from './Icons';

export default function MockPayment() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get('token') || '';
  const code = sp.get('order') || '';
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!code) { setError('اطلاعات پرداخت ناقص است.'); return; }
    api(`/orders/${code}`).then(setOrder).catch((e) => setError(e.message));
  }, [code]);

  const pay = async () => {
    setStatus('processing');
    await new Promise((r) => setTimeout(r, 1400));
    try {
      await api('/payments/verify', { method: 'POST', body: { token, order: code } });
      setStatus('done');
      setTimeout(() => router.push(`/order/${code}?paid=1`), 900);
    } catch (e) {
      setStatus('failed');
      setError(e.message);
    }
  };

  const cancel = async () => {
    await api('/payments/verify', { method: 'POST', body: { token, order: code, cancel: '1' } }).catch(() => {});
    router.push(`/order/${code}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0B1220] py-8">
      <div className="mx-auto w-full max-w-[520px] px-4">
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#111A2B] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1B2942]">
              <IconShield width={18} height={18} className="text-[#3FB6A8]" />
            </span>
            <div>
              <p className="text-[12px] font-bold text-white">درگاه پرداخت امن</p>
              <p className="text-[10px] text-white/40">شبیه‌سازی‌شده برای محیط نمایشی</p>
            </div>
          </div>
          <span className="rounded-lg bg-[#3FB6A8]/15 px-2 py-1 text-[10px] font-bold text-[#3FB6A8]">SSL</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="border-b border-black/[.07] bg-gradient-to-l from-[#F5F6F7] to-white px-5 py-4">
            <Logo size="sm" href={null} tagline={false} />
          </div>

          <div className="space-y-4 p-5">
            {error && status !== 'failed' && <p className="rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

            <div className="rounded-xl bg-surface p-4">
              <div className="flex justify-between text-[12px] text-steel-500"><span>کد سفارش</span><span className="num font-bold text-graphite-900">{code}</span></div>
              <div className="mt-2 flex justify-between text-[12px] text-steel-500"><span>پذیرنده</span><span className="font-bold text-graphite-900">فروشگاه لیفت تایر</span></div>
              <div className="mt-3 flex items-end justify-between border-t border-black/[.07] pt-3">
                <span className="text-[12px] text-steel-500">مبلغ قابل پرداخت</span>
                <span className="num text-[18px] font-extrabold text-graphite-900">{toman(order?.total || 0)}</span>
              </div>
            </div>

            {/* کارت شبیه‌سازی */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-[#1B2942] to-[#0B1220] p-4 text-white">
              <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-[#3FB6A8]/20 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="num text-[11px] tracking-[.3em] text-white/40">MOCK BANK</span>
                <span className="h-6 w-9 rounded bg-white/20" />
              </div>
              <p className="num mt-4 text-[15px] tracking-[.18em] text-white/85" dir="ltr">۶۲۱۹ •••• •••• ۴۸۲۱</p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-white/45">
                <span>شبیه‌سازی درگاه بانکی</span>
                <span className="num">12/29</span>
              </div>
            </div>

            {status === 'failed' && <p className="rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

            {status === 'done' ? (
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-xl bg-success/10 p-4 text-center">
                <p className="text-[13px] font-extrabold text-success">پرداخت با موفقیت انجام شد</p>
                <p className="mt-1 text-[11px] text-muted">در حال انتقال به صفحه سفارش…</p>
              </motion.div>
            ) : (
              <div className="grid gap-2">
                <button onClick={pay} disabled={status === 'processing' || !order} className="btn-accent w-full !py-3.5">
                  {status === 'processing' ? 'در حال پردازش تراکنش…' : 'پرداخت موفق'}
                </button>
                <button onClick={cancel} disabled={status === 'processing'} className="btn-ghost w-full !py-3 text-[12px]">انصراف از پرداخت</button>
              </div>
            )}

            <p className="text-center text-[10px] leading-5 text-muted">
              این صفحه یک درگاه شبیه‌سازی‌شده است و هیچ تراکنش واقعی انجام نمی‌شود.
              <br />
              امنیت اطلاعات شما در لیفت تایر با رمزنگاری {faNum('256')} بیتی تأمین می‌شود.
            </p>
          </div>
        </motion.div>
        <p className="mt-4 text-center text-[10px] text-white/25">LIFT TIRE — GRIP THE ROAD</p>
      </div>
    </div>
  );
}
