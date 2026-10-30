-- Taaibosch Organics database. Run once in Supabase > SQL Editor > New query.
-- Safe to re-run. Only the website server (service role key) talks to these
-- tables, so Row Level Security is on with no public policies.

-- Products (managed in Dashboard > Products)
create table if not exists public.products (
  id          text primary key,
  data        jsonb not null,          -- name, price, photos, descriptions, filters...
  active      boolean not null default true,
  stock       integer,                 -- null = not tracked
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.products enable row level security;

-- Atomic stock change used when an order is paid
create or replace function public.adjust_stock(product_id text, delta integer)
returns void language sql security definer set search_path = public as $$
  update public.products set stock = greatest(0, stock + delta), updated_at = now()
  where id = product_id and stock is not null;
$$;
revoke all on function public.adjust_stock(text, integer) from public, anon, authenticated;

-- Store settings (Dashboard > Settings), single row
create table if not exists public.settings (
  id          int primary key default 1 check (id = 1),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.settings enable row level security;

-- Orders
create table if not exists public.orders (
  ref               text primary key,
  status            text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  fulfilment_status text not null default 'new' check (fulfilment_status in ('new','packing','dispatched','delivered','cancelled')),
  tracking_number   text,               -- courier tracking link or waybill
  tracking_sent_at  timestamptz,        -- when the team sent it to the customer
  tracking_sent_via text,               -- whatsapp / sms / email
  admin_notes       text,
  checkout_id       text unique,
  payment_id        text,
  lines             jsonb not null,
  subtotal          numeric(10,2) not null,
  delivery_fee      numeric(10,2) not null,
  total             numeric(10,2) not null,
  customer_name     text not null,
  customer_email    text not null,
  customer_phone    text not null,
  courier           text not null,
  delivery          jsonb not null,
  created_at        timestamptz not null default now(),
  paid_at           timestamptz,
  updated_at        timestamptz
);
-- (upgrades an orders table created by an earlier version of this file)
alter table public.orders add column if not exists fulfilment_status text not null default 'new';
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists admin_notes text;
alter table public.orders add column if not exists updated_at timestamptz;
alter table public.orders add column if not exists tracking_sent_at timestamptz;
alter table public.orders add column if not exists tracking_sent_via text;
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status, fulfilment_status);
alter table public.orders enable row level security;

-- Customer reviews (approve in Dashboard > Reviews)
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null,
  user_name   text not null,
  rating      int  not null check (rating between 1 and 5),
  comment     text not null,
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists reviews_product_idx on public.reviews (product_id) where approved;
alter table public.reviews enable row level security;

-- Dashboard team
create table if not exists public.admin_users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique,
  password_hash         text not null,
  role                  text not null check (role in ('owner','manager','fulfilment')),
  first_name            text,
  last_name             text,
  display_name          text,
  job_title             text,
  phone                 text,
  onboarded             boolean not null default false,
  must_change_password  boolean not null default true,
  active                boolean not null default true,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Server-only values, e.g. the Yoco webhook secret saved by Dashboard > Settings > Payments
create table if not exists public.secrets (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);
alter table public.secrets enable row level security;

-- Public bucket for product photos uploaded in the dashboard
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Newer Supabase projects don't expose new tables to the API automatically.
-- Only the website server (service role) gets access; the public keys stay locked out.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.products, public.settings, public.orders, public.reviews, public.admin_users, public.secrets to service_role;
grant execute on function public.adjust_stock(text, integer) to service_role;
