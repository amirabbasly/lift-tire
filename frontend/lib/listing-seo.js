export function listingPage(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!/^[1-9]\d*$/.test(String(raw || ''))) return 1;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : 1;
}

// صفحه‌های واقعی، canonical مستقل دارند؛ فیلترهای دلخواه noindex می‌مانند.
export function listingSeo(path, query = {}) {
  const page = listingPage(query?.page);
  const filters = Object.entries(query || {}).filter(([key, value]) => key !== 'page' && value !== undefined && value !== '');
  const canonicalQuery = new URLSearchParams();
  if (page > 1) canonicalQuery.set('page', String(page));
  for (const [key, value] of filters.sort(([a], [b]) => a.localeCompare(b))) canonicalQuery.set(key, String(value));
  return { page, filtered: filters.length > 0, canonical: `${path}${canonicalQuery.size ? `?${canonicalQuery}` : ''}` };
}

export function listingApiQuery(query = {}) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === '') continue;
    result.set(key, key === 'page' ? String(listingPage(value)) : String(value));
  }
  result.set('limit', '12');
  return result;
}
