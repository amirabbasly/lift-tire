import PageHeader from '@/components/PageHeader';
import TrackClient from '@/components/TrackClient';

export const metadata = { title: 'پیگیری سفارش', robots: { index: false, follow: true } };

export default function TrackPage() {
  return (
    <>
      <PageHeader title="پیگیری سفارش" subtitle="کد سفارش و شماره موبایل ثبت‌شده را وارد کنید." breadcrumbs={[{ label: 'پیگیری سفارش' }]} />
      <div className="container-x py-8">
        <TrackClient />
      </div>
    </>
  );
}
