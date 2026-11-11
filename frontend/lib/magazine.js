import { cache } from 'react';
import sanitizeHtml from 'sanitize-html';
import { serverGet } from './api';
import { demoPosts } from './demo';
import { editorialPosts, correctedSeedPosts } from './editorial-posts';

export const MAGAZINE_PAGE_SIZE = 6;
export const MAGAZINE_CATEGORIES = [
  { slug: 'buying-guide', label: 'راهنمای خرید', description: 'انتخاب آگاهانه سایز، مشخصات و نوع لاستیک مناسب خودرو.' },
  { slug: 'tire-care', label: 'نگهداری لاستیک', description: 'راهنمای فشار باد، تاریخ تولید و مراقبت از تایر خودرو.' },
  { slug: 'road-safety', label: 'ایمنی و سفر', description: 'نکات کاربردی ایمنی لاستیک و سفرهای جاده‌ای.' },
  { slug: 'automotive-services', label: 'خدمات خودرویی', description: 'آشنایی با خدمات خودرو و راه‌های دسترسی به امداد.' },
];

export function magazineCategory(post) {
  if (MAGAZINE_CATEGORIES.some((category) => category.slug === post?.category)) return post.category;
  const tag = String(post?.tag || '').trim();
  if (/(نگهداری|سرویس|باد|تاریخ)/.test(tag)) return 'tire-care';
  if (/(ایمنی|سفر|جاده)/.test(tag)) return 'road-safety';
  if (/(خدمات خودرو|امداد|رپورتاژ)/.test(tag)) return 'automotive-services';
  if (/(خرید|آموزش|انتخاب)/.test(tag)) return 'buying-guide';
  return null; // برچسب‌های دلخواه پنل همچنان در «همه مطالب» نمایش داده می‌شوند.
}

export const getMagazinePosts = cache(async () => {
  const response = await serverGet('/posts', null);
  // آرایه خالی API معتبر است؛ فقط در قطعی API دادهٔ نمایشی قدیمی استفاده می‌شود.
  const cmsPosts = Array.isArray(response) ? response : demoPosts;
  const merged = new Map(editorialPosts.map((post) => [post.slug, post]));
  for (const post of cmsPosts) {
    if (!post?.slug || post.is_published === false) continue;
    const builtin = merged.get(post.slug);
    const originalSeed = demoPosts.find((item) => item.slug === post.slug);
    const correction = originalSeed && post.content === originalSeed.content ? correctedSeedPosts[post.slug] : null;
    const normalized = correction ? { ...post, ...correction } : post;
    merged.set(post.slug, builtin ? {
      ...builtin, ...normalized,
      // ساختار متن و تصویر دلخواه مدیر نباید فهرست یا alt قدیمی تحریریه را به ارث ببرد.
      toc: normalized.content === builtin.content ? builtin.toc : (normalized.toc || []),
      ...(normalized.cover && normalized.cover !== builtin.cover ? { cover_fit: undefined, cover_alt: undefined } : {}),
    } : normalized);
  }
  return [...merged.values()].sort((a, b) => {
    const aTime = Date.parse(a.created_at || '') || 0;
    const bTime = Date.parse(b.created_at || '') || 0;
    return bTime - aTime;
  });
});

export function magazinePath(slug) {
  return `/blog/${encodeURIComponent(slug)}`;
}

export function pageNumber(value) {
  const str = Array.isArray(value) ? value[0] : value;
  if (!str || !/^[1-9]\d*$/.test(String(str))) return 1;
  const number = Number(str);
  return Number.isSafeInteger(number) ? number : 1;
}

export function pagePath(path, page) {
  return page > 1 ? `${path}?page=${page}` : path;
}

// محتوای HTML پنل، ورودی قابل اعتماد برای اجرای اسکریپت نیست.
export function safeArticleHtml(content) {
  return sanitizeHtml(content || '', {
    allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'blockquote', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'],
    allowedAttributes: {
      '*': ['dir'],
      h2: ['id'], h3: ['id'], h4: ['id'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      th: ['scope', 'colspan', 'rowspan'], td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => {
        if (/^https?:\/\//i.test(attributes.href || '') && attributes.target === '_blank') {
          const rel = new Set((attributes.rel || '').split(/\s+/).filter(Boolean));
          rel.add('noopener'); rel.add('noreferrer');
          return { tagName, attribs: { ...attributes, rel: [...rel].join(' ') } };
        }
        return { tagName, attribs: attributes };
      },
    },
  });
}
