export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lift-tire.com';

export const SITE = {
  url: SITE_URL,
  name: 'لیفت تایر',
  nameEn: 'LIFT TIRE',
  tagline: 'لاستیک اصل، ایمنی واقعی',
  taglineEn: 'GRIP THE ROAD',
  phone: '۰۲۱-۹۱۰۰۱۲۳۴',
  phoneRaw: '02191001234',
  mobile: '۰۹۱۲-۱۲۳-۴۵۶۷',
};

export const NAV = [
  { href: '/', label: 'خانه' },
  { href: '/products', label: 'فروشگاه' },
  { href: '/category/passenger', label: 'لاستیک سواری' },
  { href: '/category/offroad', label: 'آفرود' },
  { href: '/category/truck', label: 'باری' },
  { href: '/blog', label: 'مجله' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس' },
];

export const SEASONS = ['تابستانی', 'زمستانی', 'چهارفصل', 'آفرود'];

export const SORTS = [
  { id: 'newest', label: 'جدیدترین' },
  { id: 'cheapest', label: 'ارزان‌ترین' },
  { id: 'expensive', label: 'گران‌ترین' },
  { id: 'bestseller', label: 'پرفروش‌ترین' },
  { id: 'popular', label: 'محبوب‌ترین' },
  { id: 'discount', label: 'بیشترین تخفیف' },
];

export const ORDER_STATUS = {
  pending_payment: { label: 'در انتظار پرداخت', color: '#F59E0B', step: 0 },
  paid: { label: 'پرداخت شده', color: '#16A34A', step: 1 },
  processing: { label: 'در حال پردازش', color: '#FF6A13', step: 2 },
  shipped: { label: 'ارسال شده', color: '#2563EB', step: 3 },
  delivered: { label: 'تحویل شده', color: '#16A34A', step: 4 },
  cancelled: { label: 'لغو شده', color: '#DC2626', step: -1 },
};

export const ORDER_TIMELINE = ['ثبت سفارش', 'پرداخت', 'آماده‌سازی', 'ارسال', 'تحویل'];

export const SHIPPING_FALLBACK = [
  { id: 'freight', title: 'باربری (سراسر ایران)', cost: 180000, days: '۳ تا ۵ روز کاری' },
  { id: 'post', title: 'پست پیشتاز', cost: 95000, days: '۲ تا ۴ روز کاری' },
  { id: 'courier', title: 'پیک تهران', cost: 120000, days: 'همان روز' },
];

export const TRUST = [
  { title: 'ارسال به سراسر ایران', desc: 'باربری و پست پیشتاز', icon: '/images/icons/service-shipping.png' },
  { title: 'ضمانت اصالت و تاریخ تولید', desc: 'گارانتی کتبی اصالت', icon: '/images/icons/service-authentic.png' },
  { title: 'پرداخت امن', desc: 'درگاه بانکی و پرداخت در محل', icon: '/images/icons/service-payment.png' },
  { title: 'مشاوره تخصصی لاستیک', desc: 'کارشناس رایگان سایز و برند', icon: '/images/icons/service-consult.png' },
  { title: '۷ روز ضمانت بازگشت', desc: 'بدون قید و شرط', icon: '/images/icons/service-return.png' },
];

export const SOCIAL = [
  { id: 'instagram', title: 'اینستاگرام', url: 'https://instagram.com/lifttire', icon: '/images/social/instagram.png' },
  { id: 'telegram', title: 'تلگرام', url: 'https://t.me/lifttire', icon: '/images/social/telegram.png' },
  { id: 'whatsapp', title: 'واتساپ', url: 'https://wa.me/989121234567', icon: '/images/social/whatsapp.png' },
];

export const MOBILE_NAV = [
  { href: '/', label: 'خانه', icon: '/images/icons/nav-home.png' },
  { href: '/products', label: 'فروشگاه', icon: '/images/icons/nav-shop.png' },
  { href: '/cart', label: 'سبد خرید', icon: '/images/icons/nav-cart.png' },
  { href: '/account', label: 'حساب من', icon: '/images/icons/nav-user.png' },
];

export const ANNOUNCEMENTS = [
  'ارسال به سراسر ایران با باربری و پست پیشتاز',
  'ضمانت اصالت و تاریخ تولید روی همه لاستیک‌ها',
  'کد تخفیف LIFT10 برای اولین خرید شما',
  'مشاوره تخصصی رایگان انتخاب سایز لاستیک',
];
