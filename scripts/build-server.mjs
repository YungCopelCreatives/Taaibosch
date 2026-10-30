/**
 * Bundles server.ts (+ /server) into dist-server/server.js so production can run
 * with plain Node (no TypeScript tooling needed). npm packages stay external.
 */
import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  outfile: 'dist-server/server.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
