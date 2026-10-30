/**
 * Vercel entry: one function serves every /api route (same handlers as server.ts).
 * Bundled by scripts/build-vercel.mjs into .vercel/output (Vercel's Build Output API).
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { catalogHandler, checkoutHandler, yocoWebhookHandler, orderStatusHandler, reviewsHandler } from './handlers';
import { adminHandler } from './admin';
import { LOCAL_UPLOAD_DIR, hasSupabase } from './db';

type Handler = (req: Request) => Promise<Response>;

function route(pathname: string, method: string): Handler | null {
  if (pathname === '/api/catalog' && method === 'GET') return () => catalogHandler();
  if (pathname === '/api/checkout') return checkoutHandler;
  if (pathname === '/api/yoco-webhook') return yocoWebhookHandler;
  if (pathname === '/api/order') return orderStatusHandler;
  if (pathname === '/api/reviews') return reviewsHandler;
  if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) return adminHandler;
  return null;
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const proto = (req.headers['x-forwarded-proto'] as string)?.split(',')[0] || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost';
    const incoming = new URL(req.url || '/', `${proto}://${host}`);
    // The routing rule passes the original path as ?__path=… so it survives the rewrite.
    const original = incoming.searchParams.get('__path');
    incoming.searchParams.delete('__path');
    const url = new URL(original ? `${original}${incoming.search}` : `${incoming.pathname}${incoming.search}`, incoming.origin);
    const method = req.method || 'GET';

    // Dashboard photo uploads when no database is connected (test only: /tmp is temporary)
    if (url.pathname.startsWith('/uploads/') && !hasSupabase()) {
      const file = path.join(LOCAL_UPLOAD_DIR, path.basename(url.pathname));
      if (fs.existsSync(file)) {
        res.writeHead(200, { 'Content-Type': file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : 'image/jpeg' });
        fs.createReadStream(file).pipe(res);
        return;
      }
    }

    const fn = route(url.pathname, method);
    if (!fn) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    const hasBody = !['GET', 'HEAD'].includes(method);
    const response = await fn(new Request(url, { method, headers, body: hasBody ? new Uint8Array(await readBody(req)) : undefined }));

    const out: Record<string, string | string[]> = {};
    response.headers.forEach((v, k) => {
      if (k === 'set-cookie') out[k] = [...((out[k] as string[]) ?? []), v];
      else out[k] = v;
    });
    res.writeHead(response.status, out);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    console.error('[vercel]', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }));
  }
}
