/**
 * Keeps a copy of the order the shopper is paying for, so the confirmation page
 * can show it after Yoco redirects back. Holds no payment data.
 */
import type { Courier, TrackingChannel } from '../types';

export interface PendingOrder {
  ref: string;
  lines: { id: string; name: string; image: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  courier: Courier;
  firstName: string;
  email: string;
  phone?: string;
  trackingVia?: TrackingChannel;
}

const KEY = 'taaibosch_pending_order';

export function savePendingOrder(order: PendingOrder) {
  try {
    localStorage.setItem(KEY, JSON.stringify(order));
  } catch { /* ignore */ }
}

export function readPendingOrder(ref: string | null): PendingOrder | null {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null') as PendingOrder | null;
    return o && o.ref === ref ? o : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}
