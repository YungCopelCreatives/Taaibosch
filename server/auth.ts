/**
 * Dashboard authentication: scrypt password hashes + signed, HttpOnly session cookies.
 * Needs ADMIN_SESSION_SECRET (any long random string) in production.
 */

import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { db, type StoredAdmin } from './db';
import type { AdminRole, AdminUser } from '../src/types';

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = 'tb_admin';
const SESSION_HOURS = 12;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(pw, Buffer.from(saltB64, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return 'Use at least 10 characters.';
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return 'Use a mix of letters and numbers.';
  return null;
}

/** Readable temporary password, e.g. "moss-7kq4-leaf-92". */
export function tempPassword(): string {
  const words = ['moss', 'leaf', 'root', 'sage', 'fern', 'herb', 'seed', 'bark', 'bloom', 'reed'];
  const pick = () => words[randomBytes(1)[0] % words.length];
  const code = () => randomBytes(3).toString('base64').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 4).padEnd(4, '7');
  return `${pick()}-${code()}-${pick()}-${10 + (randomBytes(1)[0] % 90)}`;
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 24) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('ADMIN_SESSION_SECRET must be set (24+ characters).');
  return 'dev-only-insecure-session-secret-change-me';
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url');

export function sessionCookie(userId: string, secure: boolean): string {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url');
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}${secure ? '; Secure' : ''}`;
}

export const clearCookie = (secure: boolean) => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;

function readSession(req: Request): { uid: string } | null {
  const raw = req.headers.get('cookie')?.split(/;\s*/).find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof uid === 'string' && Date.now() < exp ? { uid } : null;
  } catch {
    return null;
  }
}

export async function currentAdmin(req: Request): Promise<StoredAdmin | null> {
  const s = readSession(req);
  if (!s) return null;
  const user = await db().getAdmin(s.uid);
  return user && user.active ? user : null;
}

export const publicAdmin = (a: StoredAdmin): AdminUser & { mustChangePassword: boolean } => {
  const { passwordHash: _omit, ...rest } = a;
  return rest;
};

// What each role may do
const PERMS: Record<AdminRole, string[]> = {
  owner: ['orders', 'products', 'reviews', 'settings', 'team', 'reports'],
  manager: ['orders', 'products', 'reviews', 'settings', 'reports'],
  fulfilment: ['orders'],
};
export const can = (role: AdminRole, area: string) => PERMS[role]?.includes(area) ?? false;
export const permissionsFor = (role: AdminRole) => PERMS[role] ?? [];

// ---- Login throttling: 6 failed attempts per email+IP per 15 minutes
const attempts = new Map<string, { n: number; until: number }>();
export function throttled(key: string): boolean {
  const a = attempts.get(key);
  return Boolean(a && a.n >= 6 && Date.now() < a.until);
}
export function recordFailure(key: string) {
  const a = attempts.get(key);
  if (!a || Date.now() > a.until) attempts.set(key, { n: 1, until: Date.now() + 15 * 60_000 });
  else a.n++;
}
export const clearFailures = (key: string) => attempts.delete(key);

/**
 * First-ever sign-in: when there are no team members yet, the email/password in
 * ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD creates the owner account.
 */
export async function bootstrapOwner(email: string, password: string): Promise<StoredAdmin | null> {
  const be = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const bp = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!be || !bp || email !== be || password !== bp) return null;
  if ((await db().countAdmins()) > 0) return null;
  const owner: StoredAdmin = {
    id: randomUUID(),
    email: be,
    role: 'owner',
    onboarded: false,
    active: true,
    createdAt: new Date().toISOString(),
    passwordHash: await hashPassword(bp),
    mustChangePassword: true,
  };
  await db().insertAdmin(owner);
  return owner;
}
