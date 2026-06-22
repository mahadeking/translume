// Supabase cloud data provider — same surface as local.ts, but recordings live
// in Supabase Storage + Postgres so share links work across devices and people.

import { BUCKET, getSupabase } from "./supabase";
import { extractPoster, uid, type SaveInput } from "./media";
import type { Comment, Folder, Recording } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function ownerId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getUser();
  return data.user?.id ?? null;
}

function rowToRecording(r: any): Recording {
  return {
    id: r.id,
    title: r.title,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    duration: Number(r.duration) || 0,
    width: r.width ?? 0,
    height: r.height ?? 0,
    size: Number(r.size) || 0,
    mode: r.mode,
    thumbnail: r.thumbnail ?? "",
    views: r.views ?? 0,
    folder: r.folder ?? null,
    mimeType: r.mime_type ?? "video/webm",
    transcript: r.transcript ?? undefined,
    ai: r.ai ?? undefined,
    trimStart: r.trim_start ?? undefined,
    trimEnd: r.trim_end ?? undefined,
    saved: r.saved ?? false,
    owner: r.owner ?? undefined,
    workspaceId: r.workspace_id ?? null,
  };
}

function storagePath(id: string): string {
  return `${id}.webm`;
}

export async function saveRecording(input: SaveInput): Promise<Recording> {
  const supabase = getSupabase();
  const poster = await extractPoster(input.blob, input.duration);
  const thumbnail = input.thumbnail || poster.thumbnail;
  const { width, height } = poster;
  const id = uid();
  const path = storagePath(id);
  const owner = await ownerId();

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.blob, {
      contentType: input.mimeType.split(";")[0] || "video/webm",
      upsert: true,
    });
  if (upErr) throw upErr;

  const row = {
    id,
    title: input.title,
    duration: input.duration,
    width,
    height,
    size: input.blob.size,
    mode: input.mode,
    thumbnail,
    storage_path: path,
    mime_type: input.mimeType,
    transcript: input.transcript && input.transcript.length ? input.transcript : null,
    visibility: "unlisted",
    ...(owner ? { owner } : {}),
    // Only include trim columns when actually trimmed, so installs that haven't
    // run the trim migration still save untrimmed recordings fine.
    ...(input.trimStart != null ? { trim_start: input.trimStart } : {}),
    ...(input.trimEnd != null ? { trim_end: input.trimEnd } : {}),
  };

  const { data, error } = await supabase
    .from("recordings")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return rowToRecording(data);
}

export async function listRecordings(): Promise<Recording[]> {
  const supabase = getSupabase();
  const owner = await ownerId();
  let q = supabase.from("recordings").select("*").order("created_at", { ascending: false });
  if (owner) q = q.eq("owner", owner);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(rowToRecording);
}

export async function listWorkspaceRecordings(
  workspaceId: string
): Promise<Recording[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToRecording);
}

export async function getRecording(id: string): Promise<Recording | undefined> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRecording(data) : undefined;
}

export async function getObjectURL(id: string): Promise<string | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recordings")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (error || !data?.storage_path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(data.storage_path).data.publicUrl;
}

export async function updateRecording(
  id: string,
  patch: Partial<Recording>
): Promise<Recording | undefined> {
  const supabase = getSupabase();
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.folder !== undefined) dbPatch.folder = patch.folder;
  if (patch.ai !== undefined) dbPatch.ai = patch.ai;
  if (patch.transcript !== undefined) dbPatch.transcript = patch.transcript;
  if (patch.thumbnail !== undefined) dbPatch.thumbnail = patch.thumbnail;
  if (patch.trimStart !== undefined) dbPatch.trim_start = patch.trimStart;
  if (patch.trimEnd !== undefined) dbPatch.trim_end = patch.trimEnd;
  if (patch.saved !== undefined) dbPatch.saved = patch.saved;
  if (patch.workspaceId !== undefined) dbPatch.workspace_id = patch.workspaceId;
  if (Object.keys(dbPatch).length === 0) return getRecording(id);

  const { data, error } = await supabase
    .from("recordings")
    .update(dbPatch)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? rowToRecording(data) : undefined;
}

export async function incrementViews(id: string): Promise<void> {
  const supabase = getSupabase();
  // Atomic increment via a SQL function (see supabase/schema.sql).
  await supabase.rpc("increment_views", { rec_id: id });
}

export async function deleteRecording(id: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.storage.from(BUCKET).remove([storagePath(id)]);
  // Comments cascade via the foreign key.
  const { error } = await supabase.from("recordings").delete().eq("id", id);
  if (error) throw error;
}

// ---- Comments ----

function rowToComment(r: any): Comment {
  return {
    id: r.id,
    recordingId: r.recording_id,
    author: r.author,
    body: r.body,
    time: Number(r.time_sec) || 0,
    emoji: r.emoji ?? null,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  };
}

export async function listComments(recordingId: string): Promise<Comment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("recording_id", recordingId)
    .order("time_sec", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToComment);
}

export async function addComment(
  input: Omit<Comment, "id" | "createdAt">
): Promise<Comment> {
  const supabase = getSupabase();
  const row = {
    id: uid(),
    recording_id: input.recordingId,
    author: input.author,
    body: input.body,
    time_sec: input.time,
    emoji: input.emoji,
  };
  const { data, error } = await supabase.from("comments").insert(row).select().single();
  if (error) throw error;
  return rowToComment(data);
}

export async function deleteComment(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

// ---- Folders ----

export async function listFolders(): Promise<Folder[]> {
  const supabase = getSupabase();
  const owner = await ownerId();
  let q = supabase.from("folders").select("*").order("created_at", { ascending: true });
  if (owner) q = q.eq("owner", owner);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  }));
}

export async function addFolder(name: string): Promise<Folder> {
  const supabase = getSupabase();
  const owner = await ownerId();
  const { data, error } = await supabase
    .from("folders")
    .insert({ id: uid(), name, ...(owner ? { owner } : {}) })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
  };
}

export async function deleteFolder(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

export async function setSaved(id: string, saved: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("recordings").update({ saved }).eq("id", id);
  if (error) throw error;
}
