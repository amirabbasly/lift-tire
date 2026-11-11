import { SITE } from '@/lib/constants';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // صفحات حساب/سبد/سفارش قابل خزیدن‌اند تا noindex آن‌ها دیده شود؛
        // robots.txt وسیله محافظت از اطلاعات محرمانه نیست.
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
