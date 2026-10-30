import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Search, Package, ArrowLeft, Upload, Trash2, Eye, EyeOff, ExternalLink, ImagePlus, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { api, ApiError } from '../api';
import { Badge, Button, Card, ChipsEditor, Empty, Field, Input, Modal, PageHeader, Segmented, Select, Spinner, Textarea, Toggle, useNotify } from '../ui';
import { cn } from '../../lib/cn';
import type { Product, StoreSettings } from '../../types';

type View = 'all' | 'visible' | 'hidden' | 'low';

export const Products: React.FC = () => {
  const [params] = useSearchParams();
  const notify = useNotify();
  const [data, setData] = useState<{ products: Product[]; settings: StoreSettings } | null>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<View>((params.get('filter') as View) || 'all');
  const [edits, setEdits] = useState<Record<string, { price?: string; stock?: string }>>({});

  const load = () => api('products').then(setData).catch(e => notify(e.message, 'error'));
  useEffect(() => { load(); }, []);

  const low = (p: Product) => typeof p.stock === 'number' && p.stock <= (data?.settings.lowStockThreshold ?? 5);
  const list = useMemo(() => {
    if (!data) return [];
    const t = q.trim().toLowerCase();
    return data.products.filter(p =>
      (!t || p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t)) &&
      (category === 'all' || p.category === category) &&
      (view === 'all' || (view === 'visible' && p.active !== false) || (view === 'hidden' && p.active === false) || (view === 'low' && low(p))),
    );
  }, [data, q, category, view]);

  const quickSave = async (p: Product, patch: Partial<Product>, msg: string) => {
    try {
      const { product } = await api<{ product: Product }>(`products/${encodeURIComponent(p.id)}`, { method: 'PUT', body: { ...p, ...patch } });
      setData(d => d && { ...d, products: d.products.map(x => (x.id === p.id ? product : x)) });
      setEdits(e => { const n = { ...e }; delete n[p.id]; return n; });
      notify(msg);
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!data) return;
    const ids = data.products.map(p => p.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setData({ ...data, products: ids.map(id => data.products.find(p => p.id === id)!) });
    await api('products/reorder', { body: { ids } }).catch(e => notify(e.message, 'error'));
  };

  const categories = data ? [...new Set([...data.settings.categories, ...data.products.map(p => p.category)])] : [];
  const counts = data && {
    all: data.products.length,
    visible: data.products.filter(p => p.active !== false).length,
    hidden: data.products.filter(p => p.active === false).length,
    low: data.products.filter(low).length,
  };
  const canReorder = data && !q && category === 'all' && view === 'all';

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Change prices, stock, photos and what's visible in the shop."
        actions={<Link to="/admin/products/new" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-green-deep text-white text-sm font-semibold"><Plus size={16} /> Add product</Link>}
      />
      <Card className="p-4 space-y-3 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" className="pl-11" aria-label="Search products" />
          </div>
          <Select value={category} onChange={e => setCategory(e.target.value)} className="md:w-48" aria-label="Category">
            <option value="all">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        {counts && (
          <Segmented value={view} onChange={v => setView(v as View)} options={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'visible', label: 'In shop', count: counts.visible },
            { value: 'hidden', label: 'Hidden', count: counts.hidden },
            { value: 'low', label: 'Low stock', count: counts.low },
          ]} />
        )}
      </Card>

      <Card>
        {!data ? <Spinner /> : list.length === 0 ? (
          <Empty icon={Package} title="No products match" text="Try a different search or filter." />
        ) : (
          <ul className="divide-y divide-black/5">
            {list.map((p, i) => {
              const e = edits[p.id] ?? {};
              const dirty = e.price !== undefined || e.stock !== undefined;
              return (
                <li key={p.id} className={cn('p-4 flex flex-col sm:flex-row sm:items-center gap-4', p.active === false && 'opacity-60')}>
                  <Link to={`/admin/products/${encodeURIComponent(p.id)}`} className="flex items-center gap-4 flex-grow min-w-0">
                    <img src={p.image} alt="" className="w-14 h-14 rounded-2xl object-cover bg-brand-grey flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-semibold truncate">{p.name}</span>
                      <span className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs text-brand-ink/40">{p.category}</span>
                        {p.active === false && <Badge className="bg-brand-grey text-brand-ink/50">Hidden</Badge>}
                        {p.stock === 0 && <Badge className="bg-brand-ink text-white">Sold out</Badge>}
                        {typeof p.stock === 'number' && p.stock > 0 && low(p) && <Badge className="bg-amber-50 text-amber-800">{p.stock} left</Badge>}
                        {p.isBestSeller && <Badge className="bg-brand-green-light text-brand-green-deep">Best seller</Badge>}
                      </span>
                    </span>
                  </Link>
                  <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                    <label className="space-y-1">
                      <span className="block text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Price (R)</span>
                      <Input type="number" min={2} step="0.01" inputMode="decimal" value={e.price ?? String(p.price)} onChange={ev => setEdits(s => ({ ...s, [p.id]: { ...e, price: ev.target.value } }))} className="w-24 py-2" aria-label={`Price of ${p.name}`} />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">Stock</span>
                      <Input type="number" min={0} inputMode="numeric" placeholder="∞" value={e.stock ?? (p.stock ?? '')} onChange={ev => setEdits(s => ({ ...s, [p.id]: { ...e, stock: ev.target.value } }))} className="w-20 py-2" aria-label={`Stock of ${p.name}`} />
                    </label>
                    {dirty ? (
                      <Button size="sm" className="mb-0.5" onClick={() => quickSave(p, { price: Number(e.price ?? p.price), stock: e.stock === undefined ? p.stock : e.stock === '' ? null : Number(e.stock) }, `${p.name} updated`)}>Save</Button>
                    ) : (
                      <button
                        onClick={() => quickSave(p, { active: p.active === false }, p.active === false ? `${p.name} is now in the shop` : `${p.name} hidden from the shop`)}
                        aria-label={p.active === false ? `Show ${p.name} in shop` : `Hide ${p.name} from shop`}
                        title={p.active === false ? 'Show in shop' : 'Hide from shop'}
                        className="p-2.5 mb-0.5 rounded-full hover:bg-brand-grey text-brand-ink/50"
                      >
                        {p.active === false ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                    {canReorder && (
                      <span className="flex flex-col mb-0.5">
                        <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p.name} up`} className="p-1 rounded hover:bg-brand-grey disabled:opacity-20"><ArrowUp size={14} /></button>
                        <button onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Move ${p.name} down`} className="p-1 rounded hover:bg-brand-grey disabled:opacity-20"><ArrowDown size={14} /></button>
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <p className="text-xs text-brand-ink/40 mt-3 px-2">Leave stock empty if you don't track it. Products with stock 0 show as sold out. Use the arrows to change the order products appear in the shop.</p>
    </div>
  );
};

const blank: Product = {
  id: '', name: '', price: 0, category: '', healthGoals: [], image: '', images: [], summary: '', headline: '', hook: '',
  whyPeopleChooseIt: '', benefits: [], ingredients: [], usage: '', whoItsFor: '', isBestSeller: false, isTrending: false, active: true, stock: null,
};

export const ProductEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notify = useNotify();
  const isNew = !id;
  const [p, setP] = useState<Product | null>(isNew ? blank : null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [stockTracked, setStockTracked] = useState(false);

  useEffect(() => {
    api<{ products: Product[]; settings: StoreSettings }>('products').then(d => {
      setSettings(d.settings);
      if (!isNew) {
        const found = d.products.find(x => x.id === id);
        setP(found ?? null);
        setStockTracked(typeof found?.stock === 'number');
      } else {
        setP(prev => prev && { ...prev, category: d.settings.categories[0] ?? '' });
      }
    });
  }, [id]);

  if (!settings || p === null) {
    return p === null && settings ? <Empty icon={Package} title="Product not found" action={<Link to="/admin/products" className="text-sm font-semibold text-brand-green-deep">Back to products</Link>} /> : <Spinner />;
  }

  const set = <K extends keyof Product>(k: K, v: Product[K]) => {
    setP(prev => prev && { ...prev, [k]: v });
    if (errors[k as string]) setErrors(e => { const n = { ...e }; delete n[k as string]; return n; });
  };
  const text = (k: keyof Product) => ({ value: (p[k] as string) ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as any) });

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const body = { ...p, stock: stockTracked ? (p.stock ?? 0) : null };
      const res = await api<{ product: Product }>(isNew ? 'products' : `products/${encodeURIComponent(p.id)}`, { method: isNew ? 'POST' : 'PUT', body });
      notify(isNew ? `${res.product.name} added to the shop` : 'Changes saved. The shop updates within a minute.');
      navigate(isNew ? `/admin/products/${encodeURIComponent(res.product.id)}` : '/admin/products');
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      notify(e instanceof Error ? e.message : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api(`products/${encodeURIComponent(p.id)}`, { method: 'DELETE' });
      notify(`${p.name} deleted`);
      navigate('/admin/products');
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const categories = [...new Set([...settings.categories, p.category].filter(Boolean))];

  return (
    <div className="space-y-6 pb-24">
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink/50 hover:text-brand-ink"><ArrowLeft size={14} /> Products</Link>
      <PageHeader
        title={isNew ? 'New product' : p.name || 'Edit product'}
        actions={!isNew && <a href={`/product/${encodeURIComponent(p.id)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/10 text-xs font-semibold"><ExternalLink size={14} /> View in shop</a>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="font-semibold">Basics</h2>
            <Field label="Product name" error={errors.name}><Input {...text('name')} invalid={!!errors.name} placeholder="e.g. Sea Moss Capsules" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (R)" error={errors.price}>
                <Input type="number" min={2} step="0.01" inputMode="decimal" value={p.price || ''} onChange={e => set('price', Number(e.target.value))} invalid={!!errors.price} />
              </Field>
              <Field label="Category" hint="Edit the list in Settings">
                <Select value={p.category} onChange={e => set('category', e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Headline" hint="Short line under the name, e.g. '92 Essential Minerals for Total Body Restoration'"><Input {...text('headline')} /></Field>
            <Field label="Description"><Textarea {...text('summary')} rows={4} /></Field>
            <Field label="Hook" hint="One punchy sentence"><Input {...text('hook')} /></Field>
            <Field label="Why people choose it"><Textarea {...text('whyPeopleChooseIt')} rows={2} /></Field>
          </Card>

          <Card className="p-6 space-y-5">
            <h2 className="font-semibold">Photos</h2>
            <Field label="Main photo" error={errors.image} hint="Square photos look best. JPG, PNG or WebP under 5 MB.">
              <ImagePicker value={p.image} onChange={v => set('image', v)} />
            </Field>
            <Field label="Gallery" hint="Extra photos shown on the product page">
              <div className="flex flex-wrap gap-3">
                {(p.images ?? []).map((img, i) => (
                  <div key={img + i} className="relative">
                    <img src={img} alt="" className="w-24 h-24 rounded-2xl object-cover bg-brand-grey" />
                    <button type="button" onClick={() => set('images', (p.images ?? []).filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute -top-2 -right-2 p-1 rounded-full bg-white shadow"><X size={12} /></button>
                  </div>
                ))}
                <ImagePicker value="" compact onChange={v => v && set('images', [...(p.images ?? []), v])} />
              </div>
            </Field>
          </Card>

          <Card className="p-6 space-y-5">
            <h2 className="font-semibold">Details</h2>
            <Field label="Benefits"><ChipsEditor value={p.benefits ?? []} onChange={v => set('benefits', v)} placeholder="Add a benefit and press Enter" label="Add benefit" /></Field>
            <Field label="Ingredients"><ChipsEditor value={p.ingredients ?? []} onChange={v => set('ingredients', v)} placeholder="Add an ingredient and press Enter" label="Add ingredient" /></Field>
            <Field label="How to use"><Textarea {...text('usage')} rows={2} /></Field>
            <Field label="Who it's for"><Textarea {...text('whoItsFor')} rows={2} /></Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Visibility</h2>
            <Toggle checked={p.active !== false} onChange={v => set('active', v)} label="Show in shop" description="Hidden products stay here but customers can't see or buy them." />
            <Toggle checked={!!p.isBestSeller} onChange={v => set('isBestSeller', v)} label="Best seller" description="Shows the 'High Demand' badge and features it on the home page." />
            <Toggle checked={!!p.isTrending} onChange={v => set('isTrending', v)} label="Frequently ordered" description="Shows the 'Frequently Ordered' badge." />
          </Card>
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Stock</h2>
            <Toggle checked={stockTracked} onChange={v => { setStockTracked(v); if (v && p.stock == null) set('stock', 10); }} label="Track stock" description="Stock goes down automatically with every paid order. At 0 it shows as sold out." />
            {stockTracked && (
              <Field label="Units in stock" error={errors.stock}>
                <Input type="number" min={0} inputMode="numeric" value={p.stock ?? 0} onChange={e => set('stock', Math.max(0, Number(e.target.value)))} />
              </Field>
            )}
          </Card>
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Shop filters</h2>
            <p className="text-xs text-brand-ink/50">"Best for" goals customers can filter by.</p>
            <ChipsEditor value={p.healthGoals} onChange={v => set('healthGoals', v)} suggestions={settings.healthGoals} placeholder="Pick or type a goal" label="Add health goal" />
          </Card>
          {!isNew && (
            <Button variant="danger" className="w-full" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Delete product</Button>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-16 lg:bottom-0 inset-x-0 lg:left-64 z-30 bg-white/95 backdrop-blur border-t border-black/5 px-4 py-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate('/admin/products')}>Cancel</Button>
        <Button loading={saving} onClick={save}>{isNew ? 'Add product' : 'Save changes'}</Button>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={`Delete ${p.name}?`}
        footer={<><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep it</Button><Button variant="danger" onClick={remove}>Delete</Button></>}>
        <p className="text-sm text-brand-ink/70">This removes the product completely. If you might sell it again, switch off <strong>Show in shop</strong> instead. Past orders are not affected.</p>
      </Modal>
    </div>
  );
};

/** Upload a photo (stored in Supabase Storage) or paste an image link. */
const ImagePicker: React.FC<{ value: string; onChange: (url: string) => void; compact?: boolean }> = ({ value, onChange, compact }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const notify = useNotify();

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return notify('That photo is over 5 MB. Please use a smaller one.', 'error');
    setBusy(true);
    try {
      const { url } = await api<{ url: string }>('upload', { raw: file, query: { name: file.name } });
      onChange(url);
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const picker = <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />;

  if (compact) {
    return (
      <button type="button" onClick={() => input.current?.click()} className="w-24 h-24 rounded-2xl border-2 border-dashed border-brand-ink/15 text-brand-ink/40 hover:border-brand-green-deep hover:text-brand-green-deep flex flex-col items-center justify-center gap-1 text-[10px] font-semibold">
        {busy ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />} Add
        {picker}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-4">
      {value ? <img src={value} alt="" className="w-24 h-24 rounded-2xl object-cover bg-brand-grey" /> : <div className="w-24 h-24 rounded-2xl bg-brand-grey" />}
      <div className="space-y-2">
        <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => input.current?.click()}><Upload size={14} /> {value ? 'Replace photo' : 'Upload photo'}</Button>
        {picker}
      </div>
    </div>
  );
};

