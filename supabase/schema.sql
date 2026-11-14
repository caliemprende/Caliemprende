-- Cali Emprende: ejecutar en Supabase > SQL Editor > New query.
-- Este script es idempotente: se puede volver a ejecutar sin duplicar tablas ni políticas.
create extension if not exists pgcrypto;

-- Directorio de emprendimientos.
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  city text not null default 'Cali',
  whatsapp text not null,
  email text not null,
  description text,
  instagram_url text,
  image_urls text[] not null default '{}',
  plan text not null default 'Gratis',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Completa instalaciones anteriores sin borrar información existente.
alter table public.businesses add column if not exists category text;
alter table public.businesses add column if not exists city text default 'Cali';
alter table public.businesses add column if not exists whatsapp text;
alter table public.businesses add column if not exists email text;
alter table public.businesses add column if not exists description text;
alter table public.businesses add column if not exists instagram_url text;
alter table public.businesses add column if not exists image_urls text[] not null default '{}';
alter table public.businesses add column if not exists plan text default 'Gratis';
alter table public.businesses add column if not exists status text default 'pending';
alter table public.businesses add column if not exists created_at timestamptz default now();

-- Intentos de pago. Los importes se almacenan en centavos de COP.
create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  business_id uuid references public.businesses(id) on delete set null,
  plan text not null check (plan in ('Emprendedor','Destacado')),
  amount_in_cents bigint not null,
  currency text not null default 'COP',
  status text not null default 'PENDING',
  wompi_transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agenda de eventos publicados desde el panel administrativo.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Cultura',
  description text,
  venue text not null,
  starts_at timestamptz not null,
  ticket_url text,
  latitude double precision,
  longitude double precision,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists businesses_status_created_idx on public.businesses(status, created_at desc);
create index if not exists payment_attempts_business_idx on public.payment_attempts(business_id);
create index if not exists events_published_starts_idx on public.events(published, starts_at);

-- Seguridad: el público solo puede leer negocios aprobados y eventos publicados.
alter table public.businesses enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.events enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='businesses' and policyname='Public can view approved businesses') then
    create policy "Public can view approved businesses"
      on public.businesses for select to anon, authenticated using (status='approved');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='events' and policyname='Public can view published events') then
    create policy "Public can view published events"
      on public.events for select to anon, authenticated using (published=true);
  end if;
end $$;

revoke all on public.payment_attempts from anon, authenticated;
revoke insert, update, delete on public.businesses from anon, authenticated;
revoke insert, update, delete on public.events from anon, authenticated;
grant select on public.businesses to anon, authenticated;
grant select on public.events to anon, authenticated;

-- Almacenamiento público de fotografías de negocios.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-photos', 'business-photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = 3145728,
    allowed_mime_types = array['image/jpeg','image/png','image/webp'];

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Public can view business photos') then
    create policy "Public can view business photos"
      on storage.objects for select to anon, authenticated using (bucket_id='business-photos');
  end if;
end $$;
