-- Cali Emprende: actualizar los planes permitidos en pagos existentes.
alter table public.payment_attempts
  drop constraint if exists payment_attempts_plan_check;

alter table public.payment_attempts
  add constraint payment_attempts_plan_check
  check (plan in ('Emprendedor', 'Destacado'));
