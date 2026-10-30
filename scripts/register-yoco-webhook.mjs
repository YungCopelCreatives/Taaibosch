#!/usr/bin/env node
/**
 * One-time setup: tells Yoco where to send payment notifications.
 *
 *   YOCO_SECRET_KEY=sk_live_... node scripts/register-yoco-webhook.mjs https://your-domain.co.za
 *
 * Copy the printed secret into YOCO_WEBHOOK_SECRET in the GoDaddy app's .env. Yoco shows it only once.
 */
const site = (process.argv[2] || process.env.SITE_URL || '').replace(/\/$/, '');
const key = process.env.YOCO_SECRET_KEY;
if (!site || !key) {
  console.error('Usage: YOCO_SECRET_KEY=sk_... node scripts/register-yoco-webhook.mjs https://your-domain.co.za');
  process.exit(1);
}

const res = await fetch('https://payments.yoco.com/api/webhooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify({ name: 'taaibosch-orders', url: `${site}/api/yoco-webhook` }),
});
const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error('Yoco returned', res.status, data);
  process.exit(1);
}
console.log('Webhook registered for', `${site}/api/yoco-webhook`);
console.log('\nYOCO_WEBHOOK_SECRET=' + data.secret + '\n');
console.log('Add that line to the GoDaddy app's environment variables (.env), then redeploy.');
