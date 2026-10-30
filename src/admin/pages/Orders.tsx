import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Search, Download, ShoppingBag, ArrowLeft, MessageCircle, Mail, Phone, MapPin, Printer, Truck, Smartphone, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { api, rand, shortDate } from '../api';
import { Badge, Button, Card, Empty, Field, FulfilmentBadge, Input, PageHeader, PaymentBadge, Segmented, Select, Spinner, Textarea, Toggle, useNotify, FULFILMENT_LABELS } from '../ui';
import { cn } from '../../lib/cn';
import type { AdminOrder, FulfilmentStatus } from '../../types';
import { ALL_COURIERS } from '../../data/store';

interface Filters { status: string; fulfilment: string; q: string; from: string; to: string; page: number }

export const Orders: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [f, setF] = useState<Filters>({
    status: params.get('status') || 'paid',
    fulfilment: params.get('fulfilment') || 'all',
    q: params.get('q') || '',
    from: '',
    to: '',
    page: 1,
  });
  const [search, setSearch] = useState(f.q);
  const [data, setData] = useState<{ orders: AdminOrder[]; total: number; pageSize: number } | null>(null);
  const [showDates, setShowDates] = useState(false);
  const set = (patch: Partial<Filters>) => setF(prev => ({ ...prev, page: 1, ...patch }));

  useEffect(() => {
    const t = setTimeout(() => search !== f.q && set({ q: search }), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setData(null);
    api('orders', { query: { ...f } }).then(setData).catch(() => setData({ orders: [], total: 0, pageSize: 25 }));
  }, [f]);

  const exportUrl = '/api/admin/orders/export.csv?' + Object.entries(f).filter(([k, v]) => v && v !== 'all' && k !== 'page').map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filtered = f.fulfilment !== 'all' || f.from || f.to || f.q;

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={data ? `${data.total} order${data.total === 1 ? '' : 's'}` : ' '}
        actions={<a href={exportUrl} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/10 text-xs font-semibold hover:bg-brand-grey"><Download size={14} /> Export CSV</a>}
      />

      <Card className="p-4 space-y-3 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone or order ref" className="pl-11" aria-label="Search orders" />
          </div>
          <Select value={f.fulfilment} onChange={e => set({ fulfilment: e.target.value })} className="md:w-48" aria-label="Fulfilment status">
            <option value="all">Any fulfilment</option>
            {Object.entries(FULFILMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Button variant="secondary" onClick={() => setShowDates(s => !s)} className={cn(showDates && 'bg-brand-grey')}><Filter size={14} /> Dates</Button>
        </div>
        {showDates && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From"><Input type="date" value={f.from} onChange={e => set({ from: e.target.value })} /></Field>
            <Field label="To"><Input type="date" value={f.to} onChange={e => set({ to: e.target.value })} /></Field>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <Segmented
            value={f.status}
            onChange={status => set({ status })}
            options={[{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Unpaid' }, { value: 'all', label: 'All' }]}
          />
          {filtered && (
            <button onClick={() => { setSearch(''); set({ fulfilment: 'all', from: '', to: '', q: '' }); }} className="text-xs font-semibold text-brand-ink/50 hover:text-brand-ink inline-flex items-center gap-1">
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      </Card>

      <Card>
        {!data ? <Spinner /> : data.orders.length === 0 ? (
          <Empty icon={ShoppingBag} title={filtered ? 'No orders match these filters' : 'No orders yet'} text={f.status === 'paid' && !filtered ? 'Paid orders appear here as soon as Yoco confirms the payment.' : undefined} />
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-brand-ink/40">
                  <th className="px-6 py-4 font-bold">Order</th>
                  <th className="px-3 py-4 font-bold">Customer</th>
                  <th className="px-3 py-4 font-bold">Delivery</th>
                  <th className="px-3 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.orders.map(o => (
                  <tr key={o.ref} onClick={() => navigate(`/admin/orders/${o.ref}`)} className="cursor-pointer hover:bg-brand-grey/50">
                    <td className="px-6 py-4">
                      <Link to={`/admin/orders/${o.ref}`} className="font-semibold hover:underline" onClick={e => e.stopPropagation()}>{o.ref}</Link>
                      <p className="text-xs text-brand-ink/40">{shortDate(o.createdAt)}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-medium">{o.delivery.fullName}</p>
                      <p className="text-xs text-brand-ink/40">{o.lines.reduce((s, l) => s + l.quantity, 0)} item(s)</p>
                    </td>
                    <td className="px-3 py-4 text-brand-ink/60">{o.delivery.courier}</td>
                    <td className="px-3 py-4"><div className="flex flex-wrap gap-1.5"><PaymentBadge status={o.status} />{o.status === 'paid' && <FulfilmentBadge status={o.fulfilment} />}<TrackingFlag o={o} /></div></td>
                    <td className="px-6 py-4 text-right font-semibold">{rand(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-black/5">
              {data.orders.map(o => (
                <li key={o.ref}>
                  <Link to={`/admin/orders/${o.ref}`} className="block p-4 space-y-2">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold truncate">{o.delivery.fullName}</span>
                      <span className="font-semibold">{rand(o.total)}</span>
                    </div>
                    <p className="text-xs text-brand-ink/40">{o.ref} · {shortDate(o.createdAt)} · {o.delivery.courier}</p>
                    <div className="flex flex-wrap gap-1.5"><PaymentBadge status={o.status} />{o.status === 'paid' && <FulfilmentBadge status={o.fulfilment} />}<TrackingFlag o={o} /></div>
                  </Link>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-black/5 text-sm">
                <Button variant="ghost" size="sm" disabled={f.page <= 1} onClick={() => setF(p => ({ ...p, page: p.page - 1 }))}><ChevronLeft size={14} /> Previous</Button>
                <span className="text-brand-ink/50">Page {f.page} of {pages}</span>
                <Button variant="ghost" size="sm" disabled={f.page >= pages} onClick={() => setF(p => ({ ...p, page: p.page + 1 }))}>Next <ChevronRight size={14} /></Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

const STEPS: FulfilmentStatus[] = ['new', 'packing', 'dispatched', 'delivered'];
const CHANNEL_LABEL = { whatsapp: 'WhatsApp', sms: 'SMS', both: 'WhatsApp and SMS' } as const;

/** Dispatched orders whose tracking link hasn't gone to the customer yet. */
const TrackingFlag: React.FC<{ o: AdminOrder }> = ({ o }) =>
  o.status === 'paid' && o.fulfilment === 'dispatched' && !o.trackingSentAt ? <Badge className="bg-amber-50 text-amber-800">Send tracking</Badge> : null;

export const OrderDetail: React.FC = () => {
  const { ref = '' } = useParams<{ ref: string }>();
  const notify = useNotify();
  const [order, setOrder] = useState<AdminOrder | null | undefined>(undefined);
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ order: AdminOrder }>(`orders/${encodeURIComponent(ref)}`)
      .then(({ order }) => { setOrder(order); setTracking(order.trackingNumber ?? ''); setNotes(order.adminNotes ?? ''); })
      .catch(() => setOrder(null));
  }, [ref]);
  useEffect(load, [load]);

  if (order === undefined) return <Spinner />;
  if (order === null) return <Empty icon={ShoppingBag} title="Order not found" action={<Link to="/admin/orders" className="text-sm font-semibold text-brand-green-deep">Back to orders</Link>} />;

  const save = async (patch: Partial<AdminOrder> & { notifyCustomer?: boolean; sendTrackingEmail?: boolean }, label: string) => {
    setSaving(label);
    try {
      const res = await api<{ order: AdminOrder; emailed: boolean }>(`orders/${encodeURIComponent(order.ref)}`, { method: 'PATCH', body: patch });
      setOrder(res.order);
      notify(label.startsWith('sent-') ? `Marked as sent by ${patch.trackingSentVia}` : label === 'email' ? (res.emailed ? 'Tracking emailed to the customer' : 'Saved. Email sending is not set up yet.') : res.emailed ? 'Saved. Customer emailed that it is on its way.' : 'Saved.');
    } catch (e: any) {
      notify(e.message, 'error');
    } finally {
      setSaving(null);
    }
  };

  const courier = ALL_COURIERS.find(c => c.id === order.delivery.courier);
  const where = order.delivery.address || order.delivery.lockerName || order.delivery.pepStore;
  const phoneDigits = order.delivery.contactNumber.replace(/[^\d]/g, '');
  const stepIndex = STEPS.indexOf(order.fulfilment);
  const isLink = /^https?:\/\//i.test(tracking.trim());
  const trackingMessage = [
    `Hi ${order.delivery.fullName.split(' ')[0]}, your Taaibosch Organics order ${order.ref} is on its way with ${courier?.label ?? order.delivery.courier} 🌿`,
    isLink ? `Track it here: ${tracking.trim()}` : `Tracking number: ${tracking.trim()}`,
    courier?.eta ? `Expected delivery: ${courier.eta}.` : '',
    'Any questions, just reply to this message.',
  ].filter(Boolean).join('\n');

  return (
    <div className="space-y-6 print:space-y-4">
      <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink/50 hover:text-brand-ink print:hidden"><ArrowLeft size={14} /> Orders</Link>
      <PageHeader
        title={`Order ${order.ref}`}
        subtitle={`Placed ${shortDate(order.createdAt)}${order.paidAt ? ` · paid ${shortDate(order.paidAt)}` : ''}`}
        actions={<><PaymentBadge status={order.status} />{order.status === 'paid' && <FulfilmentBadge status={order.fulfilment} />}<Button variant="secondary" size="sm" onClick={() => window.print()} className="print:hidden"><Printer size={14} /> Packing slip</Button></>}
      />

      {order.status !== 'paid' && (
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 text-sm print:hidden">
          This order has <strong>not been paid</strong>. The customer started checkout but didn't complete payment. Don't pack it unless they pay by EFT.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Items</h2>
            <ul className="divide-y divide-black/5">
              {order.lines.map(l => (
                <li key={l.id} className="flex items-center justify-between py-3 text-sm gap-3">
                  <span><span className="inline-flex w-7 h-7 rounded-lg bg-brand-green-light text-brand-green-deep font-bold items-center justify-center mr-3">{l.quantity}</span>{l.name}</span>
                  <span className="text-brand-ink/50 whitespace-nowrap">{l.quantity} × {rand(l.unitPrice)} = <strong className="text-brand-ink">{rand(l.lineTotal)}</strong></span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-black/5 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-brand-ink/50">Subtotal</dt><dd>{rand(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-brand-ink/50">Delivery</dt><dd>{order.deliveryFee ? rand(order.deliveryFee) : 'FREE'}</dd></div>
              <div className="flex justify-between text-base font-semibold pt-1"><dt>Total</dt><dd>{rand(order.total)}</dd></div>
            </dl>
          </Card>

          {order.status === 'paid' && (
            <Card className="p-6 space-y-5 print:hidden">
              <h2 className="font-semibold">Fulfilment</h2>
              <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STEPS.map((s, i) => (
                  <li key={s}>
                    <button
                      type="button"
                      disabled={!!saving}
                      onClick={() => save({ fulfilment: s, trackingNumber: tracking, notifyCustomer }, s)}
                      className={cn(
                        'w-full rounded-2xl px-2 py-3 text-xs font-semibold border-2 transition-all',
                        i <= stepIndex && order.fulfilment !== 'cancelled' ? 'border-brand-green-deep bg-brand-green-deep text-white' : 'border-black/5 text-brand-ink/50 hover:border-brand-green-deep/40',
                      )}
                    >
                      {saving === s ? '…' : FULFILMENT_LABELS[s]}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="space-y-4 pt-5 border-t border-black/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-md">
                    <h3 className="font-semibold text-sm">Tracking link</h3>
                    <p className="text-xs text-brand-ink/50 mt-1">{courier?.label ?? order.delivery.courier} sends the link once the parcel has been collected. Paste it here, then send it to the customer.</p>
                  </div>
                  {order.trackingSentAt
                    ? <Badge className="bg-brand-green-light text-brand-green-deep">Sent by {order.trackingSentVia} · {shortDate(order.trackingSentAt)}</Badge>
                    : order.fulfilment === 'dispatched' ? <Badge className="bg-amber-50 text-amber-800">Not sent yet</Badge> : null}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Truck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/30" />
                    <Input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Paste the tracking link or waybill number" className="pl-11" aria-label="Tracking link or waybill number" />
                  </div>
                  <Button variant="secondary" loading={saving === 'tracking'} disabled={tracking === (order.trackingNumber ?? '')} onClick={() => save({ trackingNumber: tracking }, 'tracking')}>Save</Button>
                </div>
                <p className="text-xs text-brand-ink/60">
                  Customer asked for <strong>{CHANNEL_LABEL[order.delivery.trackingVia ?? 'whatsapp']}</strong> on <strong>{order.delivery.contactNumber}</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['whatsapp', 'sms'] as const).map(ch => {
                    const preferred = order.delivery.trackingVia === ch || order.delivery.trackingVia === 'both' || (!order.delivery.trackingVia && ch === 'whatsapp');
                    const href = ch === 'whatsapp'
                      ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(trackingMessage)}`
                      : `sms:${order.delivery.contactNumber}?body=${encodeURIComponent(trackingMessage)}`;
                    return (
                      <a
                        key={ch}
                        href={tracking ? href : undefined}
                        target={ch === 'whatsapp' ? '_blank' : undefined}
                        rel="noreferrer"
                        aria-disabled={!tracking}
                        onClick={e => { if (!tracking) { e.preventDefault(); return; } save({ trackingNumber: tracking, trackingSentVia: ch === 'whatsapp' ? 'WhatsApp' : 'SMS' }, 'sent-' + ch); }}
                        className={cn(
                          'flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all',
                          !tracking && 'opacity-40 pointer-events-none',
                          ch === 'whatsapp' ? (preferred ? 'bg-[#25D366] text-white' : 'border border-[#25D366] text-[#128C7E]') : (preferred ? 'bg-brand-green-deep text-white' : 'border border-black/10 text-brand-ink'),
                        )}
                      >
                        {ch === 'whatsapp' ? <MessageCircle size={16} /> : <Smartphone size={16} />} {ch === 'whatsapp' ? 'Send on WhatsApp' : 'Send by SMS'}
                      </a>
                    );
                  })}
                  <Button variant="secondary" disabled={!tracking} loading={saving === 'email'} onClick={() => save({ trackingNumber: tracking, sendTrackingEmail: true }, 'email')}>
                    <Mail size={14} /> Email it
                  </Button>
                </div>
                <p className="text-[11px] text-brand-ink/40">WhatsApp and SMS open on this phone with the message ready, so you can check it before sending. The order is marked as sent when you tap.</p>
              </div>
              <Toggle checked={notifyCustomer} onChange={setNotifyCustomer} label="Email the customer when marked Dispatched" description="Lets them know it's on its way. The tracking link is sent separately once you have it." />
              {order.fulfilment !== 'cancelled' ? (
                <button onClick={() => confirm('Mark this order as cancelled? Remember to refund the customer in the Yoco portal.') && save({ fulfilment: 'cancelled' }, 'cancel')} className="text-xs font-semibold text-red-600 hover:underline">
                  Cancel order
                </button>
              ) : (
                <p className="text-xs text-brand-ink/50">This order is cancelled. Refunds are done in the Yoco portal.</p>
              )}
            </Card>
          )}

          <Card className="p-6 space-y-3 print:hidden">
            <h2 className="font-semibold">Team notes</h2>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Only visible to the team, e.g. 'customer asked for gift wrap'" />
            <div className="flex justify-end"><Button variant="secondary" size="sm" loading={saving === 'notes'} onClick={() => save({ adminNotes: notes }, 'notes')}>Save note</Button></div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Customer</h2>
            <p className="font-medium">{order.delivery.fullName}</p>
            <div className="space-y-2 text-sm">
              <a href={`tel:${order.delivery.contactNumber}`} className="flex items-center gap-2 text-brand-ink/70 hover:text-brand-ink"><Phone size={14} /> {order.delivery.contactNumber}</a>
              <a href={`mailto:${order.delivery.email}?subject=Your Taaibosch order ${order.ref}`} className="flex items-center gap-2 text-brand-ink/70 hover:text-brand-ink break-all"><Mail size={14} /> {order.delivery.email}</a>
            </div>
            <a
              href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hi ${order.delivery.fullName.split(' ')[0]}, this is Taaibosch Organics about your order ${order.ref}. `)}`}
              target="_blank"
              rel="noreferrer"
              className="print:hidden flex items-center justify-center gap-2 w-full py-3 rounded-full bg-[#25D366] text-white text-xs font-bold uppercase tracking-widest"
            >
              <MessageCircle size={16} /> WhatsApp customer
            </a>
          </Card>
          <Card className="p-6 space-y-3">
            <h2 className="font-semibold">Delivery</h2>
            <p className="text-sm font-medium">{courier?.label ?? order.delivery.courier} <span className="text-brand-ink/40 font-normal">· {courier?.kind}</span></p>
            <p className="text-sm text-brand-ink/70 flex gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0" /> <span className="whitespace-pre-line">{where}</span></p>
            {order.trackingNumber && (
              <p className="text-sm break-all"><span className="text-brand-ink/50">Tracking:</span>{' '}
                {/^https?:\/\//i.test(order.trackingNumber) ? <a href={order.trackingNumber} target="_blank" rel="noreferrer" className="font-semibold text-brand-green-deep underline">Open tracking link</a> : <strong>{order.trackingNumber}</strong>}
              </p>
            )}
            <p className="text-xs text-brand-ink/50">Tracking by {CHANNEL_LABEL[order.delivery.trackingVia ?? 'whatsapp']}</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
