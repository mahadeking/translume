import { getSupabase, isCloud } from "./supabase";

export async function signUp(email: string, password: string) {
  return getSupabase().auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export async function signInWithGoogle() {
  return getSupabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/home` : undefined,
    },
  });
}

/** Current user id, or null when not signed in / not in cloud mode. */
export async function currentUserId(): Promise<string | null> {
  if (!isCloud()) return null;
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

/** Save the user's display name to auth metadata (full_name). */
export async function updateDisplayName(name: string) {
  return getSupabase().auth.updateUser({ data: { full_name: name } });
}

/** Permanently delete the signed-in user's account and all their data. */
export async function deleteMyAccount(): Promise<{ ok: boolean; message?: string }> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false, message: "You're not signed in." };
  const res = await fetch("/api/account/delete", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: body.message ?? "Couldn't delete your account." };
  return { ok: true };
}
