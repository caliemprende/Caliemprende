-- Ejecutar una sola vez en Supabase SQL Editor.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  city text not null default 'Cali',
  whatsapp text not null,
  email text not null,
  description text,
  plan text not null default 'Gratis',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.businesses add column if not exists whatsapp text;
alter table public.businesses add column if not exists email text;
alter table public.businesses add column if not exists category text;
alter table public.businesses add column if not exists city text default 'Cali';
alter table public.businesses add column if not exists description text;
alter table public.businesses add column if not exists plan text default 'Gratis';
alter table public.businesses add column if not exists status text default 'pending';
alter table public.businesses add column if not exists created_at timestamptz default now();

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  business_id uuid references public.businesses(id) on delete set null,
  plan text not null check (plan in ('Publicación','Destacado')),
  amount_in_cents bigint not null,
  currency text not null default 'COP',
  status text not null default 'PENDING',
  wompi_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.businesses enable row level security;
alter table public.payment_attempts enable row level security;
-- Las escrituras se realizan exclusivamente desde las rutas de servidor.
revoke all on public.payment_attempts from anon, authenticated;
grant select on public.businesses to anon, authenticated;
