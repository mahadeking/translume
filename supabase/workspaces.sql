-- Translume — Team workspaces (Phase 2). ADDITIVE & idempotent: safe to re-run.
-- This never modifies the existing recordings/folders/comments policies; it only
-- adds new tables, a nullable recordings.workspace_id column, ONE extra (OR-ed,
-- access-granting) recordings SELECT policy, and helper RPC functions.

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------
create table if not exists public.workspaces (
  id         text primary key,
  name       text not null default 'My workspace',
  owner      uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.workspace_invites (
  token        text primary key,
  workspace_id text not null references public.workspaces (id) on delete cascade,
  created_by   uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz
);

alter table public.recordings add column if not exists workspace_id text;
create index if not exists recordings_workspace_idx on public.recordings (workspace_id);

-- ----------------------------------------------------------------------------
-- RLS — new tables only
-- ----------------------------------------------------------------------------
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;

drop policy if exists "ws read"   on public.workspaces;
drop policy if exists "ws insert" on public.workspaces;
drop policy if exists "ws update" on public.workspaces;
drop policy if exists "ws delete" on public.workspaces;
create policy "ws read" on public.workspaces for select using (
  owner = auth.uid()
  or id in (select workspace_id from public.workspace_members where user_id = auth.uid())
);
create policy "ws insert" on public.workspaces for insert with check (owner = auth.uid());
create policy "ws update" on public.workspaces for update using (owner = auth.uid()) with check (owner = auth.uid());
create policy "ws delete" on public.workspaces for delete using (owner = auth.uid());

-- Members can read their OWN membership rows (no self-recursion). Member lists
-- for a whole workspace are served by the security-definer function below.
drop policy if exists "wm read self" on public.workspace_members;
create policy "wm read self" on public.workspace_members for select using (user_id = auth.uid());

drop policy if exists "wi read"   on public.workspace_invites;
drop policy if exists "wi insert" on public.workspace_invites;
create policy "wi read" on public.workspace_invites for select using (
  workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
);
create policy "wi insert" on public.workspace_invites for insert with check (
  created_by = auth.uid()
  and workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
);

-- Additional, access-GRANTING SELECT policy on recordings: workspace members can
-- view recordings shared into a workspace they belong to. Combines via OR with
-- the existing "read recordings" policy, so it can only widen access.
drop policy if exists "read workspace recordings" on public.recordings;
create policy "read workspace recordings" on public.recordings for select using (
  workspace_id is not null
  and workspace_id in (select workspace_id from public.workspace_members where user_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- RPC helpers (security definer keeps RLS simple and avoids recursion)
-- ----------------------------------------------------------------------------

-- Get the caller's workspace, creating a default one (with them as owner) if none.
create or replace function public.ensure_my_workspace()
returns public.workspaces
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ws  public.workspaces;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select w.* into ws from public.workspaces w
    where w.id in (select workspace_id from public.workspace_members where user_id = uid)
    order by w.created_at asc limit 1;
  if ws.id is null then
    insert into public.workspaces (id, name, owner)
      values (replace(gen_random_uuid()::text, '-', ''), 'My workspace', uid)
      returning * into ws;
    insert into public.workspace_members (workspace_id, user_id, role)
      values (ws.id, uid, 'owner');
  end if;
  return ws;
end; $$;

-- Create an invite token for a workspace the caller belongs to.
create or replace function public.create_workspace_invite(ws_id text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  tok text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.workspace_members where workspace_id = ws_id and user_id = uid) then
    raise exception 'not a member';
  end if;
  tok := replace(gen_random_uuid()::text, '-', '');
  insert into public.workspace_invites (token, workspace_id, created_by, expires_at)
    values (tok, ws_id, uid, now() + interval '30 days');
  return tok;
end; $$;

-- Invite info for the join page (any authenticated user, token is the secret).
create or replace function public.get_invite_info(invite_token text)
returns table (workspace_id text, workspace_name text, valid boolean)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select i.workspace_id, w.name, (i.expires_at is null or i.expires_at > now())
  from public.workspace_invites i
  join public.workspaces w on w.id = i.workspace_id
  where i.token = invite_token;
end; $$;

-- Accept an invite: add the caller to the workspace. Returns the workspace id.
create or replace function public.accept_workspace_invite(invite_token text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ws  text;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select workspace_id into ws from public.workspace_invites
    where token = invite_token and (expires_at is null or expires_at > now());
  if ws is null then raise exception 'invalid or expired invite'; end if;
  insert into public.workspace_members (workspace_id, user_id, role)
    values (ws, uid, 'member')
    on conflict (workspace_id, user_id) do nothing;
  return ws;
end; $$;

-- Member list (with emails) for a workspace the caller belongs to.
create or replace function public.workspace_members_list(ws_id text)
returns table (user_id uuid, email text, role text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.workspace_members m2 where m2.workspace_id = ws_id and m2.user_id = auth.uid()) then
    raise exception 'not a member';
  end if;
  return query
  select m.user_id, u.email::text, m.role, m.created_at
  from public.workspace_members m
  join auth.users u on u.id = m.user_id
  where m.workspace_id = ws_id
  order by m.created_at asc;
end; $$;

grant execute on function public.ensure_my_workspace()            to authenticated;
grant execute on function public.create_workspace_invite(text)    to authenticated;
grant execute on function public.get_invite_info(text)            to authenticated;
grant execute on function public.accept_workspace_invite(text)    to authenticated;
grant execute on function public.workspace_members_list(text)     to authenticated;
