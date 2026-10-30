/**
 * Data layer. Production uses Supabase (Postgres + file storage) through its
 * REST APIs, no SDK needed. Without Supabase settings, a local JSON file in
 * ./.data is used so the shop and dashboard can be developed and tested offline.
 * Table definitions: supabase/schema.sql
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AdminOrder, AdminReview, AdminUser, Product, StoreSettings, FulfilmentStatus, OrderStatus } from '../src/types';

export interface StoredAdmin extends AdminUser {
  passwordHash: string;
  mustChangePassword: boolean;
}

export interface OrderQuery {
  status?: OrderStatus | 'all';
  fulfilment?: FulfilmentStatus | 'all';
  q?: string;
  from?: string; // ISO date
  to?: string;
  limit?: number;
  offset?: number;
}

export interface Db {
  kind: 'supabase' | 'local';
  // catalogue
  listProducts(): Promise<Product[]>;
  saveProduct(p: Product): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  adjustStock(id: string, delta: number): Promise<void>;
  getSettings(): Promise<Partial<StoreSettings> | null>;
  saveSettings(s: StoreSettings): Promise<void>;
  // orders
  insertOrder(o: AdminOrder): Promise<void>;
  getOrder(ref: string): Promise<AdminOrder | null>;
  /** Marks paid once; returns the order only if this call changed it. */
  markOrderPaid(checkoutId: string, paymentId: string): Promise<AdminOrder | null>;
  updateOrder(ref: string, patch: Partial<Pick<AdminOrder, 'fulfilment' | 'trackingNumber' | 'trackingSentAt' | 'trackingSentVia' | 'adminNotes' | 'status'>>): Promise<AdminOrder | null>;
  listOrders(q: OrderQuery): Promise<{ orders: AdminOrder[]; total: number }>;
  // reviews
  listReviews(onlyApproved: boolean): Promise<AdminReview[]>;
  insertReview(r: Omit<AdminReview, 'id' | 'date' | 'approved'>): Promise<void>;
  updateReview(id: string, approved: boolean): Promise<void>;
  deleteReview(id: string): Promise<void>;
  // team
  countAdmins(): Promise<number>;
  listAdmins(): Promise<StoredAdmin[]>;
  getAdminByEmail(email: string): Promise<StoredAdmin | null>;
  getAdmin(id: string): Promise<StoredAdmin | null>;
  insertAdmin(a: StoredAdmin): Promise<void>;
  updateAdmin(id: string, patch: Partial<StoredAdmin>): Promise<StoredAdmin | null>;
  // files
  uploadImage(name: string, bytes: Uint8Array, contentType: string): Promise<string>;
  // server-only values (e.g. the Yoco webhook secret). Never sent to browsers.
  getSecret(key: string): Promise<string | null>;
  setSecret(key: string, value: string): Promise<void>;
}

// ---------------------------------------------------------------- Supabase

const sbUrl = () => process.env.SUPABASE_URL?.replace(/\/$/, '');
const sbKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
export const hasSupabase = () => Boolean(sbUrl() && sbKey());

async function rest(pathAndQuery: string, init: RequestInit & { count?: boolean } = {}) {
  const res = await fetch(`${sbUrl()}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: sbKey()!,
      Authorization: `Bearer ${sbKey()}`,
      'Content-Type': 'application/json',
      Prefer: init.count ? 'count=exact' : 'return=representation',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  const data = text ? JSON.parse(text) : null;
  const range = res.headers.get('content-range'); // e.g. 0-24/120
  return { data, total: range ? Number(range.split('/')[1]) || 0 : 0 };
}
const q = encodeURIComponent;

const orderFromRow = (r: any): AdminOrder => ({
  ref: r.ref,
  status: r.status,
  fulfilment: r.fulfilment_status ?? 'new',
  trackingNumber: r.tracking_number ?? undefined,
  trackingSentAt: r.tracking_sent_at ?? undefined,
  trackingSentVia: r.tracking_sent_via ?? undefined,
  adminNotes: r.admin_notes ?? undefined,
  checkoutId: r.checkout_id ?? undefined,
  paymentId: r.payment_id ?? undefined,
  lines: r.lines,
  subtotal: Number(r.subtotal),
  deliveryFee: Number(r.delivery_fee),
  total: Number(r.total),
  delivery: r.delivery,
  createdAt: r.created_at,
  paidAt: r.paid_at ?? undefined,
  updatedAt: r.updated_at ?? undefined,
});

const adminFromRow = (r: any): StoredAdmin => ({
  id: r.id,
  email: r.email,
  role: r.role,
  firstName: r.first_name ?? undefined,
  lastName: r.last_name ?? undefined,
  displayName: r.display_name ?? undefined,
  jobTitle: r.job_title ?? undefined,
  phone: r.phone ?? undefined,
  onboarded: r.onboarded,
  active: r.active,
  lastLoginAt: r.last_login_at ?? undefined,
  createdAt: r.created_at,
  passwordHash: r.password_hash,
  mustChangePassword: r.must_change_password,
});

const adminToRow = (a: Partial<StoredAdmin>) => {
  const map: Record<string, string> = {
    email: 'email', role: 'role', firstName: 'first_name', lastName: 'last_name', displayName: 'display_name',
    jobTitle: 'job_title', phone: 'phone', onboarded: 'onboarded', active: 'active', lastLoginAt: 'last_login_at',
    passwordHash: 'password_hash', mustChangePassword: 'must_change_password', id: 'id', createdAt: 'created_at',
  };
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(a)) if (map[k] && v !== undefined) row[map[k]] = v;
  return row;
};

const supabaseDb: Db = {
  kind: 'supabase',
  async listProducts() {
    const { data } = await rest('products?select=*&order=sort_order.asc,created_at.asc');
    return (data ?? []).map((r: any) => ({ ...r.data, id: r.id, active: r.active, stock: r.stock, sortOrder: r.sort_order }));
  },
  async saveProduct(p) {
    const { id, active = true, stock = null, sortOrder = 0, ...data } = p;
    await rest('products?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id, active, stock, sort_order: sortOrder, data, updated_at: new Date().toISOString() }),
    });
    return p;
  },
  async deleteProduct(id) {
    await rest(`products?id=eq.${q(id)}`, { method: 'DELETE' });
  },
  async adjustStock(id, delta) {
    await rest('rpc/adjust_stock', { method: 'POST', body: JSON.stringify({ product_id: id, delta }) });
  },
  async getSettings() {
    const { data } = await rest('settings?id=eq.1&select=data');
    return data?.[0]?.data ?? null;
  },
  async saveSettings(s) {
    await rest('settings?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: 1, data: s, updated_at: new Date().toISOString() }),
    });
  },
  async insertOrder(o) {
    await rest('orders', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        ref: o.ref, status: o.status, fulfilment_status: o.fulfilment, checkout_id: o.checkoutId, lines: o.lines,
        subtotal: o.subtotal, delivery_fee: o.deliveryFee, total: o.total, customer_name: o.delivery.fullName,
        customer_email: o.delivery.email, customer_phone: o.delivery.contactNumber, courier: o.delivery.courier,
        delivery: o.delivery, created_at: o.createdAt,
      }),
    });
  },
  async getOrder(ref) {
    const { data } = await rest(`orders?ref=eq.${q(ref)}&limit=1`);
    return data?.[0] ? orderFromRow(data[0]) : null;
  },
  async markOrderPaid(checkoutId, paymentId) {
    const now = new Date().toISOString();
    const { data } = await rest(`orders?checkout_id=eq.${q(checkoutId)}&status=neq.paid`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'paid', payment_id: paymentId, paid_at: now, updated_at: now }),
    });
    return data?.[0] ? orderFromRow(data[0]) : null;
  },
  async updateOrder(ref, patch) {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.fulfilment) row.fulfilment_status = patch.fulfilment;
    if (patch.trackingNumber !== undefined) row.tracking_number = patch.trackingNumber;
    if (patch.trackingSentAt !== undefined) row.tracking_sent_at = patch.trackingSentAt;
    if (patch.trackingSentVia !== undefined) row.tracking_sent_via = patch.trackingSentVia;
    if (patch.adminNotes !== undefined) row.admin_notes = patch.adminNotes;
    if (patch.status) row.status = patch.status;
    const { data } = await rest(`orders?ref=eq.${q(ref)}`, { method: 'PATCH', body: JSON.stringify(row) });
    return data?.[0] ? orderFromRow(data[0]) : null;
  },
  async listOrders(f) {
    const parts = ['select=*', 'order=created_at.desc', `limit=${f.limit ?? 50}`, `offset=${f.offset ?? 0}`];
    if (f.status && f.status !== 'all') parts.push(`status=eq.${q(f.status)}`);
    if (f.fulfilment && f.fulfilment !== 'all') parts.push(`fulfilment_status=eq.${q(f.fulfilment)}`);
    if (f.from) parts.push(`created_at=gte.${q(f.from)}`);
    if (f.to) parts.push(`created_at=lte.${q(f.to)}`);
    if (f.q) {
      const term = f.q.replace(/[,()*%]/g, ' ').trim();
      if (term) parts.push(`or=(${['ref', 'customer_name', 'customer_email', 'customer_phone'].map(c => `${c}.ilike.*${q(term)}*`).join(',')})`);
    }
    const { data, total } = await rest(`orders?${parts.join('&')}`, { count: true });
    return { orders: (data ?? []).map(orderFromRow), total };
  },
  async listReviews(onlyApproved) {
    const { data } = await rest(`reviews?select=*&order=created_at.desc&limit=1000${onlyApproved ? '&approved=eq.true' : ''}`);
    return (data ?? []).map((r: any) => ({
      id: r.id, productId: r.product_id, userName: r.user_name, rating: r.rating, comment: r.comment,
      date: String(r.created_at).slice(0, 10), approved: r.approved,
    }));
  },
  async insertReview(r) {
    await rest('reviews', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ product_id: r.productId, user_name: r.userName, rating: r.rating, comment: r.comment }),
    });
  },
  async updateReview(id, approved) {
    await rest(`reviews?id=eq.${q(id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ approved }) });
  },
  async deleteReview(id) {
    await rest(`reviews?id=eq.${q(id)}`, { method: 'DELETE' });
  },
  async countAdmins() {
    const { total } = await rest('admin_users?select=id&limit=1', { count: true });
    return total;
  },
  async listAdmins() {
    const { data } = await rest('admin_users?select=*&order=created_at.asc');
    return (data ?? []).map(adminFromRow);
  },
  async getAdminByEmail(email) {
    const { data } = await rest(`admin_users?email=eq.${q(email.toLowerCase())}&limit=1`);
    return data?.[0] ? adminFromRow(data[0]) : null;
  },
  async getAdmin(id) {
    const { data } = await rest(`admin_users?id=eq.${q(id)}&limit=1`);
    return data?.[0] ? adminFromRow(data[0]) : null;
  },
  async insertAdmin(a) {
    await rest('admin_users', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(adminToRow(a)) });
  },
  async updateAdmin(id, patch) {
    const { data } = await rest(`admin_users?id=eq.${q(id)}`, { method: 'PATCH', body: JSON.stringify(adminToRow(patch)) });
    return data?.[0] ? adminFromRow(data[0]) : null;
  },
  async uploadImage(name, bytes, contentType) {
    const objectPath = `products/${Date.now()}-${name}`;
    const res = await fetch(`${sbUrl()}/storage/v1/object/product-images/${objectPath}`, {
      method: 'POST',
      headers: { apikey: sbKey()!, Authorization: `Bearer ${sbKey()}`, 'Content-Type': contentType, 'Cache-Control': '31536000', 'x-upsert': 'false' },
      body: Buffer.from(bytes),
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${await res.text()}`);
    return `${sbUrl()}/storage/v1/object/public/product-images/${objectPath}`;
  },
  async getSecret(key) {
    const { data } = await rest(`secrets?key=eq.${q(key)}&select=value`);
    return data?.[0]?.value ?? null;
  },
  async setSecret(key, value) {
    await rest('secrets?on_conflict=key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    });
  },
};

// ---------------------------------------------------------------- Local JSON (development)

interface LocalData {
  products: Product[] | null;
  settings: Partial<StoreSettings> | null;
  orders: AdminOrder[];
  reviews: AdminReview[];
  admins: StoredAdmin[];
  secrets?: Record<string, string>;
}

// On Vercel only /tmp is writable (and it is temporary): fine for a quick test, not for real orders.
const DATA_DIR = path.resolve(process.env.LOCAL_DATA_DIR || (process.env.VERCEL ? '/tmp/taaibosch-data' : '.data'));
const DATA_FILE = path.join(DATA_DIR, 'db.json');
export const LOCAL_UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
let writeChain: Promise<unknown> = Promise.resolve();

async function load(): Promise<LocalData> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch {
    return { products: null, settings: null, orders: [], reviews: [], admins: [] };
  }
}
/** Serialised read-modify-write so concurrent requests don't clobber each other. */
function mutate<T>(fn: (d: LocalData) => T | Promise<T>): Promise<T> {
  const run = writeChain.then(async () => {
    const d = await load();
    const result = await fn(d);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(d, null, 2));
    return result;
  });
  writeChain = run.catch(() => undefined);
  return run;
}

const localDb: Db = {
  kind: 'local',
  async listProducts() {
    const d = await load();
    return [...(d.products ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  },
  saveProduct: p => mutate(d => {
    d.products ??= [];
    const i = d.products.findIndex(x => x.id === p.id);
    if (i >= 0) d.products[i] = p; else d.products.push(p);
    return p;
  }),
  deleteProduct: id => mutate(d => { d.products = (d.products ?? []).filter(p => p.id !== id); }),
  adjustStock: (id, delta) => mutate(d => {
    const p = d.products?.find(x => x.id === id);
    if (p && typeof p.stock === 'number') p.stock = Math.max(0, p.stock + delta);
  }),
  async getSettings() { return (await load()).settings; },
  saveSettings: s => mutate(d => { d.settings = s; }),
  insertOrder: o => mutate(d => { d.orders.push(o); }),
  async getOrder(ref) { return (await load()).orders.find(o => o.ref === ref) ?? null; },
  markOrderPaid: (checkoutId, paymentId) => mutate(d => {
    const o = d.orders.find(x => x.checkoutId === checkoutId && x.status !== 'paid');
    if (!o) return null;
    Object.assign(o, { status: 'paid', paymentId, paidAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return o;
  }),
  updateOrder: (ref, patch) => mutate(d => {
    const o = d.orders.find(x => x.ref === ref);
    if (!o) return null;
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) (o as any)[k] = v;
    o.updatedAt = new Date().toISOString();
    return o;
  }),
  async listOrders(f) {
    let list = [...(await load()).orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (f.status && f.status !== 'all') list = list.filter(o => o.status === f.status);
    if (f.fulfilment && f.fulfilment !== 'all') list = list.filter(o => o.fulfilment === f.fulfilment);
    if (f.from) list = list.filter(o => o.createdAt >= f.from!);
    if (f.to) list = list.filter(o => o.createdAt <= f.to!);
    if (f.q) {
      const t = f.q.toLowerCase();
      list = list.filter(o => [o.ref, o.delivery.fullName, o.delivery.email, o.delivery.contactNumber].some(v => v?.toLowerCase().includes(t)));
    }
    const offset = f.offset ?? 0;
    return { orders: list.slice(offset, offset + (f.limit ?? 50)), total: list.length };
  },
  async listReviews(onlyApproved) {
    const r = (await load()).reviews;
    return onlyApproved ? r.filter(x => x.approved) : r;
  },
  insertReview: r => mutate(d => {
    d.reviews.unshift({ ...r, id: randomUUID(), date: new Date().toISOString().slice(0, 10), approved: false });
  }),
  updateReview: (id, approved) => mutate(d => { const r = d.reviews.find(x => x.id === id); if (r) r.approved = approved; }),
  deleteReview: id => mutate(d => { d.reviews = d.reviews.filter(x => x.id !== id); }),
  async countAdmins() { return (await load()).admins.length; },
  async listAdmins() { return (await load()).admins; },
  async getAdminByEmail(email) { return (await load()).admins.find(a => a.email === email.toLowerCase()) ?? null; },
  async getAdmin(id) { return (await load()).admins.find(a => a.id === id) ?? null; },
  insertAdmin: a => mutate(d => { d.admins.push(a); }),
  updateAdmin: (id, patch) => mutate(d => {
    const a = d.admins.find(x => x.id === id);
    if (!a) return null;
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) (a as any)[k] = v;
    return a;
  }),
  async uploadImage(name, bytes) {
    await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    const file = `${Date.now()}-${name}`;
    await fs.writeFile(path.join(LOCAL_UPLOAD_DIR, file), bytes);
    return `/uploads/${file}`;
  },
  async getSecret(key) {
    return (await load()).secrets?.[key] ?? null;
  },
  setSecret: (key, value) => mutate(d => { d.secrets = { ...(d.secrets ?? {}), [key]: value }; }),
};

export const db = (): Db => (hasSupabase() ? supabaseDb : localDb);
