import { API_BASE } from './format.js';

const INTERNAL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:4000';

/** درخواست سمت مرورگر — از طریق پروکسی هم‌مبدأ */
export async function api(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const err = new Error(data?.error || 'خطا در ارتباط با سرور');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** درخواست سمت سرور با fallback — هرگز صفحه سفید نمی‌دهد */
export async function serverGet(path, fallback = null) {
  try {
    const res = await fetch(`${INTERNAL}/api${path}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function uploadFiles(files, token) {
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const res = await fetch(`${API_BASE}/api/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'آپلود تصویر انجام نشد.');
  return data.files;
}
