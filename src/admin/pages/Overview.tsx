import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Star, AlertTriangle, ArrowRight, TrendingUp, Database, Mail, Truck } from 'lucide-react';
import { api, rand, shortDate } from '../api';
import { Card, Spinner, FulfilmentBadge, PaymentBadge } from '../ui';
import { useAuth, nameOf } from '../AdminApp';
import type { AdminOrder } from '../../types';

interface OverviewData {
  revenue: { today: number; week: number; month: number; last30: number };
  ordersCount: { today: number; month: number };
  averageOrder: number;
  toPack: number;
  trackingToSend: number;
  pendingReviews: number;
  lowStock: { id: string; name: string; stock: number }[];
  daily: { date: string; revenue: number; orders: number }[];
  bestSellers: { id: string; name: string; units: number; revenue: number }[];
  recent: AdminOrder[];
  storage: 'supabase' | 'local';
  emailEnabled: boolean;
}

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<OverviewData>('overview').then(setData).catch(e => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-brand-ink/50">{new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-1">{greeting()}, {nameOf(user)}.</h1>
      </div>

      {error && <Card className="p-6 text-sm text-red-600">{error}</Card>}
      {!data && !error && <Spinner />}

      {data && (
        <>
          {(data.storage === 'local' || !data.emailEnabled) && (
            <div className="space-y-2">
              {data.storage === 'local' && (
                <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 text-amber-900 text-sm">
                  <Database size={18} className="flex-shrink-0 mt-0.5" />
                  <span><strong>Test storage in use.</strong> Connect the Supabase database before launch, otherwise orders and changes are lost when the site is updated.</span>
                </div>
              )}
              {!data.emailEnabled && (
                <div className="flex gap-3 p-4 rounded-2xl bg-amber-50 text-amber-900 text-sm">
                  <Mail size={18} className="flex-shrink-0 mt-0.5" />
                  <span><strong>Order emails are off.</strong> Customers won't get receipts or tracking emails until email sending is set up.</span>
                </div>
              )}
            </div>
          )}

          {/* Action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <ActionCard to="/admin/orders?fulfilment=new&status=paid" icon={Package} count={data.toPack} label="Orders to pack" tone={data.toPack ? 'green' : 'plain'} />
            <ActionCard to="/admin/orders?fulfilment=dispatched&status=paid" icon={Truck} count={data.trackingToSend} label="Tracking links to send" tone={data.trackingToSend ? 'amber' : 'plain'} />
            <ActionCard to="/admin/reviews" icon={Star} count={data.pendingReviews} label="Reviews to approve" tone={data.pendingReviews ? 'amber' : 'plain'} />
            <ActionCard to="/admin/products?filter=low" icon={AlertTriangle} count={data.lowStock.length} label="Low or sold out" tone={data.lowStock.length ? 'red' : 'plain'} />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Today" value={rand(data.revenue.today)} sub={`${data.ordersCount.today} order${data.ordersCount.today === 1 ? '' : 's'}`} />
            <Kpi label="This week" value={rand(data.revenue.week)} />
            <Kpi label="This month" value={rand(data.revenue.month)} sub={`${data.ordersCount.month} orders`} />
            <Kpi label="Average order" value={rand(data.averageOrder)} sub="last 30 days" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2"><TrendingUp size={18} className="text-brand-green-deep" /> Sales, last 30 days</h2>
                <span className="text-sm font-semibold">{rand(data.revenue.last30)}</span>
              </div>
              <SalesChart daily={data.daily} />
            </Card>
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Best sellers</h2>
              {data.bestSellers.length === 0 ? (
                <p className="text-sm text-brand-ink/50">Sales will appear here once orders come in.</p>
              ) : (
                <ol className="space-y-3">
                  {data.bestSellers.map((b, i) => (
                    <li key={b.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-brand-green-light text-brand-green-deep text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="flex-grow truncate">{b.name}</span>
                      <span className="text-brand-ink/50">{b.units} sold</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Latest orders</h2>
              <Link to="/admin/orders" className="text-xs font-semibold text-brand-green-deep inline-flex items-center gap-1">All orders <ArrowRight size={14} /></Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="text-sm text-brand-ink/50 py-6 text-center">No orders yet. They'll show here the moment someone checks out.</p>
            ) : (
              <ul className="divide-y divide-black/5">
                {data.recent.map(o => (
                  <li key={o.ref}>
                    <Link to={`/admin/orders/${o.ref}`} className="flex items-center gap-3 py-3 hover:bg-brand-grey/50 -mx-2 px-2 rounded-xl">
                      <span className="flex-grow min-w-0">
                        <span className="block text-sm font-semibold truncate">{o.delivery.fullName}</span>
                        <span className="block text-xs text-brand-ink/40">{o.ref} · {shortDate(o.createdAt)}</span>
                      </span>
                      <span className="hidden sm:flex gap-1.5"><PaymentBadge status={o.status} />{o.status === 'paid' && <FulfilmentBadge status={o.fulfilment} />}</span>
                      <span className="text-sm font-semibold">{rand(o.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

const ActionCard: React.FC<{ to: string; icon: React.ElementType; count: number; label: string; tone: 'green' | 'amber' | 'red' | 'plain' }> = ({ to, icon: Icon, count, label, tone }) => (
  <Link
    to={to}
    className={
      'flex items-center gap-4 p-5 rounded-3xl transition-all hover:-translate-y-0.5 ' +
      (tone === 'green' ? 'bg-brand-green-deep text-white' : tone === 'amber' ? 'bg-amber-100 text-amber-900' : tone === 'red' ? 'bg-red-50 text-red-800' : 'bg-white border border-black/5')
    }
  >
    <span className={'w-11 h-11 rounded-2xl flex items-center justify-center ' + (tone === 'green' ? 'bg-white/15' : 'bg-white/70')}><Icon size={20} /></span>
    <span>
      <span className="block text-2xl font-semibold leading-none">{count}</span>
      <span className="block text-xs mt-1 opacity-80">{label}</span>
    </span>
  </Link>
);

const Kpi: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <Card className="p-5">
    <p className="text-[11px] uppercase tracking-widest font-bold text-brand-ink/40">{label}</p>
    <p className="text-xl md:text-2xl font-semibold mt-2">{value}</p>
    {sub && <p className="text-xs text-brand-ink/40 mt-1">{sub}</p>}
  </Card>
);

const SalesChart: React.FC<{ daily: OverviewData['daily'] }> = ({ daily }) => {
  const max = Math.max(1, ...daily.map(d => d.revenue));
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover !== null ? daily[hover] : null;
  return (
    <div>
      <div className="h-40 flex items-end gap-[3px]" onMouseLeave={() => setHover(null)}>
        {daily.map((d, i) => (
          <button
            key={d.date}
            type="button"
            aria-label={`${d.date}: ${rand(d.revenue)}, ${d.orders} orders`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onClick={() => setHover(i)}
            className="flex-1 h-full flex items-end group"
          >
            <span
              className={'w-full rounded-t-md transition-colors ' + (hover === i ? 'bg-brand-green-deep' : d.revenue ? 'bg-brand-green-deep/60 group-hover:bg-brand-green-deep' : 'bg-brand-ink/5')}
              style={{ height: `${d.revenue ? Math.max(6, (d.revenue / max) * 100) : 3}%` }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-brand-ink/40 mt-2 h-4">
        {shown ? (
          <span className="w-full text-center font-medium text-brand-ink">
            {new Date(shown.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}: {rand(shown.revenue)} · {shown.orders} order{shown.orders === 1 ? '' : 's'}
          </span>
        ) : (
          <>
            <span>{new Date(daily[0].date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
            <span>Today</span>
          </>
        )}
      </div>
    </div>
  );
};

