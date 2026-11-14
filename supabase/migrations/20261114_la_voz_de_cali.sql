-- La voz de Cali: nominaciones y votacion semanal
create table if not exists public.song_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text not null,
  listen_url text,
  created_at timestamptz not null default now(),
  constraint song_title_length check (char_length(title) between 1 and 120),
  constraint song_artist_length check (char_length(artist) between 1 and 120),
  constraint song_url_length check (listen_url is null or char_length(listen_url) <= 500)
);
create index if not exists song_suggestions_created_idx on public.song_suggestions(created_at desc);
alter table public.song_suggestions enable row level security;
drop policy if exists "Everyone can read song suggestions" on public.song_suggestions;
create policy "Everyone can read song suggestions" on public.song_suggestions for select to anon, authenticated using (true);
drop policy if exists "Signed-in users suggest songs" on public.song_suggestions;
create policy "Signed-in users suggest songs" on public.song_suggestions for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.song_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id uuid not null references public.song_suggestions(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);
create index if not exists song_votes_song_week_idx on public.song_votes(song_id, week_start);
alter table public.song_votes enable row level security;
drop policy if exists "Everyone can read weekly song votes" on public.song_votes;
create policy "Everyone can read weekly song votes" on public.song_votes for select to anon, authenticated using (true);
drop policy if exists "Signed-in users vote once weekly" on public.song_votes;
create policy "Signed-in users vote once weekly" on public.song_votes for insert to authenticated with check (auth.uid() = user_id);
