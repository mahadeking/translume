# Connecting Translume to Supabase

Translume runs **local-first** — recordings live in the browser's IndexedDB, so
the app works with zero setup. Adding Supabase upgrades it to a real cloud
backend with **email/password accounts**, **per-user private libraries**, and
**cross-device share links** that work for anyone you send them to.

> The integration is **already built**. The app auto-detects the env vars below
> and routes every data call to Supabase instead of IndexedDB — no code changes.
> Two steps: run the schema, add the keys.

## 1. Create a project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy the **Project URL** and **anon public key** from
   *Project Settings → API*. (The anon key is a publishable client key — safe to
   ship in the browser bundle.)

## 2. Run the schema
Open the **SQL Editor** in the Supabase dashboard, paste the entire contents of
[`schema.sql`](./schema.sql), and run it. This creates the `recordings`,
`comments`, and `folders` tables, the `increment_views` function, permissive
(anonymous-mode) RLS policies, and a **public `recordings` storage bucket** for
the video files.

## 3. Add environment variables
Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Restart `npm run dev`. The sidebar badge now reads **Cloud workspace**, uploads
go to Supabase Storage, and `/v/<id>` links open on any device or browser.

## How it works
- `src/lib/store.ts` is the only data surface the UI touches. It calls
  `isCloud()` (`src/lib/supabase.ts`) and routes to either the **local** provider
  (`src/lib/local.ts`, IndexedDB) or the **cloud** provider (`src/lib/cloud.ts`,
  Supabase). Same function signatures, so components never change.
- Videos upload to the public `recordings` bucket; `getObjectURL` returns the
  bucket's public URL. Metadata, comments, transcript, and AI results live in
  Postgres.

## Security note (anonymous mode)
The RLS policies allow anyone with the anon key to read/insert/delete. That's
appropriate for a personal tool or trusted team. To add accounts later, scope
the policies to `auth.uid()` and add a Supabase Auth login flow — the storage +
table shapes already support an `owner` column pattern.
