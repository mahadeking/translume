import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const BUCKET = "recordings";

/** True when Supabase env vars are present — the app runs in cloud mode. */
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
      auth: { persistSession: false },
    });
  }
  return client;
}
