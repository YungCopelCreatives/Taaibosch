import React, { useEffect, useState } from 'react';
import { Store, Truck, SlidersHorizontal, Megaphone, CreditCard, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { api } from '../api';
import { Button, Card, ChipsEditor, Field, Input, PageHeader, Spinner, Textarea, Toggle, useNotify } from '../ui';
import { useCatalog } from '../../CatalogContext';
import { cn } from '../../lib/cn';
import type { StoreSettings } from '../../types';

const TABS = [
  { id: 'store', label: 'Store details', icon: Store },
  { id: 'delivery', label: 'Delivery', icon: Truck },
  { id: 'filters', label: 'Shop filters', icon: SlidersHorizontal },
  { id: 'announcement', label: 'Announcement', icon: Megaphone },
  { id: 'payments', label: 'Payments', icon: CreditCard },
] as const;

export const SettingsPage: React.FC = () => {
  const notify = useNotify();
  const { reload } = useCatalog();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('store');
  const [s, setS] = useState<StoreSettings | null>(null);
  const [saved, setSaved] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { api('settings').then(d => { setS(d.settings); setSaved(JSON.stringify(d.settings)); }); }, []);
  if (!s) return <Spinner />;

  const dirty = JSON.stringify(s) !== saved;
  const set = (patch: Partial<StoreSettings>) => setS({ ...s, ...patch });

  const save = async () => {
    setSaving(true);
    try {
      const { settings } = await api('settings', { method: 'PUT', body: { settings: s } });
      setS(settings);
      setSaved(JSON.stringify(settings));
      await reload();
      notify('Settings saved. The shop is updated.');
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <PageHeader title="Settings" subtitle="Changes apply to the live shop as soon as you save." />

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-4 px-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all', tab === t.id ? 'bg-brand-green-deep text-white' : 'bg-white text-brand-ink/60 hover:text-brand-ink')}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <Card className="p-6 space-y-5 max-w-2xl">
          <Field label="WhatsApp number" hint="Used for every WhatsApp button and the EFT order option. Include +27.">
            <Input value={s.whatsappNumber} onChange={e => set({ whatsappNumber: e.target.value })} placeholder="+27645022066" />
          </Field>
          <Field label="Shop email" hint="Shown on the site, and where new-order emails are sent.">
            <Input type="email" value={s.email} onChange={e => set({ email: e.target.value })} />
          </Field>
          <Field label="Location"><Input value={s.location} onChange={e => set({ location: e.target.value })} /></Field>
        </Card>
      )}

      {tab === 'delivery' && (
        <div className="space-y-6 max-w-2xl">
          <Card className="p-6 space-y-5">
            <h2 className="font-semibold">Delivery fee</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Flat delivery fee (R)">
                <Input type="number" min={0} value={s.deliveryFee} onChange={e => set({ deliveryFee: Number(e.target.value) })} />
              </Field>
              <Field label="Free delivery from (R)" hint="0 = never free">
                <Input type="number" min={0} value={s.freeDeliveryThreshold} onChange={e => set({ freeDeliveryThreshold: Number(e.target.value) })} />
              </Field>
            </div>
          </Card>
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="font-semibold">Couriers offered at checkout</h2>
              <p className="text-xs text-brand-ink/50 mt-1">Switch off any you don't want to offer and edit the delivery times customers see.</p>
            </div>
            {s.couriers.map((c, i) => (
              <div key={c.id} className="p-4 rounded-2xl bg-brand-grey space-y-3">
                <Toggle checked={c.enabled} onChange={v => set({ couriers: s.couriers.map((x, j) => (j === i ? { ...x, enabled: v } : x)) })} label={c.id} />
                {c.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Name shown"><Input value={c.label} onChange={e => set({ couriers: s.couriers.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} className="bg-white" /></Field>
                    <Field label="Type"><Input value={c.kind} onChange={e => set({ couriers: s.couriers.map((x, j) => (j === i ? { ...x, kind: e.target.value } : x)) })} className="bg-white" /></Field>
                    <Field label="Delivery time"><Input value={c.eta} onChange={e => set({ couriers: s.couriers.map((x, j) => (j === i ? { ...x, eta: e.target.value } : x)) })} className="bg-white" /></Field>
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'filters' && (
        <div className="space-y-6 max-w-2xl">
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Categories</h2>
            <p className="text-xs text-brand-ink/50">The category list in the shop sidebar and the product editor. Order here is the order in the shop.</p>
            <ChipsEditor value={s.categories} onChange={categories => set({ categories })} placeholder="Add a category and press Enter" label="Add category" />
          </Card>
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Health goals</h2>
            <p className="text-xs text-brand-ink/50">The "Best for" filters customers can tick. Goals only show in the shop when at least one product uses them.</p>
            <ChipsEditor value={s.healthGoals} onChange={healthGoals => set({ healthGoals })} placeholder="Add a goal and press Enter" label="Add health goal" />
          </Card>
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Low-stock alert</h2>
            <Field label="Warn me when stock is at or below" hint="Shown on the Overview page for products where stock is tracked.">
              <Input type="number" min={0} value={s.lowStockThreshold} onChange={e => set({ lowStockThreshold: Number(e.target.value) })} className="w-32" />
            </Field>
          </Card>
        </div>
      )}

      {tab === 'payments' && <PaymentsPanel />}

      {tab === 'announcement' && (
        <Card className="p-6 space-y-5 max-w-2xl">
          <Toggle checked={s.announcement.enabled} onChange={enabled => set({ announcement: { ...s.announcement, enabled } })} label="Show announcement on the home page" description="A small card that slides in for a few seconds, great for promotions or delivery notices." />
          <Field label="Title"><Input value={s.announcement.title} onChange={e => set({ announcement: { ...s.announcement, title: e.target.value } })} maxLength={100} /></Field>
          <Field label="Message"><Textarea value={s.announcement.text} onChange={e => set({ announcement: { ...s.announcement, text: e.target.value } })} maxLength={300} rows={3} /></Field>
          {s.announcement.enabled && s.announcement.title && (
            <div className="p-5 rounded-3xl border border-brand-green-moss/30 bg-white shadow-lg max-w-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-green-deep flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-brand-green-deep" /> Preview</p>
              <p className="font-bold text-sm mt-2">{s.announcement.title}</p>
              <p className="text-xs text-brand-ink/60 mt-1 leading-relaxed">{s.announcement.text}</p>
            </div>
          )}
        </Card>
      )}

      <div className={cn('fixed bottom-16 lg:bottom-0 inset-x-0 lg:left-64 z-30 bg-white/95 backdrop-blur border-t border-black/5 px-4 py-3 flex items-center justify-end gap-3 transition-transform', dirty ? 'translate-y-0' : 'translate-y-[200%]')}>
        <span className="text-xs text-brand-ink/50 mr-auto">You have unsaved changes</span>
        <Button variant="ghost" onClick={() => setS(JSON.parse(saved))}>Discard</Button>
        <Button loading={saving} onClick={save}>Save settings</Button>
      </div>
    </div>
  );
};

interface PaymentsStatus {
  mode: 'test' | 'live' | 'missing';
  connected: boolean;
  connectedVia: 'hosting settings' | 'dashboard' | null;
  connectedUrl: string | null;
  webhookUrl: string;
  storage: 'supabase' | 'local';
  isLocalhost: boolean;
}

/** Yoco status + one-tap "Connect Yoco" so paid orders are confirmed automatically. */
const PaymentsPanel: React.FC = () => {
  const notify = useNotify();
  const [st, setSt] = useState<PaymentsStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shownSecret, setShownSecret] = useState('');
  const load = () => api<PaymentsStatus>('payments').then(setSt).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  if (!st) return error ? <Card className="p-6 text-sm text-red-600 max-w-2xl">{error}</Card> : <Spinner />;

  const urlChanged = st.connected && st.connectedVia === 'dashboard' && st.connectedUrl && st.connectedUrl !== st.webhookUrl;

  const connect = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api<{ secret?: string }>('payments/connect', { method: 'POST', body: {} });
      if (res.secret) setShownSecret(res.secret);
      notify('Yoco connected. Paid orders will now be confirmed automatically.');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Yoco card payments</h2>
          {st.mode === 'missing'
            ? <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-50 text-red-700">Not set up</span>
            : <span className={cn('text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full', st.mode === 'live' ? 'bg-brand-green-light text-brand-green-deep' : 'bg-amber-50 text-amber-800')}>{st.mode === 'live' ? 'Live payments' : 'Test mode'}</span>}
        </div>
        {st.mode === 'missing' && <p className="text-sm text-brand-ink/60">Add <code>YOCO_SECRET_KEY</code> to the hosting settings and restart the site. Until then, checkout asks customers to order on WhatsApp.</p>}
        {st.mode === 'test' && <p className="text-sm text-brand-ink/60">Payments use Yoco's test cards, so no real money moves. Switch to the <code>sk_live_</code> key when you're ready to sell.</p>}
      </Card>

      {st.mode !== 'missing' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            {st.connected && !urlChanged ? <CheckCircle2 className="text-brand-green-deep flex-shrink-0 mt-0.5" size={20} /> : <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />}
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Payment confirmations</h3>
              <p className="text-sm text-brand-ink/60">
                {st.connected && !urlChanged
                  ? `Connected${st.connectedVia === 'hosting settings' ? ' through the hosting settings' : ''}. Yoco tells the shop the moment an order is paid, so it shows as Paid here, stock goes down and the order emails go out.`
                  : urlChanged
                    ? `Connected to ${st.connectedUrl}, but you're now using ${new URL(st.webhookUrl).origin}. Connect again so confirmations come to this address.`
                    : 'Not connected yet. Without this, orders stay "Awaiting payment" even after the customer pays.'}
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-brand-grey text-xs break-all"><span className="text-brand-ink/50">Confirmations go to </span>{st.webhookUrl}</div>
          {st.isLocalhost && <p className="text-xs text-amber-700">Open the dashboard on the live web address (not localhost) to connect.</p>}
          {st.storage === 'local' && <p className="text-xs text-amber-700">The database isn't connected, so this connection is kept only temporarily. Connect Supabase for real orders.</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {(!st.connected || urlChanged) ? (
            <Button loading={busy} disabled={st.isLocalhost} onClick={connect}><CreditCard size={16} /> Connect Yoco</Button>
          ) : st.connectedVia === 'dashboard' ? (
            <Button variant="secondary" size="sm" loading={busy} onClick={() => confirm('Connect again? Only needed if confirmations stop arriving or you changed the web address.') && connect()}>Connect again</Button>
          ) : null}
          {shownSecret && (
            <div className="p-4 rounded-2xl bg-amber-50 text-sm space-y-2">
              <p className="font-semibold">Also save this in the hosting settings as <code>YOCO_WEBHOOK_SECRET</code></p>
              <p className="text-xs text-amber-900">Because the database isn't connected yet, keep a copy here so confirmations keep working after the site restarts. It's shown only once.</p>
              <div className="flex gap-2 items-center">
                <code className="flex-grow p-2 rounded-lg bg-white text-xs break-all">{shownSecret}</code>
                <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(shownSecret).then(() => notify('Copied'))}><Copy size={14} /> Copy</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
