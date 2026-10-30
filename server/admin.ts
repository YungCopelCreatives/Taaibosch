/**
 * Dashboard API: everything under /api/admin/*.
 * Roles: owner (everything), manager (no team management), fulfilment (orders only).
 */

import { randomUUID } from 'node:crypto';
import { db, type StoredAdmin } from './db';
import {
  bootstrapOwner, can, clearCookie, clearFailures, currentAdmin, hashPassword, passwordProblem, permissionsFor,
  publicAdmin, recordFailure, sessionCookie, tempPassword, throttled, verifyPassword,
} from './auth';
import { getCatalog, invalidateCatalog, seedProductsIfEmpty } from './catalog';
import { sendDispatchEmail, sendTeamInvite, canEmail } from './notify';
import { keyMode, registerYocoWebhook } from './yoco';
import { normaliseSettings } from '../src/data/store';
import type { AdminOrder, AdminRole, FulfilmentStatus, Product, StoreSettings } from '../src/types';

type Ctx = { req: Request; url: URL; user: StoredAdmin; body: any; secure: boolean };

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
const fail = (status: number, error: string, extra: object = {}) => json({ error, ...extra }, status);

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v: unknown, max = 40) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : []).map(x => str(x, 300)).filter(Boolean).slice(0, max);
const FULFILMENT: FulfilmentStatus[] = ['new', 'packing', 'dispatched', 'delivered', 'cancelled'];
const ROLES: AdminRole[] = ['owner', 'manager', 'fulfilment'];

const isSecure = (req: Request) => new URL(req.url).protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
const clientKey = (req: Request, email: string) => `${req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'}|${email}`;

// ------------------------------------------------------------ auth & profile

async function login(req: Request, body: any): Promise<Response> {
  const email = str(body?.email, 120).toLowerCase();
  const password = typeof body?.password === 'string' ? body.password : '';
  const key = clientKey(req, email);
  if (throttled(key)) return fail(429, 'Too many attempts. Please wait 15 minutes and try again.');

  let user = await db().getAdminByEmail(email);
  if (!user) user = await bootstrapOwner(email, password);
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    recordFailure(key);
    return fail(401, 'That email and password combination is not right.');
  }
  clearFailures(key);
  await db().updateAdmin(user.id, { lastLoginAt: new Date().toISOString() });
  return json({ user: publicAdmin(user), permissions: permissionsFor(user.role) }, 200, { 'Set-Cookie': sessionCookie(user.id, isSecure(req)) });
}

async function onboarding(c: Ctx) {
  const firstName = str(c.body.firstName, 60);
  const lastName = str(c.body.lastName, 60);
  const displayName = str(c.body.displayName, 40) || firstName;
  const jobTitle = str(c.body.jobTitle, 60);
  const phone = str(c.body.phone, 20);
  const errors: Record<string, string> = {};
  if (!firstName) errors.firstName = 'Please enter your first name.';
  if (!lastName) errors.lastName = 'Please enter your surname.';
  let passwordHash: string | undefined;
  if (c.user.mustChangePassword || c.body.newPassword) {
    const pw = String(c.body.newPassword ?? '');
    const problem = passwordProblem(pw);
    if (problem) errors.newPassword = problem;
    else if (await verifyPassword(pw, c.user.passwordHash)) errors.newPassword = 'Choose a new password, not the temporary one.';
    else passwordHash = await hashPassword(pw);
  }
  if (Object.keys(errors).length) return fail(422, 'Please check the highlighted fields.', { fields: errors });
  const user = await db().updateAdmin(c.user.id, {
    firstName, lastName, displayName, jobTitle, phone, onboarded: true,
    ...(passwordHash ? { passwordHash, mustChangePassword: false } : {}),
  });
  return json({ user: publicAdmin(user!) });
}

async function updateProfile(c: Ctx) {
  const patch: Partial<StoredAdmin> = {};
  for (const [k, max] of [['firstName', 60], ['lastName', 60], ['displayName', 40], ['jobTitle', 60], ['phone', 20]] as const) {
    if (c.body[k] !== undefined) patch[k] = str(c.body[k], max);
  }
  if (c.body.newPassword) {
    if (!(await verifyPassword(String(c.body.currentPassword ?? ''), c.user.passwordHash))) {
      return fail(422, 'Your current password is not right.', { fields: { currentPassword: 'Incorrect password.' } });
    }
    const problem = passwordProblem(String(c.body.newPassword));
    if (problem) return fail(422, problem, { fields: { newPassword: problem } });
    patch.passwordHash = await hashPassword(String(c.body.newPassword));
    patch.mustChangePassword = false;
  }
  const user = await db().updateAdmin(c.user.id, patch);
  return json({ user: publicAdmin(user!) });
}

// ------------------------------------------------------------ overview

async function overview() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days30 = new Date(startOfDay.getTime() - 29 * 86400_000);
  const { orders } = await db().listOrders({ status: 'paid', from: days30.toISOString(), limit: 5000 });
  const sum = (list: AdminOrder[]) => list.reduce((s, o) => s + o.total, 0);
  const since = (d: Date) => orders.filter(o => new Date(o.paidAt ?? o.createdAt) >= d);
  const weekStart = new Date(startOfDay.getTime() - ((startOfDay.getDay() + 6) % 7) * 86400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const daily = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(days30.getTime() + i * 86400_000);
    const next = new Date(d.getTime() + 86400_000);
    const list = orders.filter(o => { const t = new Date(o.paidAt ?? o.createdAt); return t >= d && t < next; });
    return { date: d.toISOString().slice(0, 10), revenue: sum(list), orders: list.length };
  });

  const best = new Map<string, { id: string; name: string; units: number; revenue: number }>();
  for (const o of orders) for (const l of o.lines) {
    const b = best.get(l.id) ?? { id: l.id, name: l.name, units: 0, revenue: 0 };
    b.units += l.quantity; b.revenue += l.lineTotal; best.set(l.id, b);
  }

  const [toPack, dispatched, recent, catalog, reviews] = await Promise.all([
    db().listOrders({ status: 'paid', fulfilment: 'new', limit: 1 }),
    db().listOrders({ status: 'paid', fulfilment: 'dispatched', limit: 500 }),
    db().listOrders({ limit: 6 }),
    getCatalog(),
    db().listReviews(false),
  ]);
  const lowStock = catalog.products
    .filter(p => p.active !== false && typeof p.stock === 'number' && p.stock <= catalog.settings.lowStockThreshold)
    .map(p => ({ id: p.id, name: p.name, stock: p.stock }));

  return json({
    revenue: { today: sum(since(startOfDay)), week: sum(since(weekStart)), month: sum(since(monthStart)), last30: sum(orders) },
    ordersCount: { today: since(startOfDay).length, month: since(monthStart).length },
    averageOrder: orders.length ? Math.round(sum(orders) / orders.length) : 0,
    toPack: toPack.total,
    trackingToSend: dispatched.orders.filter(o => !o.trackingSentAt).length,
    pendingReviews: reviews.filter(r => !r.approved).length,
    lowStock,
    daily,
    bestSellers: [...best.values()].sort((a, b) => b.units - a.units).slice(0, 5),
    recent: recent.orders,
    storage: db().kind,
    emailEnabled: canEmail(),
  });
}

// ------------------------------------------------------------ orders

async function listOrders(c: Ctx) {
  const p = c.url.searchParams;
  const page = Math.max(1, Number(p.get('page')) || 1);
  const limit = 25;
  const result = await db().listOrders({
    status: (p.get('status') as any) || 'all',
    fulfilment: (p.get('fulfilment') as any) || 'all',
    q: str(p.get('q'), 80) || undefined,
    from: p.get('from') ? new Date(p.get('from')!).toISOString() : undefined,
    to: p.get('to') ? new Date(new Date(p.get('to')!).getTime() + 86399_999).toISOString() : undefined,
    limit,
    offset: (page - 1) * limit,
  });
  return json({ ...result, page, pageSize: limit });
}

async function exportOrders(c: Ctx) {
  const p = c.url.searchParams;
  const { orders } = await db().listOrders({
    status: (p.get('status') as any) || 'all', fulfilment: (p.get('fulfilment') as any) || 'all', q: p.get('q') || undefined,
    from: p.get('from') ? new Date(p.get('from')!).toISOString() : undefined,
    to: p.get('to') ? new Date(new Date(p.get('to')!).getTime() + 86399_999).toISOString() : undefined, limit: 10000,
  });
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Order', 'Date', 'Payment', 'Fulfilment', 'Customer', 'Email', 'Phone', 'Courier', 'Deliver to', 'Items', 'Subtotal', 'Delivery', 'Total', 'Tracking', 'Tracking sent'],
    ...orders.map(o => [
      o.ref, o.createdAt.slice(0, 16).replace('T', ' '), o.status, o.fulfilment, o.delivery.fullName, o.delivery.email,
      o.delivery.contactNumber, o.delivery.courier, o.delivery.address || o.delivery.lockerName || o.delivery.pepStore,
      o.lines.map(l => `${l.quantity} x ${l.name}`).join('; '), o.subtotal, o.deliveryFee, o.total, o.trackingNumber,
      o.trackingSentAt ? `${o.trackingSentVia} ${o.trackingSentAt.slice(0, 16).replace('T', ' ')}` : '',
    ]),
  ];
  return new Response(rows.map(r => r.map(cell).join(',')).join('\r\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="taaibosch-orders-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}

async function updateOrder(c: Ctx, ref: string) {
  const before = await db().getOrder(ref);
  if (!before) return fail(404, 'Order not found.');
  const fulfilment = c.body.fulfilment as FulfilmentStatus | undefined;
  if (fulfilment && !FULFILMENT.includes(fulfilment)) return fail(422, 'Unknown status.');
  const order = await db().updateOrder(ref, {
    fulfilment,
    trackingNumber: c.body.trackingNumber !== undefined ? str(c.body.trackingNumber, 400) : undefined,
    ...(c.body.trackingSentVia ? { trackingSentVia: str(c.body.trackingSentVia, 40), trackingSentAt: new Date().toISOString() } : {}),
    adminNotes: c.body.adminNotes !== undefined ? str(c.body.adminNotes, 2000) : undefined,
  });
  let emailed = false;
  const firstDispatch = fulfilment === 'dispatched' && before.fulfilment !== 'dispatched' && c.body.notifyCustomer !== false;
  if (order && order.status === 'paid' && (firstDispatch || c.body.sendTrackingEmail)) {
    await sendDispatchEmail(order, (await getCatalog()).settings);
    emailed = canEmail();
    if (emailed && c.body.sendTrackingEmail && order.trackingNumber) {
      const updated = await db().updateOrder(ref, { trackingSentAt: new Date().toISOString(), trackingSentVia: 'email' });
      return json({ order: updated, emailed });
    }
  }
  return json({ order, emailed });
}

// ------------------------------------------------------------ products

const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 50) || 'product';

function cleanProduct(b: any, existing?: Product): { product?: Product; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = str(b.name, 100);
  const price = Math.round(Number(b.price) * 100) / 100;
  const image = str(b.image, 500);
  if (!name) errors.name = 'Give the product a name.';
  if (!(price >= 2)) errors.price = 'Enter a price of at least R2.';
  if (!image) errors.image = 'Add a main photo.';
  const stockRaw = b.stock;
  const stock = stockRaw === null || stockRaw === '' || stockRaw === undefined ? null : Math.max(0, Math.floor(Number(stockRaw)));
  if (stock !== null && !Number.isFinite(stock)) errors.stock = 'Stock must be a number, or leave empty to not track stock.';
  if (Object.keys(errors).length) return { errors };
  return {
    product: {
      id: existing?.id ?? (str(b.id, 60) || `${slug(name)}-${randomUUID().slice(0, 4)}`),
      name,
      price,
      category: str(b.category, 40) || 'Other',
      healthGoals: strList(b.healthGoals, 12),
      image,
      images: strList(b.images, 12),
      summary: str(b.summary, 2000),
      headline: str(b.headline, 160) || undefined,
      hook: str(b.hook, 200) || undefined,
      whyPeopleChooseIt: str(b.whyPeopleChooseIt, 600) || undefined,
      benefits: strList(b.benefits, 12),
      ingredients: strList(b.ingredients, 20),
      usage: str(b.usage, 800),
      whoItsFor: str(b.whoItsFor, 800),
      isBestSeller: Boolean(b.isBestSeller),
      isTrending: Boolean(b.isTrending),
      active: b.active !== false,
      stock,
      sortOrder: Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : existing?.sortOrder ?? 999,
    },
  };
}

async function upsertProduct(c: Ctx, id?: string) {
  const existing = id ? (await getCatalog()).products.find(p => p.id === id) ?? (await db().listProducts()).find(p => p.id === id) : undefined;
  if (id && !existing) return fail(404, 'Product not found.');
  const { product, errors } = cleanProduct(c.body, existing);
  if (errors) return fail(422, 'Please check the highlighted fields.', { fields: errors });
  await seedProductsIfEmpty();
  await db().saveProduct(product!);
  invalidateCatalog();
  return json({ product }, id ? 200 : 201);
}

async function upload(c: Ctx) {
  const type = c.req.headers.get('content-type') ?? '';
  if (!/^image\/(jpeg|png|webp)$/.test(type)) return fail(415, 'Upload a JPG, PNG or WebP image.');
  const bytes = new Uint8Array(await c.req.arrayBuffer());
  if (bytes.length > 4 * 1024 * 1024) return fail(413, 'Images must be under 4 MB.');
  const name = slug(str(c.url.searchParams.get('name'), 60).replace(/\.\w+$/, '')) + '.' + type.split('/')[1].replace('jpeg', 'jpg');
  return json({ url: await db().uploadImage(name, bytes, type) }, 201);
}

// ------------------------------------------------------------ settings

function cleanSettings(b: any): StoreSettings {
  const s = normaliseSettings(b);
  return {
    ...s,
    whatsappNumber: str(s.whatsappNumber, 20),
    email: str(s.email, 120),
    location: str(s.location, 200),
    categories: [...new Set(strList(s.categories, 30))],
    healthGoals: [...new Set(strList(s.healthGoals, 40))],
    couriers: s.couriers.map(c => ({ ...c, label: str(c.label, 40) || c.id, kind: str(c.kind, 40), eta: str(c.eta, 40), enabled: Boolean(c.enabled) })),
    announcement: { enabled: Boolean(s.announcement.enabled), title: str(s.announcement.title, 100), text: str(s.announcement.text, 300) },
    lowStockThreshold: Math.max(0, Math.floor(Number(s.lowStockThreshold) || 0)),
  };
}

// ------------------------------------------------------------ team

async function createTeamMember(c: Ctx) {
  const email = str(c.body.email, 120).toLowerCase();
  const role = c.body.role as AdminRole;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail(422, 'Enter a valid email address.', { fields: { email: 'Enter a valid email.' } });
  if (!ROLES.includes(role)) return fail(422, 'Choose a role.');
  if (await db().getAdminByEmail(email)) return fail(409, 'Someone with that email already has access.', { fields: { email: 'Already on the team.' } });
  const password = tempPassword();
  await db().insertAdmin({
    id: randomUUID(), email, role, firstName: str(c.body.firstName, 60) || undefined, onboarded: false, active: true,
    createdAt: new Date().toISOString(), passwordHash: await hashPassword(password), mustChangePassword: true,
  });
  const loginUrl = `${(process.env.SITE_URL || c.url.origin).replace(/\/$/, '')}/admin/login`;
  await sendTeamInvite(email, str(c.body.firstName, 60), password, loginUrl);
  return json({ email, tempPassword: password, emailed: canEmail(), loginUrl }, 201);
}

async function updateTeamMember(c: Ctx, id: string) {
  const target = await db().getAdmin(id);
  if (!target) return fail(404, 'Team member not found.');
  const patch: Partial<StoredAdmin> = {};
  if (c.body.role !== undefined) {
    if (!ROLES.includes(c.body.role)) return fail(422, 'Unknown role.');
    patch.role = c.body.role;
  }
  if (c.body.active !== undefined) patch.active = Boolean(c.body.active);
  if (target.id === c.user.id && (patch.active === false || (patch.role && patch.role !== 'owner'))) {
    return fail(422, "You can't remove your own owner access.");
  }
  if (target.role === 'owner' && (patch.active === false || (patch.role && patch.role !== 'owner'))) {
    const owners = (await db().listAdmins()).filter(a => a.role === 'owner' && a.active);
    if (owners.length <= 1) return fail(422, 'There must always be at least one active owner.');
  }
  let password: string | undefined;
  if (c.body.resetPassword) {
    password = tempPassword();
    patch.passwordHash = await hashPassword(password);
    patch.mustChangePassword = true;
  }
  const user = await db().updateAdmin(id, patch);
  if (password) await sendTeamInvite(target.email, target.displayName ?? '', password, `${(process.env.SITE_URL || c.url.origin).replace(/\/$/, '')}/admin/login`);
  return json({ user: publicAdmin(user!), tempPassword: password, emailed: Boolean(password) && canEmail() });
}

// ------------------------------------------------------------ router

export async function adminHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const route = url.pathname.replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');
  const method = req.method;

  // Simple CSRF guard: state-changing requests must come from our own pages.
  if (method !== 'GET' && req.headers.get('x-requested-with') !== 'taaibosch-admin') return fail(403, 'Forbidden');

  const isUpload = route === 'upload';
  const body = method === 'GET' || isUpload ? {} : await req.json().catch(() => ({}));

  try {
    if (route === 'login' && method === 'POST') return await login(req, body);
    if (route === 'logout' && method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': clearCookie(isSecure(req)) });

    const user = await currentAdmin(req);
    if (!user) return fail(401, 'Please sign in.');
    const c: Ctx = { req, url, user, body, secure: isSecure(req) };
    const deny = () => fail(403, "Your role doesn't have access to this.");
    const [area, id, sub] = route.split('/');

    if (area === 'me') {
      if (method === 'GET') return json({ user: publicAdmin(user), permissions: permissionsFor(user.role) });
      if (method === 'PATCH') return await updateProfile(c);
    }
    if (area === 'onboarding' && method === 'POST') return await onboarding(c);
    // Until the profile is set up, nothing else is available.
    if (!user.onboarded || user.mustChangePassword) return fail(428, 'Please finish setting up your profile first.');

    if (area === 'overview' && method === 'GET') return can(user.role, 'reports') ? await overview() : deny();

    if (area === 'orders') {
      if (!can(user.role, 'orders')) return deny();
      if (!id && method === 'GET') return await listOrders(c);
      if (id === 'export.csv' && method === 'GET') return await exportOrders(c);
      if (id && method === 'GET') {
        const order = await db().getOrder(decodeURIComponent(id));
        return order ? json({ order }) : fail(404, 'Order not found.');
      }
      if (id && method === 'PATCH') return await updateOrder(c, decodeURIComponent(id));
    }

    if (area === 'products' || area === 'upload') {
      if (!can(user.role, 'products')) return deny();
      if (isUpload && method === 'POST') return await upload(c);
      if (!id && method === 'GET') {
        await seedProductsIfEmpty();
        return json({ products: (await getCatalog()).products, settings: (await getCatalog()).settings });
      }
      if (!id && method === 'POST') return await upsertProduct(c);
      if (id && method === 'PUT') return await upsertProduct(c, decodeURIComponent(id));
      if (id && method === 'DELETE') {
        await seedProductsIfEmpty();
        await db().deleteProduct(decodeURIComponent(id));
        invalidateCatalog();
        return json({ ok: true });
      }
      if (id === 'reorder' && method === 'POST' && Array.isArray(body.ids)) {
        await seedProductsIfEmpty();
        const products = await db().listProducts();
        for (const [i, pid] of body.ids.entries()) {
          const p = products.find(x => x.id === pid);
          if (p && p.sortOrder !== i) await db().saveProduct({ ...p, sortOrder: i });
        }
        invalidateCatalog();
        return json({ ok: true });
      }
    }

    if (area === 'reviews') {
      if (!can(user.role, 'reviews')) return deny();
      if (!id && method === 'GET') return json({ reviews: await db().listReviews(false) });
      if (id && method === 'PATCH') { await db().updateReview(id, Boolean(body.approved)); return json({ ok: true }); }
      if (id && method === 'DELETE') { await db().deleteReview(id); return json({ ok: true }); }
    }

    if (area === 'payments') {
      if (!can(user.role, 'settings')) return deny();
      const mode = keyMode();
      const origin = new URL(req.url).origin;
      const webhookUrl = `${origin}/api/yoco-webhook`;
      const saved = mode === 'missing' ? null : await db().getSecret(`yoco_webhook_secret_${mode}`);
      const savedUrl = mode === 'missing' ? null : await db().getSecret(`yoco_webhook_url_${mode}`);
      if (method === 'GET') {
        return json({
          mode,
          connected: Boolean(process.env.YOCO_WEBHOOK_SECRET || saved),
          connectedVia: process.env.YOCO_WEBHOOK_SECRET ? 'hosting settings' : saved ? 'dashboard' : null,
          connectedUrl: savedUrl,
          webhookUrl,
          storage: db().kind,
          isLocalhost: /localhost|127\.0\.0\.1/.test(origin),
        });
      }
      if (id === 'connect' && method === 'POST') {
        if (mode === 'missing') return fail(422, 'Add YOCO_SECRET_KEY to the hosting settings first, then restart the site.');
        if (!origin.startsWith('https://')) return fail(422, 'Open the dashboard on the live https address of the site, then try again.');
        try {
          const { secret } = await registerYocoWebhook(webhookUrl);
          await db().setSecret(`yoco_webhook_secret_${mode}`, secret);
          await db().setSecret(`yoco_webhook_url_${mode}`, webhookUrl);
          return json({ ok: true, mode, webhookUrl, secret: db().kind === 'local' ? secret : undefined });
        } catch (e) {
          return fail(502, `Yoco didn't accept the connection: ${e instanceof Error ? e.message : 'unknown error'}`);
        }
      }
    }

    if (area === 'settings') {
      if (!can(user.role, 'settings')) return deny();
      if (method === 'GET') return json({ settings: (await getCatalog()).settings });
      if (method === 'PUT') {
        const settings = cleanSettings(body.settings ?? body);
        if (!settings.couriers.some(x => x.enabled)) return fail(422, 'Keep at least one delivery option switched on.');
        await db().saveSettings(settings);
        invalidateCatalog();
        return json({ settings });
      }
    }

    if (area === 'team') {
      if (!can(user.role, 'team')) return deny();
      if (!id && method === 'GET') return json({ team: (await db().listAdmins()).map(publicAdmin) });
      if (!id && method === 'POST') return await createTeamMember(c);
      if (id && method === 'PATCH' && !sub) return await updateTeamMember(c, id);
    }

    return fail(404, 'Not found');
  } catch (e) {
    console.error('[admin]', route, e);
    return fail(500, 'Something went wrong. Please try again.');
  }
}
