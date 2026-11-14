-- Perfil visual de negocios en Cali Emprende
alter table public.businesses
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists instagram_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-photos', 'business-photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
