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
