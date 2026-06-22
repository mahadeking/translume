"use client";

// Team workspaces (cloud only). Thin wrappers over the security-definer RPC
// functions defined in supabase/workspaces.sql.

import { getSupabase, isCloud } from "./supabase";

export interface Workspace {
  id: string;
  name: string;
  owner: string;
}

export interface Member {
  user_id: string;
  email: string;
  role: "owner" | "member";
  created_at: string;
}

export interface InviteInfo {
  workspace_id: string;
  workspace_name: string;
  valid: boolean;
}

/** The caller's workspace, creating a default one (owned by them) if none. */
export async function ensureMyWorkspace(): Promise<Workspace | null> {
  if (!isCloud()) return null;
  const { data, error } = await getSupabase().rpc("ensure_my_workspace");
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as Workspace;
}

/** Create a shareable invite token for a workspace. */
export async function createInvite(workspaceId: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("create_workspace_invite", {
    ws_id: workspaceId,
  });
  if (error) throw error;
  return data as string;
}

/** Look up an invite (for the join page). */
export async function getInviteInfo(token: string): Promise<InviteInfo | null> {
  const { data, error } = await getSupabase().rpc("get_invite_info", {
    invite_token: token,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return (row as InviteInfo) ?? null;
}

/** Accept an invite — adds the caller to the workspace. Returns workspace id. */
export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await getSupabase().rpc("accept_workspace_invite", {
    invite_token: token,
  });
  if (error) throw error;
  return data as string;
}

/** Members (with emails) of a workspace the caller belongs to. */
export async function listMembers(workspaceId: string): Promise<Member[]> {
  const { data, error } = await getSupabase().rpc("workspace_members_list", {
    ws_id: workspaceId,
  });
  if (error) throw error;
  return (data ?? []) as Member[];
}
