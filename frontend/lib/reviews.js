// نظرات نمونهٔ seed در پایگاه داده قابل ویرایش‌اند، اما نباید به عنوان تجربه واقعی نمایش داده شوند.
// این تطبیق دقیق است و داده‌ای را از پایگاه داده حذف یا تغییر نمی‌دهد.
const DEMO_REVIEWS = new Set([
  'مهدی رضایی\u0000لاستیک کاملاً اصل بود و تاریخ تولید ۱۴۰۳ داشت. بسته‌بندی و ارسال هم عالی.',
  'سارا محمدی\u0000کیفیت خوبی داره، صدای جاده کمتر شد. فقط ارسال یک روز دیرتر رسید.',
  'امیر کاظمی\u0000مشاوره سایز خیلی کمک کرد، دقیقاً مناسب پراید ۱۳۱ خریدم.',
  'نگار احمدی\u0000برای مسیرهای آفرود عالیه، گِل‌آج درست عمل می‌کنه.',
]);

export function publicReviews(reviews) {
  if (!Array.isArray(reviews)) return null;
  return reviews.filter((review) => !DEMO_REVIEWS.has(`${review.name}\u0000${review.comment}`));
}

export function reviewSummary(reviews) {
  if (!Array.isArray(reviews)) return null;
  const scores = reviews.map((review) => Number(review.rating)).filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
  return scores.length ? { count: scores.length, rating: scores.reduce((sum, rating) => sum + rating, 0) / scores.length } : null;
}
