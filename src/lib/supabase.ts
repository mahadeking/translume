import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The Supabase project URL + anon (publishable) key.
//
// The anon key is designed to be exposed in client code — it's already shipped
// in every browser bundle and is protected by Row Level Security. We read it
// from env vars when present, fall back to the project's published values, and
// .trim() to defend against stray whitespace/BOM that some env tooling injects
// (which otherwise breaks fetch with "non ISO-8859-1 code point" header errors).
const URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kzpjcgfjxxuiojvncvrl.supabase.co"
).trim();
const ANON = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGpjZ2ZqeHh1aW9qdm5jdnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NjAzNjMsImV4cCI6MjA5NzUzNjM2M30.6I7ousIzt-Z1PuNxM5s6E24hQemCB0wHVsQGXtJyacE"
).trim();

export const BUCKET = "recordings";

/** True when Supabase is configured — the app runs in cloud mode. */
export function isCloud(): boolean {
  return Boolean(URL && ANON);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!URL || !ANON) {
    throw new Error("Supabase is not configured (missing env vars).");
  }
  if (!client) {
    client = createClient(URL, ANON, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return client;
}
