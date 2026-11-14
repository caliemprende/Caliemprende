-- El sabor de Cali: votacion semanal de restaurantes aprobados
create table if not exists public.restaurant_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  constraint restaurant_votes_one_per_user_week unique(user_id, week_start)
);
create index if not exists restaurant_votes_week_business_idx on public.restaurant_votes(week_start, business_id);
alter table public.restaurant_votes enable row level security;
drop policy if exists "Everyone can read restaurant votes" on public.restaurant_votes;
create policy "Everyone can read restaurant votes" on public.restaurant_votes
  for select to anon, authenticated using (true);
drop policy if exists "Users vote once for approved restaurants weekly" on public.restaurant_votes;
create policy "Users vote once for approved restaurants weekly" on public.restaurant_votes
  for insert to authenticated with check (
    auth.uid() = user_id and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.status = 'approved'
      and lower(b.category) in ('gastronomía','gastronomia','restaurantes')
    )
  );
