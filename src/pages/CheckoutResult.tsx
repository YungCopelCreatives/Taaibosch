import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ArrowRight, MessageCircle, RotateCcw, XCircle, Loader2, Mail, Truck } from 'lucide-react';
import { useCart } from '../CartContext';
import { ALL_COURIERS as COURIERS, whatsappLink } from '../constants';
import { clearPendingOrder, readPendingOrder } from '../lib/pendingOrder';
import { usePageMeta } from '../lib/usePageMeta';
import type { OrderStatus } from '../types';

type Status = OrderStatus | 'unknown';

/** Asks the server (which hears from Yoco's webhook) whether the order is paid. */
function useOrderStatus(ref: string | null, enabled: boolean) {
  const [status, setStatus] = useState<Status | 'checking'>('checking');
  useEffect(() => {
    if (!ref || !enabled) return;
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      tries++;
      try {
        const res = await fetch(`/api/order?ref=${encodeURIComponent(ref)}`, { cache: 'no-store' });
        const data = (await res.json()) as { status?: Status };
        if (cancelled) return;
        if (data.status === 'paid' || data.status === 'unknown' || tries >= 8) {
          setStatus(data.status ?? 'unknown');
          return;
        }
      } catch {
        if (tries >= 3 && !cancelled) return setStatus('unknown');
      }
      if (!cancelled) setTimeout(poll, 1500);
    };
    poll();
    return () => { cancelled = true; };
  }, [ref, enabled]);
  return status;
}

export const CheckoutSuccess: React.FC = () => {
  usePageMeta('Order confirmed');
  const [params] = useSearchParams();
  const ref = params.get('ref');
  const { clearCart } = useCart();
  const [order] = useState(() => readPendingOrder(ref));
  const status = useOrderStatus(ref, true);

  useEffect(() => {
    clearCart();
    return () => clearPendingOrder();
  }, [clearCart]);

  const courier = COURIERS.find(c => c.id === order?.courier);
  const confirmed = status === 'paid';
  const stillPending = status === 'pending';

  return (
    <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
          className="w-24 h-24 mx-auto rounded-full bg-brand-green-deep text-white flex items-center justify-center shadow-xl shadow-brand-green-deep/25"
        >
          <Check size={44} strokeWidth={2.5} />
        </motion.div>
        <p className="text-xs uppercase tracking-[0.3em] font-bold text-brand-green-deep">Thank you{order?.firstName ? `, ${order.firstName}` : ''}</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Your order is in.</h1>
        <p className="text-brand-ink/60 leading-relaxed max-w-md mx-auto">
          {stillPending
            ? "We're just waiting for the bank to confirm your payment. This usually takes a moment – you'll get an email as soon as it's through."
            : 'Your payment was successful and we\'re preparing your order with care.'}
        </p>
        {ref && (
          <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green-light text-sm">
            Order reference <strong className="font-mono">{ref}</strong>
            {status === 'checking' && <Loader2 size={14} className="animate-spin text-brand-green-deep" />}
            {confirmed && <Check size={14} className="text-brand-green-deep" />}
          </p>
        )}
      </motion.div>

      {order && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12 bg-brand-grey rounded-[2rem] p-6 md:p-8 space-y-5">
          <ul className="space-y-3">
            {order.lines.map(l => (
              <li key={l.id} className="flex items-center gap-3 text-sm">
                <img src={l.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-white" />
                <span className="flex-grow">{l.quantity} × {l.name}</span>
                <span className="font-semibold">R{l.lineTotal}</span>
              </li>
            ))}
          </ul>
          <div className="h-px bg-black/5" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-brand-ink/50">Subtotal</dt><dd>R{order.subtotal}</dd></div>
            <div className="flex justify-between"><dt className="text-brand-ink/50">Delivery</dt><dd>{order.deliveryFee ? `R${order.deliveryFee}` : 'FREE'}</dd></div>
            <div className="flex justify-between text-base font-bold pt-1"><dt>Total paid</dt><dd>R{order.total}</dd></div>
          </dl>
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-black/5 flex gap-3">
          <Mail size={20} className="text-brand-green-deep flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-ink/60">A receipt is on its way to <strong className="text-brand-ink">{order?.email || 'your inbox'}</strong>.</p>
        </div>
        <div className="p-5 rounded-2xl border border-black/5 flex gap-3">
          <Truck size={20} className="text-brand-green-deep flex-shrink-0 mt-0.5" />
          <p className="text-sm text-brand-ink/60">
            Shipping with <strong className="text-brand-ink">{courier?.label ?? 'your chosen courier'}</strong>{courier ? ` (${courier.eta})` : ''}. Once it's collected, your tracking link comes to{' '}
            <strong className="text-brand-ink">{order?.phone || 'your phone'}</strong> by {order?.trackingVia === 'sms' ? 'SMS' : order?.trackingVia === 'both' ? 'WhatsApp and SMS' : 'WhatsApp'}.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-green-deep text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90">
          Continue shopping <ArrowRight size={16} />
        </Link>
        <a
          href={whatsappLink(`Hi Taaibosch, I've just paid for order ${ref ?? ''}. `)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-black/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-grey"
        >
          <MessageCircle size={16} /> Questions? WhatsApp us
        </a>
      </div>
    </div>
  );
};

export const CheckoutNotCompleted: React.FC<{ reason: 'cancelled' | 'failed' }> = ({ reason }) => {
  usePageMeta(reason === 'failed' ? 'Payment unsuccessful' : 'Payment cancelled');
  const [params] = useSearchParams();
  const ref = params.get('ref');
  const failed = reason === 'failed';

  return (
    <div className="pt-36 lg:pt-44 pb-24 px-6 max-w-xl mx-auto text-center space-y-8">
      <div className="w-20 h-20 mx-auto rounded-full bg-brand-grey text-brand-ink/40 flex items-center justify-center">
        <XCircle size={40} />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{failed ? "Your payment didn't go through" : 'Payment cancelled'}</h1>
        <p className="text-brand-ink/60 leading-relaxed">
          {failed
            ? 'No money has been taken. This is often a bank or card limit issue. Please try again, use a different card, or order via WhatsApp and pay by EFT.'
            : "No problem – nothing was charged and your cart is saved, so you can pick up right where you left off."}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/cart" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-green-deep text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90">
          <RotateCcw size={16} /> Back to checkout
        </Link>
        <a
          href={whatsappLink(`Hi Taaibosch, I had trouble paying online${ref ? ` (order ${ref})` : ''}. Can you help?`)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-black/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-brand-grey"
        >
          <MessageCircle size={16} /> Get help on WhatsApp
        </a>
      </div>
    </div>
  );
};
