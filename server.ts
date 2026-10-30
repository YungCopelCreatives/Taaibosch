/**
 * Taaibosch web server: serves the shop, the dashboard and the API.
 *   Development: npm run dev           (Vite with hot reload)
 *   Production:  npm run build && npm start   (GoDaddy runs this)
 */

import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { catalogHandler, checkoutHandler, yocoWebhookHandler, orderStatusHandler, reviewsHandler } from './server/handlers';
import { adminHandler } from './server/admin';
import { LOCAL_UPLOAD_DIR, hasSupabase } from './server/db';

dotenv.config({ path: ['.env.local', '.env'], quiet: true });
const isDev = process.argv.includes('--dev');
if (!isDev) process.env.NODE_ENV = 'production';

type Handler = (req: Request) => Promise<Response>;

/** Adapts a web-standard handler to Express, keeping the raw body intact (needed for webhook signatures). */
const adapt = (handler: Handler): express.RequestHandler => async (req, res, next) => {
  try {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const response = await handler(
      new Request(url, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: hasBody && Buffer.isBuffer(req.body) ? req.body : undefined,
      }),
    );
    res.status(response.status);
    response.headers.forEach((v, k) => (k.toLowerCase() === 'set-cookie' ? res.append('Set-Cookie', v) : res.setHeader(k, v)));
    res.send(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    next(e);
  }
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  app.set('trust proxy', true); // GoDaddy serves the app behind Cloudflare (correct https + client IP)
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  app.use('/api', express.raw({ type: () => true, limit: '6mb' }));
  app.get('/api/catalog', adapt(catalogHandler));
  app.post('/api/checkout', adapt(checkoutHandler));
  app.post('/api/yoco-webhook', adapt(yocoWebhookHandler));
  app.get('/api/order', adapt(orderStatusHandler));
  app.all('/api/reviews', adapt(reviewsHandler));
  app.all(/^\/api\/admin(\/.*)?$/, adapt(adminHandler));
  app.all(/^\/api\/.*/, (_req, res) => res.status(404).json({ error: 'Not found' }));

  // Product photos uploaded in the dashboard when running without Supabase (development only)
  if (!hasSupabase()) app.use('/uploads', express.static(LOCAL_UPLOAD_DIR, { maxAge: '7d' }));

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    // dist-server/server.js sits next to dist/, so this works whatever folder the host starts us in
    const distPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
    app.use(express.static(distPath, { maxAge: '7d', index: false }));
    app.get(/.*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    if (!hasSupabase()) console.warn('[taaibosch] SUPABASE_URL is not set: orders and dashboard data are stored in ./.data, which is NOT kept between deploys.');
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Taaibosch running on http://localhost:${PORT}${isDev ? ' (dev)' : ''}`));
}

startServer();
