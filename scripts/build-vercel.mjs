/**
 * Vercel build: turns the normal build into Vercel's Build Output API format.
 *   .vercel/output/static            -> the shop (dist/)
 *   .vercel/output/functions/api/... -> one Node function for every /api route
 *   .vercel/output/config.json       -> routing (files first, /api to the function, everything else to the app)
 * GoDaddy and local development don't use this.
 */
import { build } from 'esbuild';
import fs from 'node:fs';

const OUT = '.vercel/output';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(`${OUT}/static`, { recursive: true });
fs.cpSync('dist', `${OUT}/static`, { recursive: true });

const fnDir = `${OUT}/functions/api/router.func`;
fs.mkdirSync(fnDir, { recursive: true });
await build({
  entryPoints: ['server/vercel.ts'],
  outfile: `${fnDir}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // some dependencies still use require(); give the ESM bundle a require()
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'info',
});
fs.writeFileSync(`${fnDir}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: false,
  maxDuration: 30,
}, null, 2));

fs.writeFileSync(`${OUT}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    { src: '^/assets/(.*)$', headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=86400' }, continue: true },
    { handle: 'filesystem' },
    { src: '^/api/(.*)$', dest: '/api/router?__path=/api/$1' },
    { src: '^/uploads/(.*)$', dest: '/api/router?__path=/uploads/$1' },
    { src: '^/(.*)$', dest: '/index.html' },
  ],
}, null, 2));
console.log('Vercel output ready in', OUT);
