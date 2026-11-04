'use client';

import { API_BASE } from './format.js';

export function getAdminToken() {
  try { return localStorage.getItem('lift-admin-token') || ''; } catch { return ''; }
}
export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem('lift-admin-token', token);
    else localStorage.removeItem('lift-admin-token');
  } catch {}
}

export async function adminApi(path, { method = 'GET', body } = {}) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (res.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
      window.location.href = '/admin/login';
    }
    throw new Error(data?.error || 'نشست شما منقضی شده است.');
  }
  if (!res.ok) throw new Error(data?.error || 'خطا در انجام عملیات.');
  return data;
}

export async function adminUpload(files) {
  const token = getAdminToken();
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const res = await fetch(`${API_BASE}/api/admin/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'آپلود تصویر انجام نشد.');
  return data.files;
}
