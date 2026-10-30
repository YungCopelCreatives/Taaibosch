/**
 * Server-side order building. Every order is re-priced from the catalogue here,
 * so a tampered cart in the browser can never change what the customer is charged.
 */

import { MAX_QTY_PER_ITEM, deliveryFeeFor } from '../src/data/store';
import { isInStock } from '../src/types';
import type { Catalog, CheckoutRequest, Courier, DeliveryDetails, OrderLine } from '../src/types';

export interface Order {
  ref: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  delivery: DeliveryDetails;
  createdAt: string;
}

export class OrderValidationError extends Error {
  constructor(public readonly fields: Record<string, string>) {
    super('Please check your order details.');
  }
}

const clean = (v: unknown, max = 200) =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

/** Accepts 0XX XXX XXXX or +27 XX XXX XXXX (spaces/dashes allowed). Returns +27 format. */
export function normaliseSaPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-()]/g, '');
  if (/^0\d{9}$/.test(digits)) return `+27${digits.slice(1)}`;
  if (/^\+27\d{9}$/.test(digits)) return digits;
  if (/^27\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

export function makeOrderRef(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TBO-${d}-${rand}`;
}

export function buildOrder(body: unknown, catalog: Catalog): Order {
  const req = (body ?? {}) as Partial<CheckoutRequest>;
  const errors: Record<string, string> = {};

  // ---- Items: look up every product server-side and merge duplicates
  const qtyById = new Map<string, number>();
  for (const item of Array.isArray(req.items) ? req.items : []) {
    const id = clean(item?.id, 40);
    const qty = Math.floor(Number(item?.quantity));
    if (!id || !Number.isFinite(qty) || qty < 1) continue;
    qtyById.set(id, Math.min(MAX_QTY_PER_ITEM, (qtyById.get(id) ?? 0) + qty));
  }

  const lines: OrderLine[] = [];
  for (const [id, quantity] of qtyById) {
    const product = catalog.products.find(p => p.id === id && p.active !== false);
    if (!product) {
      errors.items = 'One of the products in your cart is no longer available. Please refresh your cart.';
      continue;
    }
    if (!isInStock(product) || (typeof product.stock === 'number' && product.stock < quantity)) {
      errors.items = typeof product.stock === 'number' && product.stock > 0
        ? `Only ${product.stock} × ${product.name} left in stock. Please update your cart.`
        : `${product.name} has just sold out. Please remove it from your cart.`;
      continue;
    }
    lines.push({ id, name: product.name, unitPrice: product.price, quantity, lineTotal: product.price * quantity });
  }
  if (lines.length === 0 && !errors.items) errors.items = 'Your cart is empty.';

  // ---- Customer & delivery
  const d = (req.delivery ?? {}) as Partial<DeliveryDetails>;
  const courier = clean(d.courier, 40) as Courier;
  const fullName = clean(d.fullName, 80);
  const email = clean(d.email, 120).toLowerCase();
  const phone = normaliseSaPhone(clean(d.contactNumber, 20));

  if (!catalog.settings.couriers.some(c => c.enabled && c.id === courier)) errors.courier = 'Choose a delivery method.';
  if (fullName.length < 2) errors.fullName = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address for your receipt.';
  if (!phone) errors.contactNumber = 'Enter a valid South African number, e.g. 072 123 4567.';

  const trackingVia = (['whatsapp', 'sms', 'both'] as const).find(v => v === d.trackingVia) ?? 'whatsapp';
  const delivery: DeliveryDetails = { courier, fullName, email, contactNumber: phone ?? '', trackingVia };
  if (courier === 'The Courier Guy') {
    delivery.address = clean(d.address, 300);
    if (delivery.address.length < 10) errors.address = 'Enter your full street address, suburb, city and postal code.';
  } else if (courier === 'Aramex') {
    delivery.lockerName = clean(d.lockerName, 120);
    if (delivery.lockerName.length < 3) errors.lockerName = 'Enter the Aramex locker you want to collect from.';
  } else if (courier === 'PAXI') {
    delivery.pepStore = clean(d.pepStore, 120);
    if (delivery.pepStore.length < 3) errors.pepStore = 'Enter the PEP store name or PAXI code.';
  }

  if (Object.keys(errors).length) throw new OrderValidationError(errors);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const deliveryFee = deliveryFeeFor(subtotal, catalog.settings);
  return {
    ref: makeOrderRef(),
    lines,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    delivery,
    createdAt: new Date().toISOString(),
  };
}

export function deliveryPoint(d: DeliveryDetails): string {
  if (d.courier === 'The Courier Guy') return d.address ?? '';
  if (d.courier === 'Aramex') return `Aramex locker: ${d.lockerName ?? ''}`;
  return `PAXI / PEP store: ${d.pepStore ?? ''}`;
}

export function itemsSummary(lines: OrderLine[]): string {
  return lines.map(l => `${l.quantity} x ${l.name}`).join(', ');
}
