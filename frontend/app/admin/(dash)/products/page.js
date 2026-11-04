'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { assetUrl, faNum, formatNumber, toman } from '@/lib/format';
import { SEASONS } from '@/lib/constants';
import { AdminPageHeader, Badge, Confirm, EmptyRow, Field, ImageUploader, Input, Modal, Pagination, Select, Spinner, Textarea, Toggle } from '@/components/admin/UI';

const EMPTY = {
  name: '', slug: '', brand_id: '', category_id: '', width: '', ratio: '', rim: '', season: 'چهارفصل',
  price: '', old_price: '', stock: '', sku: '', badge: '', country: '', made_year: '', warranty: '۱۸ ماه ضمانت اصالت',
  tread_depth: '', fuel_label: '', wet_grip: '', noise: '', weight: '', compatible_cars: '', short_desc: '', description: '',
  is_active: true, is_featured: false, images: [], specs: [],
};

const DEFAULT_SPECS = [
  { label: 'برند', value: '' }, { label: 'شاخص بار', value: '' }, { label: 'شاخص سرعت', value: '' },
];

export default function AdminProductsPage() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    adminApi(`/products?page=${page}&limit=10&q=${encodeURIComponent(q)}`).then(setData).catch((e) => setError(e.message));
  };

  useEffect(load, [page]);
  useEffect(() => {
    adminApi('/categories').then(setCats).catch(() => {});
    adminApi('/brands').then(setBrands).catch(() => {});
  }, []);

  const catOptions = useMemo(() => [{ value: '', label: 'انتخاب دسته…' }, ...cats.map((c) => ({ value: c.id, label: c.name }))], [cats]);
  const brandOptions = useMemo(() => [{ value: '', label: 'انتخاب برند…' }, ...brands.map((b) => ({ value: b.id, label: b.name_fa }))], [brands]);

  const openNew = () => {
    setForm({ ...EMPTY, specs: DEFAULT_SPECS.map((s) => ({ ...s })) });
    setEditing(null);
    setError('');
    setModal(true);
  };

  const openEdit = async (id) => {
    setError('');
    try {
      const p = await adminApi(`/products/${id}`);
      setForm({ ...EMPTY, ...p, images: (p.images || []).map((i) => i.url), specs: p.specs?.length ? p.specs : [] });
      setEditing(id);
      setModal(true);
    } catch (e) { setError(e.message); }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) await adminApi(`/products/${editing}`, { method: 'PUT', body: form });
      else await adminApi('/products', { method: 'POST', body: form });
      setModal(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try { await adminApi(`/products/${id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <AdminPageHeader title="محصولات" desc="مدیریت لاستیک‌ها، قیمت، موجودی و مشخصات فنی">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} placeholder="جست‌وجوی نام یا سایز…" className="admin-input !w-52" />
        <button onClick={load} className="btn-ghost !py-2 text-[12px]">جست‌وجو</button>
        <button onClick={openNew} className="btn-accent !py-2 text-[12px]">افزودن محصول</button>
      </AdminPageHeader>

      {error && !modal && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}

      <div className="admin-card overflow-x-auto p-0">
        {!data ? <Spinner /> : (
          <table className="w-full min-w-[820px] text-right text-[12px]">
            <thead className="bg-surface text-[11px] text-muted">
              <tr>
                <th className="p-3 font-bold">محصول</th>
                <th className="p-3 font-bold">سایز</th>
                <th className="p-3 font-bold">قیمت</th>
                <th className="p-3 font-bold">موجودی</th>
                <th className="p-3 font-bold">وضعیت</th>
                <th className="p-3 font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t border-black/[.05] hover:bg-surface/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface p-1">
                        <img src={assetUrl(p.image)} alt="" className="h-full w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-graphite-900">{p.name}</p>
                        <p className="text-[10px] text-muted">{p.brand_name} · {p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="num p-3" dir="ltr">{p.size}</td>
                  <td className="num p-3">{formatNumber(p.price)}</td>
                  <td className="num p-3">{faNum(p.stock)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge color={p.is_active ? '#16A34A' : '#6B7280'}>{p.is_active ? 'فعال' : 'غیرفعال'}</Badge>
                      {p.is_featured && <Badge color="#FF6A13">ویژه</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(p.id)} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500 hover:text-accent">ویرایش</button>
                      <Confirm text={`محصول «${p.name}» حذف شود؟`} onConfirm={() => remove(p.id)}>
                        <button className="rounded-lg bg-danger/10 px-2 py-1 text-[10.5px] font-bold text-danger">حذف</button>
                      </Confirm>
                    </div>
                  </td>
                </tr>
              ))}
              {!data.items.length && <EmptyRow colSpan={6} />}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={data?.page || 1} pages={data?.pages || 1} onPage={setPage} />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'ویرایش محصول' : 'افزودن محصول جدید'}
        wide
        footer={
          <>
            <button onClick={() => setModal(false)} className="btn-ghost !py-2 text-[12px]">انصراف</button>
            <button onClick={save} disabled={saving} className="btn-accent !py-2 text-[12px]">{saving ? 'در حال ذخیره…' : 'ذخیره محصول'}</button>
          </>
        }
      >
        {error && <p className="mb-3 rounded-xl bg-danger/10 p-3 text-[12px] text-danger">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام محصول *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="میشلن پریماسی ۴" /></Field>
          <Field label="نامک (slug)" hint="خالی بگذارید تا خودکار ساخته شود"><Input value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} dir="ltr" /></Field>
          <Field label="دسته‌بندی *"><Select options={catOptions} value={form.category_id || ''} onChange={(e) => set('category_id', e.target.value)} /></Field>
          <Field label="برند"><Select options={brandOptions} value={form.brand_id || ''} onChange={(e) => set('brand_id', e.target.value)} /></Field>
          <Field label="عرض مقطع (mm)"><Input value={form.width || ''} onChange={(e) => set('width', e.target.value)} inputMode="numeric" dir="ltr" /></Field>
          <Field label="نسبت منظر"><Input value={form.ratio || ''} onChange={(e) => set('ratio', e.target.value)} inputMode="numeric" dir="ltr" /></Field>
          <Field label="قطر رینگ (اینچ)"><Input value={form.rim || ''} onChange={(e) => set('rim', e.target.value)} inputMode="numeric" dir="ltr" /></Field>
          <Field label="سایز (نمایشی)" hint="مثال: 205/55 R16"><Input value={form.size || ''} onChange={(e) => set('size', e.target.value)} dir="ltr" /></Field>
          <Field label="فصل"><Select options={SEASONS.map((s) => ({ value: s, label: s }))} value={form.season} onChange={(e) => set('season', e.target.value)} /></Field>
          <Field label="قیمت (تومان) *"><Input value={form.price || ''} onChange={(e) => set('price', e.target.value)} inputMode="numeric" dir="ltr" /></Field>
          <Field label="قیمت قبل از تخفیف"><Input value={form.old_price || ''} onChange={(e) => set('old_price', e.target.value)} inputMode="numeric" dir="ltr" /></Field>
          <Field label="موجودی"><Input value={form.stock || ''} onChange={(e) => set('stock', e.target.value)} inputMode="numeric" dir="ltr" /></Field>
          <Field label="کد کالا (SKU)"><Input value={form.sku || ''} onChange={(e) => set('sku', e.target.value)} dir="ltr" /></Field>
          <Field label="بج (مثلاً پرفروش)"><Input value={form.badge || ''} onChange={(e) => set('badge', e.target.value)} /></Field>
          <Field label="کشور سازنده"><Input value={form.country || ''} onChange={(e) => set('country', e.target.value)} /></Field>
          <Field label="سال تولید"><Input value={form.made_year || ''} onChange={(e) => set('made_year', e.target.value)} inputMode="numeric" dir="ltr" /></Field>
          <Field label="گارانتی"><Input value={form.warranty || ''} onChange={(e) => set('warranty', e.target.value)} /></Field>
          <Field label="عمق آج"><Input value={form.tread_depth || ''} onChange={(e) => set('tread_depth', e.target.value)} /></Field>
          <Field label="برچسب مصرف سوخت"><Input value={form.fuel_label || ''} onChange={(e) => set('fuel_label', e.target.value)} dir="ltr" /></Field>
          <Field label="چسبندگی در خیس"><Input value={form.wet_grip || ''} onChange={(e) => set('wet_grip', e.target.value)} dir="ltr" /></Field>
          <Field label="صدای عبور"><Input value={form.noise || ''} onChange={(e) => set('noise', e.target.value)} /></Field>
          <Field label="وزن"><Input value={form.weight || ''} onChange={(e) => set('weight', e.target.value)} /></Field>
          <Field label="خودروهای سازگار" className="sm:col-span-2"><Input value={form.compatible_cars || ''} onChange={(e) => set('compatible_cars', e.target.value)} /></Field>
          <Field label="توضیح کوتاه" className="sm:col-span-2"><Input value={form.short_desc || ''} onChange={(e) => set('short_desc', e.target.value)} /></Field>
          <Field label="توضیحات کامل (HTML)" className="sm:col-span-2"><Textarea rows={4} value={form.description || ''} onChange={(e) => set('description', e.target.value)} dir="ltr" /></Field>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ImageUploader value={form.images} onChange={(v) => set('images', v)} label="تصاویر محصول" />
          <div>
            <span className="mb-1.5 block text-[11.5px] font-bold text-graphite-800">مشخصات اضافی</span>
            <div className="space-y-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input value={s.label} onChange={(e) => set('specs', form.specs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} placeholder="عنوان" className="!py-1.5 !text-[11px]" />
                  <Input value={s.value} onChange={(e) => set('specs', form.specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} placeholder="مقدار" className="!py-1.5 !text-[11px]" />
                  <button onClick={() => set('specs', form.specs.filter((_, k) => k !== i))} className="shrink-0 rounded-lg bg-danger/10 px-2 text-[11px] text-danger">×</button>
                </div>
              ))}
              <button onClick={() => set('specs', [...form.specs, { label: '', value: '' }])} className="rounded-lg bg-surface px-2 py-1 text-[10.5px] font-bold text-steel-500">+ افزودن مشخصه</button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-5 border-t border-black/[.06] pt-3">
          <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label="فعال" />
          <Toggle checked={form.is_featured} onChange={(v) => set('is_featured', v)} label="محصول ویژه" />
        </div>
      </Modal>
    </div>
  );
}
