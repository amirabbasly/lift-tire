import { SITE } from './constants';

export function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path || '/', `${SITE.url}/`).toString();
}

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };
}

export function validIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function articleSchema(post) {
  const path = `/blog/${encodeURIComponent(post.slug)}`;
  return {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) },
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.cover ? [absoluteUrl(post.cover)] : undefined,
    datePublished: validIsoDate(post.created_at),
    dateModified: validIsoDate(post.updated_at),
    author: { '@type': 'Organization', name: post.author || 'تحریریه لیفت تایر' },
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'fa-IR',
    articleSection: post.tag || undefined,
  };
}
