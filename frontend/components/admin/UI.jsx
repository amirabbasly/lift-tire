'use client';

import { useState } from 'react';
import { adminUpload } from '@/lib/adminApi';
import { assetUrl, faNum } from '@/lib/format';
import { IconX } from '../Icons';

export function AdminPageHeader({ title, desc, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold text-graphite-900">{title}</h1>
        {desc && <p className="mt-1 text-[12px] text-muted">{desc}</p>}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11.5px] font-bold text-graphite-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input {...props} className={`admin-input ${props.className || ''}`} />;
}
export function Select({ options = [], ...props }) {
  return (
    <select {...props} className={`admin-input ${props.className || ''}`}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
export function Textarea(props) {
  return <textarea {...props} className={`admin-input ${props.className || ''}`} />;
}
export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-graphite-800">
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-accent' : 'bg-black/15'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'right-0.5' : 'right-4.5'}`} style={{ right: checked ? 2 : 18 }} />
      </span>
      {label}
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="hidden" />
    </label>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-graphite-900/50 p-4 backdrop-blur-sm">
      <div className={`my-6 w-full ${wide ? 'max-w-4xl' : 'max-w-xl'} rounded-2xl bg-white shadow-lift`}>
        <div className="flex items-center justify-between border-b border-black/[.07] px-5 py-3.5">
          <h3 className="text-[14px] font-extrabold text-graphite-900">{title}</h3>
          <button onClick={onClose} aria-label="بستن" className="rounded-lg p-1.5 text-muted hover:bg-surface"><IconX width={18} height={18} /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-black/[.07] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ImageUploader({ value = [], onChange, multiple = true, label = 'تصاویر' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const list = Array.isArray(value) ? value : value ? [value] : [];

  const upload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    setErr('');
    try {
      const res = await adminUpload(files);
      const urls = res.map((f) => f.url);
      onChange(multiple ? [...list, ...urls] : urls[0]);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-[11.5px] font-bold text-graphite-800">{label}</span>
      <div className="flex flex-wrap gap-2">
        {list.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-black/10 bg-surface">
            <img src={assetUrl(url)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(multiple ? list.filter((_, k) => k !== i) : '')}
              className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="حذف تصویر"
            >
              <IconX width={16} height={16} />
            </button>
          </div>
        ))}
        <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-black/15 text-[10px] font-bold text-muted transition hover:border-accent hover:text-accent">
          {busy ? '…' : '+ آپلود'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="hidden" onChange={(e) => upload([...e.target.files])} />
        </label>
      </div>
      <p className="mt-1 text-[10px] text-muted">jpg / png / webp — حداکثر ۵ مگابایت</p>
      {err && <p className="mt-1 text-[10.5px] text-danger">{err}</p>}
    </div>
  );
}

export function Badge({ children, color = '#111417', soft = true }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold"
      style={soft ? { background: `${color}15`, color } : { background: color, color: '#fff' }}
    >
      {children}
    </span>
  );
}

export function EmptyRow({ colSpan, text = 'موردی یافت نشد.' }) {
  return (
    <tr><td colSpan={colSpan} className="py-10 text-center text-[12px] text-muted">{text}</td></tr>
  );
}

export function Spinner({ label = 'در حال بارگذاری…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[12px] text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </div>
  );
}

export function Confirm({ text, onConfirm, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="تأیید حذف"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost !py-2 text-[12px]">انصراف</button>
            <button onClick={() => { onConfirm(); setOpen(false); }} className="btn !bg-danger !py-2 text-[12px] text-white">حذف</button>
          </>
        }
      >
        <p className="text-[12.5px] text-steel-500">{text}</p>
      </Modal>
    </>
  );
}

export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg border border-black/10 px-2.5 py-1 text-[11px] disabled:opacity-40">قبلی</button>
      <span className="num text-[11px] text-muted">صفحه {faNum(page)} از {faNum(pages)}</span>
      <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page >= pages} className="rounded-lg border border-black/10 px-2.5 py-1 text-[11px] disabled:opacity-40">بعدی</button>
    </div>
  );
}
