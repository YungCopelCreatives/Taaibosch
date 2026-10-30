/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ArrowRight, ArrowLeft, Truck, MapPin, Phone, User, Mail, MessageCircle,
  Lock, ShieldCheck, Loader2, Package, Store, AlertCircle, Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../CartContext';
import { PRODUCTS, COURIERS, FREE_DELIVERY_THRESHOLD, deliveryFeeFor, whatsappLink, MAX_QTY_PER_ITEM } from '../constants';
import { CheckoutResponse, Courier, DeliveryDetails, isInStock } from '../types';
import { savePendingOrder } from '../lib/pendingOrder';
import { usePageMeta } from '../lib/usePageMeta';
import { cn } from '../lib/cn';

type Step = 'cart' | 'delivery' | 'review';
const STEPS: { id: Step; label: string }[] = [
  { id: 'cart', label: 'Cart' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'review', label: 'Review & Pay' },
];

const COURIER_ICON: Record<Courier, React.ElementType> = { 'The Courier Guy': Truck, Aramex: Package, PAXI: Store };

const DETAILS_KEY = 'taaibosch_delivery';
const loadDetails = (): DeliveryDetails => {
  const blank: DeliveryDetails = { courier: 'The Courier Guy', fullName: '', contactNumber: '', email: '', trackingVia: 'whatsapp', address: '', lockerName: '', pepStore: '' };
  try {
    return { ...blank, ...JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}') };
  } catch {
    return blank;
  }
};

/** Client-side mirror of the server rules, for instant feedback. The server re-checks everything. */
function validate(d: DeliveryDetails): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = 'Enter a valid email for your receipt.';
  const digits = d.contactNumber.replace(/[\s\-()]/g, '');
  if (!/^(0\d{9}|\+?27\d{9})$/.test(digits)) e.contactNumber = 'Enter a valid SA number, e.g. 072 123 4567.';
  if (d.courier === 'The Courier Guy' && (d.address ?? '').trim().length < 10) e.address = 'Enter street, suburb, city and postal code.';
  if (d.courier === 'Aramex' && (d.lockerName ?? '').trim().length < 3) e.lockerName = 'Enter your preferred Aramex locker.';
  if (d.courier === 'PAXI' && (d.pepStore ?? '').trim().length < 3) e.pepStore = 'Enter the PEP store name or PAXI code.';
  return e;
}

const inputBase =
  'w-full pl-12 pr-4 py-4 bg-brand-grey rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-deep/40 transition-all placeholder:text-brand-ink/30';

const Field: React.FC<{
  label: string;
  icon: React.ElementType;
  error?: string;
  hint?: string;
  children: (props: { id: string; className: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => React.ReactNode;
  name: string;
}> = ({ label, icon: Icon, error, hint, children, name }) => {
  const id = `field-${name}`;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/50">{label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-[1.15rem] text-brand-ink/25 pointer-events-none" size={18} />
        {children({
          id,
          className: cn(inputBase, error && 'ring-2 ring-red-400/60 bg-red-50/40'),
          'aria-invalid': Boolean(error),
          'aria-describedby': error || hint ? `${id}-msg` : undefined,
        })}
      </div>
      {(error || hint) && (
        <p id={`${id}-msg`} className={cn('text-xs', error ? 'text-red-600' : 'text-brand-ink/40')}>{error || hint}</p>
      )}
    </div>
  );
};

export const Cart: React.FC = () => {
  usePageMeta('Your Cart', 'Review your Taaibosch Organics order and check out securely.');
  const { cart, removeFromCart, updateQuantity, cartTotal, addToCart } = useCart();
  const [step, setStep] = useState<Step>('cart');
  const [details, setDetails] = useState<DeliveryDetails>(loadDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const deliveryFee = deliveryFeeFor(cartTotal);
  const totalPayable = cartTotal + deliveryFee;
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);
  const courier = COURIERS.find(c => c.id === details.courier) ?? COURIERS[0];
  // If the saved courier has been switched off in the dashboard, fall back to the first available one.
  useEffect(() => {
    if (courier && courier.id !== details.courier) setDetails(d => ({ ...d, courier: courier.id }));
  }, [courier?.id, details.courier]);

  const upsell = useMemo(
    () => {
      const options = PRODUCTS.filter(p => isInStock(p) && !cart.some(i => i.id === p.id));
      return options.find(p => p.isBestSeller) ?? options[0];
    },
    [cart, PRODUCTS],
  );

  const update = (patch: Partial<DeliveryDetails>) => {
    const next = { ...details, ...patch };
    setDetails(next);
    if (touched) setErrors(validate(next));
  };

  const go = (s: Step) => {
    setStep(s);
    setPayError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const continueToReview = () => {
    const e = validate(details);
    setTouched(true);
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`field-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    try {
      // Remember details for next time (no payment data is ever stored).
      localStorage.setItem(DETAILS_KEY, JSON.stringify(details));
    } catch { /* ignore */ }
    go('review');
  };

  const pay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(i => ({ id: i.id, quantity: i.quantity })), delivery: details }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<CheckoutResponse> & { error?: string; fields?: Record<string, string> };
      if (!res.ok || !data.redirectUrl || !data.orderRef) {
        if (data.fields && Object.keys(data.fields).some(k => k !== 'items')) {
          setErrors(data.fields);
          setTouched(true);
          setStep('delivery');
        }
        throw new Error(data.fields?.items || data.error || 'We could not start the payment. Please try again.');
      }
      savePendingOrder({
        ref: data.orderRef,
        lines: cart.map(i => ({ id: i.id, name: i.name, image: i.image, quantity: i.quantity, lineTotal: i.price * i.quantity })),
        subtotal: cartTotal,
        deliveryFee,
        total: totalPayable,
        courier: details.courier,
        firstName: details.fullName.trim().split(' ')[0],
        email: details.email.trim(),
        phone: details.contactNumber.trim(),
        trackingVia: details.trackingVia ?? 'whatsapp',
      });
      window.location.assign(data.redirectUrl); // Yoco's secure hosted payment page
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  const whatsappOrder = () => {
    const where =
      details.courier === 'The Courier Guy' ? `Address: ${details.address}` :
      details.courier === 'Aramex' ? `Aramex locker: ${details.lockerName}` : `PEP store: ${details.pepStore}`;
    const message = [
      'Hello, I would like to place an order and pay by EFT:',
      '',
      ...cart.map(i => `- ${i.name} x${i.quantity} (R${i.price * i.quantity})`),
      '',
      `Subtotal: R${cartTotal}`,
      `Delivery: ${deliveryFee ? `R${deliveryFee}` : 'FREE'}`,
      `Total: R${totalPayable}`,
      '',
      `Delivery method: ${details.courier}`,
      `Name: ${details.fullName}`,
      `Phone: ${details.contactNumber}`,
      `Email: ${details.email}`,
      `Send tracking by: ${details.trackingVia === 'sms' ? 'SMS' : details.trackingVia === 'both' ? 'WhatsApp and SMS' : 'WhatsApp'}`,
      where,
    ].join('\n');
    window.open(whatsappLink(message), '_blank', 'noopener');
  };

  if (cart.length === 0) {
    return (
      <div className="pt-40 pb-24 px-6 text-center max-w-xl mx-auto space-y-8">
        <div className="w-24 h-24 bg-brand-green-light rounded-full flex items-center justify-center mx-auto text-brand-green-deep/40">
          <Package size={44} />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Your cart is empty</h1>
          <p className="text-brand-ink/60 leading-relaxed">Looks like you haven't added any wellness products yet.</p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center space-x-3 px-10 py-4 bg-brand-green-deep text-white rounded-full text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all"
        >
          <span>Start Shopping</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const primaryBtn =
    'w-full py-5 bg-brand-green-deep text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center space-x-3 shadow-lg shadow-brand-green-deep/20 disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className="pt-32 lg:pt-40 pb-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left column: checkout flow */}
        <div className="flex-grow min-w-0 space-y-10">
          {/* Progress */}
          <ol className="flex items-center gap-3" aria-label="Checkout progress">
            {STEPS.map((s, idx) => {
              const done = idx < stepIndex;
              const active = idx === stepIndex;
              return (
                <React.Fragment key={s.id}>
                  <li>
                    <button
                      type="button"
                      disabled={!done}
                      onClick={() => done && go(s.id)}
                      aria-current={active ? 'step' : undefined}
                      className={cn('flex items-center gap-2', active || done ? 'text-brand-green-deep' : 'text-brand-ink/25', done && 'hover:opacity-70')}
                    >
                      <span
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all',
                          active ? 'border-brand-green-deep bg-brand-green-deep text-white' : done ? 'border-brand-green-deep bg-brand-green-light' : 'border-brand-ink/15',
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-bold hidden sm:inline">{s.label}</span>
                    </button>
                  </li>
                  {idx < STEPS.length - 1 && <li aria-hidden className={cn('flex-grow max-w-16 h-0.5 rounded', done ? 'bg-brand-green-deep' : 'bg-brand-ink/10')} />}
                </React.Fragment>
              );
            })}
          </ol>

          <AnimatePresence mode="wait">
            {step === 'cart' && (
              <motion.section key="cart" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-8">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Review your cart</h1>
                <ul className="space-y-4">
                  {cart.map(item => (
                    <li key={item.id} className="flex items-center gap-4 sm:gap-6 p-4 bg-brand-grey rounded-2xl">
                      <Link to={`/product/${item.id}`} className="flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-white" />
                      </Link>
                      <div className="flex-grow min-w-0">
                        <Link to={`/product/${item.id}`} className="font-medium hover:underline block truncate">{item.name}</Link>
                        <p className="text-[10px] text-brand-ink/40 uppercase tracking-widest font-bold">{item.category}</p>
                        <p className="text-sm font-bold mt-1">R{item.price * item.quantity}</p>
                        <div className="flex items-center gap-3 mt-2 sm:hidden">
                          <QtyControl qty={item.quantity} onChange={q => updateQuantity(item.id, q)} name={item.name} max={typeof item.stock === 'number' ? Math.min(item.stock, MAX_QTY_PER_ITEM) : MAX_QTY_PER_ITEM} />
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <QtyControl qty={item.quantity} onChange={q => updateQuantity(item.id, q)} name={item.name} max={typeof item.stock === 'number' ? Math.min(item.stock, MAX_QTY_PER_ITEM) : MAX_QTY_PER_ITEM} />
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="p-3 text-brand-ink/25 hover:text-red-500 transition-all self-start sm:self-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => go('delivery')} className={primaryBtn}>
                  <span>Continue to delivery</span>
                  <ArrowRight size={18} />
                </button>
                <Link to="/shop" className="block text-center text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-green-deep">
                  Continue shopping
                </Link>
              </motion.section>
            )}

            {step === 'delivery' && (
              <motion.section key="delivery" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Delivery</h1>
                  <BackBtn onClick={() => go('cart')} />
                </div>

                <fieldset className="space-y-4">
                  <legend className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/50 mb-4">How should we send it?</legend>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {COURIERS.map(c => {
                      const Icon = COURIER_ICON[c.id];
                      const selected = details.courier === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => update({ courier: c.id })}
                          className={cn(
                            'p-5 rounded-2xl border-2 text-left transition-all flex md:flex-col items-center md:items-start gap-4',
                            selected ? 'border-brand-green-deep bg-brand-green-light' : 'border-black/5 hover:border-brand-green-deep/30',
                          )}
                        >
                          <span className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', selected ? 'bg-brand-green-deep text-white' : 'bg-brand-grey text-brand-ink/40')}>
                            <Icon size={20} />
                          </span>
                          <span>
                            <span className="block font-bold text-sm">{c.label}</span>
                            <span className="block text-[10px] text-brand-ink/50 uppercase tracking-widest font-bold mt-1">{c.kind}</span>
                            <span className="block text-xs text-brand-ink/50 mt-1">{c.eta}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="space-y-6">
                  {details.courier === 'The Courier Guy' && (
                    <Field label="Delivery address" icon={MapPin} name="address" error={errors.address}>
                      {p => (
                        <textarea {...p} rows={3} autoComplete="street-address" placeholder="Street, suburb, city, postal code"
                          className={cn(p.className, 'resize-none')} value={details.address} onChange={e => update({ address: e.target.value })} />
                      )}
                    </Field>
                  )}
                  {details.courier === 'Aramex' && (
                    <Field label="Aramex locker" icon={Package} name="lockerName" error={errors.lockerName}
                      hint="Find your nearest locker on aramex.co.za and type its name here.">
                      {p => <input {...p} type="text" placeholder="e.g. Engen Hout Bay locker" value={details.lockerName} onChange={e => update({ lockerName: e.target.value })} />}
                    </Field>
                  )}
                  {details.courier === 'PAXI' && (
                    <Field label="PEP store / PAXI code" icon={Store} name="pepStore" error={errors.pepStore}
                      hint="Use the PAXI point name or code from paxi.co.za.">
                      {p => <input {...p} type="text" placeholder="e.g. PEP Hout Bay Main Road" value={details.pepStore} onChange={e => update({ pepStore: e.target.value })} />}
                    </Field>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Full name" icon={User} name="fullName" error={errors.fullName}>
                      {p => <input {...p} type="text" autoComplete="name" placeholder="Your full name" value={details.fullName} onChange={e => update({ fullName: e.target.value })} />}
                    </Field>
                    <Field label="Mobile number" icon={Phone} name="contactNumber" error={errors.contactNumber} hint="Your tracking link is sent here once the parcel is on its way.">
                      {p => <input {...p} type="tel" inputMode="tel" autoComplete="tel" placeholder="072 123 4567" value={details.contactNumber} onChange={e => update({ contactNumber: e.target.value })} />}
                    </Field>
                  </div>
                  <fieldset className="space-y-2">
                    <legend className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/50">Send my tracking link by</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {([['whatsapp', 'WhatsApp'], ['sms', 'SMS'], ['both', 'Both']] as const).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          role="radio"
                          aria-checked={(details.trackingVia ?? 'whatsapp') === v}
                          onClick={() => update({ trackingVia: v })}
                          className={cn(
                            'py-3 rounded-2xl text-sm font-semibold border-2 transition-all',
                            (details.trackingVia ?? 'whatsapp') === v ? 'border-brand-green-deep bg-brand-green-light text-brand-green-deep' : 'border-black/5 text-brand-ink/60 hover:border-brand-green-deep/30',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-brand-ink/40">Couriers share the tracking link after collecting your parcel, so it follows a day or so after your order confirmation.</p>
                  </fieldset>
                  <Field label="Email" icon={Mail} name="email" error={errors.email} hint="We'll send your receipt and tracking here.">
                    {p => <input {...p} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={details.email} onChange={e => update({ email: e.target.value })} />}
                  </Field>
                </div>

                <button onClick={continueToReview} className={primaryBtn}>
                  <span>Review order</span>
                  <ArrowRight size={18} />
                </button>
              </motion.section>
            )}

            {step === 'review' && (
              <motion.section key="review" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Review & pay</h1>
                  <BackBtn onClick={() => go('delivery')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReviewCard title="Deliver to" onEdit={() => go('delivery')}>
                    <p className="font-medium">{details.fullName}</p>
                    <p>{details.contactNumber}</p>
                    <p>{details.email}</p>
                    <p className="text-brand-ink/40 text-xs mt-1">Tracking link by {details.trackingVia === 'sms' ? 'SMS' : details.trackingVia === 'both' ? 'WhatsApp and SMS' : 'WhatsApp'}</p>
                  </ReviewCard>
                  <ReviewCard title={courier.label} onEdit={() => go('delivery')}>
                    <p className="whitespace-pre-line">
                      {details.courier === 'The Courier Guy' ? details.address : details.courier === 'Aramex' ? details.lockerName : details.pepStore}
                    </p>
                    <p className="text-brand-ink/40 text-xs mt-1">{courier.eta} after dispatch</p>
                  </ReviewCard>
                </div>

                <div className="rounded-2xl border border-black/5 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-brand-green-light text-brand-green-deep flex items-center justify-center"><Lock size={18} /></span>
                    <div>
                      <p className="font-semibold text-sm">Secure card payment</p>
                      <p className="text-xs text-brand-ink/50">You'll be taken to Yoco's secure payment page and brought back here once paid.</p>
                    </div>
                  </div>

                  {payError && (
                    <div role="alert" className="flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                      <span>{payError}</span>
                    </div>
                  )}

                  <button onClick={pay} disabled={paying} className={primaryBtn}>
                    {paying ? <Loader2 size={20} className="animate-spin" /> : <Lock size={18} />}
                    <span>{paying ? 'Opening secure payment…' : `Pay R${totalPayable} securely`}</span>
                  </button>

                  <p className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-brand-ink/40">
                    <ShieldCheck size={14} /> Payments processed by Yoco · we never see your card details
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 rounded-2xl bg-brand-grey">
                  <p className="text-sm text-brand-ink/60">Prefer to pay by EFT? Send this order to us on WhatsApp instead.</p>
                  <button onClick={whatsappOrder} className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#25D366] text-[#128C7E] text-[10px] font-bold uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all">
                    <MessageCircle size={16} /> Order via WhatsApp
                  </button>
                </div>

                <p className="text-xs text-brand-ink/40 leading-relaxed">
                  By paying you agree to our <Link to="/terms" className="underline">Terms of Sale</Link>,{' '}
                  <Link to="/returns" className="underline">Returns & Refunds</Link> and{' '}
                  <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
                </p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: summary */}
        <aside className="lg:w-96 flex-shrink-0">
          <div className="bg-brand-grey rounded-[2rem] p-6 md:p-8 lg:sticky lg:top-32 space-y-6">
            <h2 className="text-xl font-semibold tracking-tight">Order summary</h2>

            <ul className="space-y-3">
              {cart.map(i => (
                <li key={i.id} className="flex items-center gap-3 text-sm">
                  <span className="relative flex-shrink-0">
                    <img src={i.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-white" />
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-green-deep text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{i.quantity}</span>
                  </span>
                  <span className="flex-grow min-w-0 truncate">{i.name}</span>
                  <span className="font-semibold">R{i.price * i.quantity}</span>
                </li>
              ))}
            </ul>

            {/* Free delivery progress */}
            <div className="bg-white p-4 rounded-2xl space-y-2">
              <p className="text-xs text-brand-ink/80 leading-relaxed">
                {toFreeDelivery > 0 ? (
                  <>Add <strong>R{toFreeDelivery}</strong> more for <strong>free delivery</strong> anywhere in SA.</>
                ) : (
                  <strong className="text-brand-green-deep">Your order ships free. 🎉</strong>
                )}
              </p>
              <div className="h-1.5 rounded-full bg-brand-green-light overflow-hidden">
                <div className="h-full bg-brand-green-deep rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }} />
              </div>
            </div>

            {upsell && step === 'cart' && (
              <div className="bg-white p-4 rounded-2xl flex items-center gap-3">
                <img src={upsell.image} alt="" className="w-14 h-14 rounded-xl object-cover bg-brand-grey flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green-deep">Complete your routine</p>
                  <p className="text-sm font-medium truncate">{upsell.name}</p>
                  <p className="text-xs text-brand-ink/50">R{upsell.price}</p>
                </div>
                <button onClick={() => addToCart(upsell)} aria-label={`Add ${upsell.name}`} className="p-2.5 bg-brand-green-deep text-white rounded-full hover:opacity-90 flex-shrink-0">
                  <Plus size={16} />
                </button>
              </div>
            )}

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-brand-ink/50">Subtotal</dt><dd className="font-semibold">R{cartTotal}</dd></div>
              <div className="flex justify-between">
                <dt className="text-brand-ink/50">Delivery</dt>
                <dd className={cn('font-semibold', !deliveryFee && 'text-brand-green-deep')}>{deliveryFee ? `R${deliveryFee}` : 'FREE'}</dd>
              </div>
              <div className="h-px bg-black/5" />
              <div className="flex justify-between text-lg"><dt className="font-semibold">Total</dt><dd className="font-bold">R{totalPayable}</dd></div>
            </dl>

            <p className="flex items-center justify-center gap-2 text-[10px] text-brand-ink/40 uppercase tracking-widest font-bold">
              <Lock size={12} /> Secure checkout
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const QtyControl: React.FC<{ qty: number; onChange: (q: number) => void; name: string; max?: number }> = ({ qty, onChange, name, max = MAX_QTY_PER_ITEM }) => (
  <div className="flex items-center bg-white rounded-full p-1">
    <button onClick={() => onChange(qty - 1)} disabled={qty <= 1} aria-label={`One less ${name}`} className="p-2 hover:bg-brand-grey rounded-full transition-all disabled:opacity-30">
      <Minus size={14} />
    </button>
    <span className="w-8 text-center text-xs font-bold" aria-live="polite">{qty}</span>
    <button onClick={() => onChange(qty + 1)} disabled={qty >= max} aria-label={`One more ${name}`} className="p-2 hover:bg-brand-grey rounded-full transition-all disabled:opacity-30">
      <Plus size={14} />
    </button>
  </div>
);

const BackBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-ink/40 hover:text-brand-green-deep">
    <ArrowLeft size={14} /> Back
  </button>
);

const ReviewCard: React.FC<{ title: string; onEdit: () => void; children: React.ReactNode }> = ({ title, onEdit, children }) => (
  <div className="p-5 rounded-2xl bg-brand-grey space-y-2 text-sm text-brand-ink/70">
    <div className="flex items-center justify-between">
      <p className="text-[10px] uppercase tracking-widest font-bold text-brand-ink/50">{title}</p>
      <button onClick={onEdit} aria-label={`Edit ${title}`} className="p-1 text-brand-ink/30 hover:text-brand-green-deep"><Pencil size={14} /></button>
    </div>
    {children}
  </div>
);
