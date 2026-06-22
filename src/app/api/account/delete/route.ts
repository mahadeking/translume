import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kzpjcgfjxxuiojvncvrl.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "recordings";

// Permanently deletes the *caller's own* account and all their data.
// Requires the service-role key (server-only secret) to call the admin API.
// The user is identified by their own access token, so they can only delete
// themselves — never another account.
export async function POST(req: Request) {
  if (!SERVICE_KEY) {
    return Response.json(
      {
        error: "not_configured",
        message:
          "Account deletion isn't enabled yet. Add SUPABASE_SERVICE_ROLE_KEY to the server environment (Vercel → Settings → Environment Variables).",
      },
      { status: 501 }
    );
  }

  const authz = req.headers.get("authorization") ?? "";
  const token = authz.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Identify the caller from their token — this is who gets deleted.
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const uid = userData.user.id;

  // Best-effort: remove their video files from storage before the rows cascade.
  try {
    const { data: recs } = await admin
      .from("recordings")
      .select("storage_path")
      .eq("owner", uid);
    const paths = (recs ?? [])
      .map((r: { storage_path: string | null }) => r.storage_path)
      .filter((p): p is string => Boolean(p));
    if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  } catch {
    // Non-fatal — the DB rows still cascade on user delete.
  }

  // Delete the auth user; ON DELETE CASCADE removes recordings, folders,
  // workspaces, memberships, invites, and comments.
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) {
    return Response.json(
      { error: "delete_failed", message: delErr.message },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
