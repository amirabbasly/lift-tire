import { Suspense } from 'react';
import MockPayment from '@/components/MockPayment';

export const metadata = { title: 'درگاه پرداخت', robots: { index: false, follow: true } };
export const dynamic = 'force-dynamic';

export default function PaymentMockPage() {
  return (
    <Suspense fallback={<div className="container-x py-20 text-center text-sm text-muted">در حال اتصال به درگاه…</div>}>
      <MockPayment />
    </Suspense>
  );
}
