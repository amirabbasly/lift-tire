import { Suspense } from 'react';
import AccountClient from '@/components/AccountClient';

export const metadata = { title: 'حساب کاربری' };
export const dynamic = 'force-dynamic';

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="container-x py-20 text-center text-sm text-muted">در حال بارگذاری حساب…</div>}>
      <AccountClient />
    </Suspense>
  );
}
