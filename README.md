# Taaibosch Organics

Online shop for Taaibosch Organics with Yoco card checkout and a team dashboard at **/admin**.
Built with React, Vite and Tailwind; one small Node/Express server runs the shop, the dashboard and the API.

## What's inside

| Area | What it does |
| --- | --- |
| Shop | Products, filters, cart, 3-step checkout, Yoco payment, confirmation pages, WhatsApp/EFT option |
| `/admin` | Team dashboard: overview & sales, orders (packing, dispatch, tracking emails, CSV export), products (prices, stock, photos, show/hide, order), reviews moderation, settings (contact details, delivery fee, couriers, shop filters, home-page announcement), team logins with roles |
| `server/` | API: checkout (re-prices every order server-side), Yoco webhook (signature-verified), dashboard API |
| `supabase/schema.sql` | Database tables (products, settings, orders, reviews, team) and the photo bucket |

**Roles:** *Owner* (everything), *Manager* (everything except the team), *Orders & packing* (orders only).
New team members get a temporary password; on first sign-in they fill in their profile (name, what to call them,
job title, mobile) and choose their own password. The dashboard then greets them by name.

## Hosting on GoDaddy (www.taaiboschorganic.co.za)

Uses GoDaddy's Node.js app hosting (Express on Node 22). Needs a GoDaddy **Web Hosting** plan with a free app slot
(Economy = 1 app). Register the domain at GoDaddy too so it connects in one click.

1. **Domain** – register `taaiboschorganic.co.za` in the client's name and complete the verification email the same day
   (unverified .co.za domains get suspended).
2. **Database** – create a free Supabase project for Taaibosch, open *SQL Editor*, paste `supabase/schema.sql`, run it.
3. **App** – in GoDaddy's Node.js hosting, create an app from this GitHub repo (or upload the project zip).
   GoDaddy detects Express, runs `npm install`, `npm run build`, then starts it with `npm start`
   (`node dist-server/server.js`, listening on the `PORT` GoDaddy provides).
4. **Environment variables** – add the values from `.env.example` as the app's `.env` (start with the Yoco **test** key).
5. **Preview** – check the private preview link works (shop loads, `/admin` sign-in page appears).
6. **Publish** – publish to the Web Hosting plan and connect `taaiboschorganic.co.za` (one click for a GoDaddy domain).
   Use `www.` as the main address; HTTPS is automatic.
7. **Yoco webhook** – once the domain works, run once and add the printed `YOCO_WEBHOOK_SECRET` line to the `.env`:
   ```bash
   YOCO_SECRET_KEY=sk_test_... node scripts/register-yoco-webhook.mjs https://www.taaiboschorganic.co.za
   ```
8. **First sign-in** – go to `/admin`, sign in with `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD`,
   complete the profile, then remove those two variables. The starter products are copied into the database the
   first time the Products page opens.
9. **Test order** with the Yoco test key, then switch to the live key (and register the webhook again with the live key).

GoDaddy also offers MySQL; this site uses Supabase instead, because product photos and orders must survive redeploys.

## Run locally

```bash
npm install
cp .env.example .env.local   # Supabase is optional locally: data goes to ./.data
npm run dev                  # http://localhost:3000  ·  dashboard: http://localhost:3000/admin
```

`npm run build && npm start` runs the production build the same way GoDaddy does.
