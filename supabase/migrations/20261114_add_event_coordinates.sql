-- Coordenadas opcionales para ubicar cada evento en el mapa de Cali.
alter table public.events
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
