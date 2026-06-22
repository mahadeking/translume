-- Translume — Call-to-action button on recordings. Additive & idempotent.

alter table public.recordings add column if not exists cta_label  text;
alter table public.recordings add column if not exists cta_url    text;
alter table public.recordings add column if not exists cta_clicks int not null default 0;

-- Atomic CTA click counter (anonymous viewers can call it; they can't update
-- the row directly under RLS).
create or replace function public.increment_cta_clicks(rec_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.recordings set cta_clicks = cta_clicks + 1 where id = rec_id;
$$;

grant execute on function public.increment_cta_clicks(text) to anon, authenticated;
