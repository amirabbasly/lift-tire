import './globals.css';
import localFont from 'next/font/local';
import { Providers } from '@/components/Providers';

const vazir = localFont({
  src: [
    { path: './fonts/vazirmatn-arabic-wght-normal.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/vazirmatn-latin-wght-normal.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-vazir',
  display: 'swap',
  preload: true,
});

const barlow = localFont({
  src: [
    { path: './fonts/barlow-condensed-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/barlow-condensed-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/barlow-condensed-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/barlow-condensed-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-barlow',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://lift-tire.com'),
  title: {
    default: 'لیفت تایر | خرید لاستیک اصل خودرو با ضمانت اصالت',
    template: '%s | لیفت تایر',
  },
  description:
    'فروشگاه اینترنتی لیفت تایر؛ خرید لاستیک اصل خودرو با ضمانت اصالت و تاریخ تولید، ارسال به سراسر ایران با باربری و پست پیشتاز و مشاوره تخصصی رایگان.',
  keywords: ['لاستیک', 'خرید لاستیک', 'لاستیک خودرو', 'لیفت تایر', 'Lift Tire'],
  applicationName: 'Lift Tire',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'لیفت تایر — لاستیک اصل، ایمنی واقعی',
    description: 'خرید لاستیک اصل با ضمانت اصالت و ارسال به سراسر ایران.',
    type: 'website',
    locale: 'fa_IR',
    images: ['/images/hero/hero-1.jpg'],
  },
};

export const viewport = {
  themeColor: '#111417',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${barlow.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
