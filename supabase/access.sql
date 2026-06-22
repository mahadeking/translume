-- Translume — per-recording access controls (optional). Additive & idempotent.
--   * expires_at      : link stops working after this time (owner still sees it)
--   * allow_download  : hide the download option for viewers when false
--   * password        : stored in a separate table NO client can read; only the
--                       security-definer RPCs below touch it.

alter table public.recordings add column if not exists expires_at         timestamptz;
alter table public.recordings add column if not exists allow_download     boolean not null default true;
alter table public.recordings add column if not exists password_protected boolean not null default false;

create table if not exists public.recording_passwords (
  recording_id text primary key references public.recordings (id) on delete cascade,
  password     text not null
);
-- RLS on with NO policies => all direct client access denied. Only the
-- security-definer functions below can read/write it.
alter table public.recording_passwords enable row level security;

-- Owner sets/clears the password; also flips the public `password_protected` flag.
create or replace function public.set_recording_password(rec_id text, pw text)
returns void
language plpgsql security definer set search_path = public as $FN$
begin
  if not exists (select 1 from public.recordings where id = rec_id and owner = auth.uid()) then
    raise exception 'not owner';
  end if;
  if pw is null or length(trim(pw)) = 0 then
    delete from public.recording_passwords where recording_id = rec_id;
    update public.recordings set password_protected = false where id = rec_id;
  else
    insert into public.recording_passwords (recording_id, password)
      values (rec_id, pw)
      on conflict (recording_id) do update set password = excluded.password;
    update public.recordings set password_protected = true where id = rec_id;
  end if;
end; $FN$;

-- Viewers verify a password without ever reading it. Returns true when correct
-- (or when no password is set).
create or replace function public.check_recording_password(rec_id text, pw text)
returns boolean
language plpgsql security definer set search_path = public as $FN$
declare stored text;
begin
  select password into stored from public.recording_passwords where recording_id = rec_id;
  if stored is null then return true; end if;
  return stored = pw;
end; $FN$;

grant execute on function public.set_recording_password(text, text)   to authenticated;
grant execute on function public.check_recording_password(text, text) to anon, authenticated;
