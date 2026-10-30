/**
 * Public shop API handlers (web-standard Request -> Response), mounted by server.ts.
 * Dashboard routes live in ./admin.ts.
 */

import { buildOrder, OrderValidationError } from './order';
import { createYocoCheckout, verifyYocoWebhook, PaymentConfigError, isTestMode } from './yoco';
import { db } from './db';
import { getCatalog, getPublicCatalog, invalidateCatalog } from './catalog';
import { sendOrderEmails } from './notify';
import seedReviews from '../src/data/reviews.json';
import type { Review } from '../src/types';

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const siteUrl = (req: Request) => (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '');

// GET /api/catalog -> { products, settings }  (what the shop renders)
export async function catalogHandler(): Promise<Response> {
  return json(await getPublicCatalog(), 200, { 'Cache-Control': 'public, max-age=30' });
}

// POST /api/checkout  -> { orderRef, redirectUrl }
export async function checkoutHandler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const order = buildOrder(await req.json().catch(() => null), await getCatalog());
    const checkout = await createYocoCheckout(order, siteUrl(req));
    try {
      await db().insertOrder({ ...order, status: 'pending', fulfilment: 'new', checkoutId: checkout.id });
    } catch (e) {
      // Payment can still go ahead: details are also kept in Yoco's metadata.
      console.error('[checkout] could not save order', order.ref, e);
    }
    return json({ orderRef: order.ref, redirectUrl: checkout.redirectUrl, testMode: isTestMode() });
  } catch (e) {
    if (e instanceof OrderValidationError) return json({ error: e.message, fields: e.fields }, 422);
    if (e instanceof PaymentConfigError) {
      console.error('[checkout]', e.message);
      return json({ error: 'Card payments are not available right now. Please order via WhatsApp.' }, 503);
    }
    console.error('[checkout] failed', e);
    return json({ error: 'We could not start the payment. Please try again or order via WhatsApp.' }, 502);
  }
}

// POST /api/yoco-webhook  (registered with Yoco, see scripts/register-yoco-webhook.mjs)
export async function yocoWebhookHandler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const raw = await req.text();
  try {
    if (!verifyYocoWebhook(req.headers, raw)) return json({ error: 'Invalid signature' }, 403);
  } catch (e) {
    console.error('[webhook]', e);
    return json({ error: 'Webhook not configured' }, 500);
  }

  const event = JSON.parse(raw) as {
    type: string;
    payload?: { id?: string; amount?: number; metadata?: Record<string, unknown> };
  };

  if (event.type === 'payment.succeeded' && event.payload) {
    const checkoutId = String(event.payload.metadata?.checkoutId ?? '');
    try {
      const order = await db().markOrderPaid(checkoutId, String(event.payload.id ?? ''));
      if (order) {
        // null = already processed (webhook retry), so stock/emails happen once.
        if (Math.round(order.total * 100) !== Number(event.payload.amount)) {
          console.error('[webhook] amount mismatch for', order.ref, order.total, event.payload.amount);
        }
        const catalog = await getCatalog();
        for (const l of order.lines) {
          if (typeof catalog.products.find(p => p.id === l.id)?.stock === 'number') await db().adjustStock(l.id, -l.quantity);
        }
        invalidateCatalog();
        await sendOrderEmails(order, catalog.settings);
      } else {
        console.warn('[webhook] no pending order for checkout', checkoutId, event.payload.metadata?.orderRef);
      }
    } catch (e) {
      console.error('[webhook] processing failed', checkoutId, e);
      return json({ error: 'Processing failed' }, 500); // Yoco will retry
    }
  }
  return json({ received: true });
}

// GET /api/order?ref=TBO-...  -> { status }  (no personal details exposed)
export async function orderStatusHandler(req: Request): Promise<Response> {
  const ref = new URL(req.url).searchParams.get('ref') ?? '';
  if (!/^TBO-\d{6}-[A-Z0-9]{4}$/.test(ref)) return json({ error: 'Invalid order reference' }, 400);
  const order = await db().getOrder(ref).catch(() => null);
  return json({ status: order?.status ?? 'unknown' }, 200, { 'Cache-Control': 'no-store' });
}

// GET /api/reviews  |  POST /api/reviews (stored unapproved; approve in Dashboard > Reviews)
const reviewPosts = new Map<string, number[]>();
export async function reviewsHandler(req: Request): Promise<Response> {
  if (req.method === 'GET') {
    const approved = await db().listReviews(true).catch(() => []);
    const list: Review[] = [...(seedReviews as Review[]), ...approved.map(({ approved: _a, ...r }) => r)];
    return json(list, 200, { 'Cache-Control': 'public, max-age=60' });
  }
  if (req.method === 'POST') {
    // light spam guard: 3 reviews per IP per hour
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
    const recent = (reviewPosts.get(ip) ?? []).filter(t => Date.now() - t < 3600_000);
    if (recent.length >= 3) return json({ error: 'Thanks! You have already sent a few reviews. Please try again later.' }, 429);
    const b = (await req.json().catch(() => ({}))) as Partial<Review>;
    const userName = String(b.userName ?? '').trim().slice(0, 60);
    const comment = String(b.comment ?? '').trim().slice(0, 1000);
    const rating = Math.round(Number(b.rating));
    const productId = String(b.productId ?? '');
    const products = (await getCatalog()).products;
    if (!userName || comment.length < 3 || !(rating >= 1 && rating <= 5) || !products.some(p => p.id === productId)) {
      return json({ error: 'Please add your name, a rating and a short review.' }, 422);
    }
    await db().insertReview({ productId, userName, rating, comment });
    reviewPosts.set(ip, [...recent, Date.now()]);
    return json({ ok: true, pending: true }, 201);
  }
  return json({ error: 'Method not allowed' }, 405);
}
