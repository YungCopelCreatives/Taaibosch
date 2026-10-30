/**
 * Emails via Resend (https://resend.com), optional.
 * Needs RESEND_API_KEY and ORDER_FROM_EMAIL (an address on a domain verified in Resend,
 * e.g. orders@taaiboschorganic.co.za). ORDER_NOTIFY_EMAIL gets new-order alerts
 * (defaults to the shop email from Dashboard > Settings).
 */

import type { StoreSettings } from '../src/types';
import type { Order } from './order';
import { deliveryPoint } from './order';

const GREEN = '#2D5A27';
const INK = '#1A2419';
const SAGE = '#F1F4F0';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const canEmail = () => Boolean(process.env.RESEND_API_KEY && process.env.ORDER_FROM_EMAIL);

async function send(to: string, subject: string, html: string, replyTo?: string) {
  if (!canEmail()) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Taaibosch Organics <${process.env.ORDER_FROM_EMAIL}>`, to: [to], subject, html, reply_to: replyTo }),
  });
  if (!res.ok) console.error('[email] send failed', res.status, await res.text());
}

function orderTable(o: Order) {
  const rows = o.lines
    .map(l => `<tr><td style="padding:8px 0">${l.quantity} × ${esc(l.name)}</td><td style="padding:8px 0;text-align:right">R${l.lineTotal}</td></tr>`)
    .join('');
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:${INK};border-collapse:collapse">
    ${rows}
    <tr><td colspan="2" style="border-top:1px solid #e5e5e5;padding-top:8px"></td></tr>
    <tr><td style="padding:4px 0;color:#6b7280">Subtotal</td><td style="text-align:right">R${o.subtotal}</td></tr>
    <tr><td style="padding:4px 0;color:#6b7280">Delivery</td><td style="text-align:right">${o.deliveryFee ? `R${o.deliveryFee}` : 'FREE'}</td></tr>
    <tr><td style="padding:8px 0;font-weight:700">Total paid</td><td style="text-align:right;font-weight:700">R${o.total}</td></tr>
  </table>`;
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:${SAGE};font-family:Inter,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:24px;padding:32px">
      <tr><td style="font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:${GREEN}">Taaibosch Organics</td></tr>
      <tr><td style="padding:12px 0 20px;font-size:24px;font-weight:600;color:${INK}">${title}</td></tr>
      <tr><td style="color:${INK};font-size:14px;line-height:1.6">${body}</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

const shopInbox = (s: StoreSettings) => process.env.ORDER_NOTIFY_EMAIL || s.email;

export async function sendOrderEmails(o: Order, s: StoreSettings) {
  const courier = s.couriers.find(c => c.id === o.delivery.courier);
  const where = esc(deliveryPoint(o.delivery));

  const customerHtml = shell(
    `Thank you, ${esc(o.delivery.fullName.split(' ')[0])}. Your order is confirmed.`,
    `<p>We've received your payment for order <strong>${o.ref}</strong> and are preparing it with care.</p>
     ${orderTable(o)}
     <p style="margin-top:20px"><strong>Delivery:</strong> ${esc(courier?.label ?? o.delivery.courier)} (${esc(courier?.eta ?? '')})<br/>${where}</p>
     <p>Once your parcel is handed to the courier we'll send your tracking link to ${esc(o.delivery.contactNumber)} by ${o.delivery.trackingVia === 'sms' ? 'SMS' : o.delivery.trackingVia === 'both' ? 'WhatsApp and SMS' : 'WhatsApp'}. Questions? Reply to this email or WhatsApp us on ${esc(s.whatsappNumber)}.</p>`,
  );

  const shopHtml = shell(
    `New paid order ${o.ref} — R${o.total}`,
    `${orderTable(o)}
     <p style="margin-top:20px">
       <strong>Customer:</strong> ${esc(o.delivery.fullName)}<br/>
       <strong>Phone:</strong> ${esc(o.delivery.contactNumber)}<br/>
       <strong>Email:</strong> ${esc(o.delivery.email)}<br/>
       <strong>Courier:</strong> ${esc(o.delivery.courier)}<br/>
       <strong>Send tracking by:</strong> ${esc(o.delivery.trackingVia ?? 'whatsapp')}<br/>
       <strong>Deliver to:</strong> ${where}
     </p>
     <p>Manage it in the dashboard under Orders.</p>`,
  );

  await Promise.all([
    send(o.delivery.email, `Order confirmed – ${o.ref}`, customerHtml, shopInbox(s)),
    send(shopInbox(s), `💳 New paid order ${o.ref} – R${o.total}`, shopHtml, o.delivery.email),
  ]);
}

export async function sendDispatchEmail(o: Order & { trackingNumber?: string }, s: StoreSettings) {
  const courier = s.couriers.find(c => c.id === o.delivery.courier);
  await send(
    o.delivery.email,
    `Your Taaibosch order ${o.ref} is on its way`,
    shell(
      'Your order is on its way 🌿',
      `<p>Hi ${esc(o.delivery.fullName.split(' ')[0])}, order <strong>${o.ref}</strong> has been handed to ${esc(courier?.label ?? o.delivery.courier)}.</p>
       ${o.trackingNumber ? (/^https?:\/\//.test(o.trackingNumber)
         ? `<p><a href="${esc(o.trackingNumber)}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Track your parcel</a></p>`
         : `<p style="font-size:16px"><strong>Tracking number:</strong> ${esc(o.trackingNumber)}</p>`) : ''}
       <p>Expected delivery: ${esc(courier?.eta ?? 'a few working days')}.<br/>${esc(deliveryPoint(o.delivery))}</p>
       <p>Questions? Reply to this email or WhatsApp us on ${esc(s.whatsappNumber)}.</p>`,
    ),
    shopInbox(s),
  );
}

export async function sendTeamInvite(to: string, name: string, tempPassword: string, loginUrl: string) {
  await send(
    to,
    'Your Taaibosch dashboard login',
    shell(
      `Welcome to the team${name ? `, ${esc(name)}` : ''}`,
      `<p>An account has been created for you on the Taaibosch Organics dashboard.</p>
       <p><strong>Login:</strong> <a href="${loginUrl}">${loginUrl}</a><br/><strong>Email:</strong> ${esc(to)}<br/>
       <strong>Temporary password:</strong> <code style="font-size:15px">${esc(tempPassword)}</code></p>
       <p>You'll be asked to set up your profile and choose your own password when you first sign in.</p>`,
    ),
  );
}
