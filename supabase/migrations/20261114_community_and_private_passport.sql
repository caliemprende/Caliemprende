-- Comunidad y pasaporte turístico privado de Cali Emprende
-- Requiere Supabase Auth habilitado.
create table if not exists public.place_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_slug text not null,
  visited boolean not null default false,
  photo_path text,
  visited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, place_slug),
  constraint place_visits_slug_length check (char_length(place_slug) between 1 and 100)
);
alter table public.place_visits enable row level security;
drop policy if exists "Users manage their own visits" on public.place_visits;
create policy "Users manage their own visits" on public.place_visits
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.place_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_slug text not null,
  display_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint place_comments_name_length check (char_length(display_name) between 1 and 40),
  constraint place_comments_content_length check (char_length(content) between 1 and 1000)
);
create index if not exists place_comments_place_created_idx
  on public.place_comments (place_slug, created_at desc);
alter table public.place_comments enable row level security;
drop policy if exists "Everyone can read place comments" on public.place_comments;
create policy "Everyone can read place comments" on public.place_comments
  for select to anon, authenticated using (true);
drop policy if exists "Signed-in users can comment" on public.place_comments;
create policy "Signed-in users can comment" on public.place_comments
  for insert to authenticated with check (auth.uid() = user_id);

create table if not exists public.place_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_slug text not null,
  reaction text not null,
  created_at timestamptz not null default now(),
  unique (user_id, place_slug, reaction),
  constraint place_reactions_allowed check (reaction in ('like','love','wow','useful'))
);
create index if not exists place_reactions_place_idx on public.place_reactions (place_slug);
alter table public.place_reactions enable row level security;
drop policy if exists "Everyone can read place reactions" on public.place_reactions;
create policy "Everyone can read place reactions" on public.place_reactions
  for select to anon, authenticated using (true);
drop policy if exists "Users manage own place reactions" on public.place_reactions;
create policy "Users manage own place reactions" on public.place_reactions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fotos del pasaporte: bucket privado, cada usuario solo accede a su propia carpeta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pasaporte-cali-privado', 'pasaporte-cali-privado', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];
drop policy if exists "Users upload own passport photos" on storage.objects;
create policy "Users upload own passport photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'pasaporte-cali-privado' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users read own passport photos" on storage.objects;
create policy "Users read own passport photos" on storage.objects
  for select to authenticated using (bucket_id = 'pasaporte-cali-privado' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update own passport photos" on storage.objects;
create policy "Users update own passport photos" on storage.objects
  for update to authenticated using (bucket_id = 'pasaporte-cali-privado' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'pasaporte-cali-privado' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete own passport photos" on storage.objects;
create policy "Users delete own passport photos" on storage.objects
  for delete to authenticated using (bucket_id = 'pasaporte-cali-privado' and (storage.foldername(name))[1] = auth.uid()::text);
