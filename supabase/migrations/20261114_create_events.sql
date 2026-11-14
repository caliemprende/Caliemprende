-- Cali Emprende: agenda de eventos de la ciudad
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Cultura',
  description text not null default '',
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  ticket_url text,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists events_published_starts_at_idx
  on public.events (published, starts_at);
alter table public.events enable row level security;
drop policy if exists "Public can read published future events" on public.events;
create policy "Public can read published future events"
  on public.events for select to anon, authenticated
  using (published = true and starts_at >= now());
