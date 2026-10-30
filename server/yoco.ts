/**
 * Yoco Checkout API client (https://developer.yoco.com).
 * Only ever runs on the server: the secret key must never reach the browser.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Order } from './order';
import { deliveryPoint, itemsSummary } from './order';

const YOCO_API = 'https://payments.yoco.com/api';

export class PaymentConfigError extends Error {}

function secretKey(): string {
  const key = process.env.YOCO_SECRET_KEY;
  if (!key) throw new PaymentConfigError('YOCO_SECRET_KEY is not set.');
  return key;
}

export const isTestMode = () => (process.env.YOCO_SECRET_KEY ?? '').startsWith('sk_test_');
export const keyMode = (): 'test' | 'live' | 'missing' => {
  const k = process.env.YOCO_SECRET_KEY ?? '';
  return k.startsWith('sk_live_') ? 'live' : k.startsWith('sk_test_') ? 'test' : 'missing';
};

/**
 * Tells Yoco where to send payment notifications (one-time, per key: test and live).
 * Returns Yoco's signing secret, which is shown only once.
 */
export async function registerYocoWebhook(url: string): Promise<{ secret: string; id?: string }> {
  const res = await fetch(`${YOCO_API}/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secretKey()}` },
    body: JSON.stringify({ name: 'taaibosch-orders', url }),
  });
  const data = (await res.json().catch(() => ({}))) as { secret?: string; id?: string; errorMessage?: string; message?: string };
  if (!res.ok || !data.secret) {
    console.error('[yoco] register webhook failed', res.status, data);
    throw new Error(data.errorMessage || data.message || `Yoco returned ${res.status}`);
  }
  return { secret: data.secret, id: data.id };
}

export interface YocoCheckout {
  id: string;
  redirectUrl: string;
  status?: string;
}

/** Creates a hosted Yoco checkout and returns where to send the customer. */
export async function createYocoCheckout(order: Order, siteUrl: string): Promise<YocoCheckout> {
  const back = (path: string) => `${siteUrl}/checkout/${path}?ref=${encodeURIComponent(order.ref)}`;

  const res = await fetch(`${YOCO_API}/checkouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey()}`,
      // Same order ref = same checkout, so a double-click can't create two payments.
      'Idempotency-Key': order.ref,
    },
    body: JSON.stringify({
      amount: Math.round(order.total * 100), // Yoco expects cents
      currency: 'ZAR',
      successUrl: back('success'),
      cancelUrl: back('cancelled'),
      failureUrl: back('failed'),
      metadata: {
        orderRef: order.ref,
        customerName: order.delivery.fullName,
        customerEmail: order.delivery.email,
        customerPhone: order.delivery.contactNumber,
        courier: order.delivery.courier,
        deliveryPoint: deliveryPoint(order.delivery).slice(0, 300),
        items: itemsSummary(order.lines).slice(0, 500),
        subtotal: `R${order.subtotal}`,
        deliveryFee: order.deliveryFee ? `R${order.deliveryFee}` : 'FREE',
      },
    }),
  });

  const data = (await res.json().catch(() => ({}))) as Partial<YocoCheckout> & { errorMessage?: string; message?: string };
  if (!res.ok || !data.id || !data.redirectUrl) {
    console.error('[yoco] create checkout failed', res.status, data);
    throw new Error(data.errorMessage || data.message || `Yoco returned ${res.status}`);
  }
  return { id: data.id, redirectUrl: data.redirectUrl, status: data.status };
}

/**
 * Verifies a Yoco webhook (Standard Webhooks / HMAC-SHA256).
 * `rawBody` must be the exact bytes Yoco sent, before any JSON parsing.
 */
export function verifyYocoWebhook(headers: Headers, rawBody: string, secret = process.env.YOCO_WEBHOOK_SECRET): boolean {
  if (!secret) throw new PaymentConfigError('Payment confirmations are not connected (no webhook secret).');

  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) return false;

  // Reject anything older/newer than 3 minutes (replay protection, per Yoco docs).
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 180) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest('base64');
  const expectedBuf = Buffer.from(expected);

  // Header may hold several space-separated "v1,<sig>" entries.
  return signatureHeader.split(' ').some(entry => {
    const sig = entry.split(',')[1];
    if (!sig) return false;
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
