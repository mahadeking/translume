// Local-first data provider — everything persists in the browser's IndexedDB
// so the app works with zero backend. Mirrors the cloud provider's surface.

import { idb } from "./idb";
import { extractPoster, uid, type SaveInput } from "./media";
import type { Comment, Folder, Recording } from "./types";

export async function saveRecording(input: SaveInput): Promise<Recording> {
  const poster = await extractPoster(input.blob, input.duration);
  const rec: Recording = {
    id: uid(),
    title: input.title,
    createdAt: Date.now(),
    duration: input.duration,
    width: poster.width,
    height: poster.height,
    size: input.blob.size,
    mode: input.mode,
    thumbnail: input.thumbnail || poster.thumbnail,
    views: 0,
    folder: null,
    mimeType: input.mimeType,
    transcript: input.transcript && input.transcript.length ? input.transcript : undefined,
    trimStart: input.trimStart,
    trimEnd: input.trimEnd,
  };
  await idb.put("blobs", input.blob, rec.id);
  await idb.put("meta", rec);
  return rec;
}

export async function listRecordings(): Promise<Recording[]> {
  const all = await idb.getAll<Recording>("meta");
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getRecording(id: string): Promise<Recording | undefined> {
  return idb.get<Recording>("meta", id);
}

export async function getObjectURL(id: string): Promise<string | null> {
  const blob = await idb.get<Blob>("blobs", id);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function updateRecording(
  id: string,
  patch: Partial<Recording>
): Promise<Recording | undefined> {
  const rec = await getRecording(id);
  if (!rec) return undefined;
  const next = { ...rec, ...patch, id: rec.id };
  await idb.put("meta", next);
  return next;
}

export async function incrementViews(id: string): Promise<void> {
  const rec = await getRecording(id);
  if (!rec) return;
  await idb.put("meta", { ...rec, views: rec.views + 1 });
}

export async function deleteRecording(id: string): Promise<void> {
  await idb.delete("meta", id);
  await idb.delete("blobs", id);
  const comments = await idb.getAllByIndex<Comment>("comments", "recordingId", id);
  await Promise.all(comments.map((c) => idb.delete("comments", c.id)));
}

// ---- Comments ----

export async function listComments(recordingId: string): Promise<Comment[]> {
  const all = await idb.getAllByIndex<Comment>("comments", "recordingId", recordingId);
  return all.sort((a, b) => a.time - b.time);
}

export async function addComment(
  input: Omit<Comment, "id" | "createdAt">
): Promise<Comment> {
  const comment: Comment = { ...input, id: uid(), createdAt: Date.now() };
  await idb.put("comments", comment);
  return comment;
}

export async function deleteComment(id: string): Promise<void> {
  await idb.delete("comments", id);
}

// ---- Folders ----

export async function listFolders(): Promise<Folder[]> {
  const all = await idb.getAll<Folder>("folders");
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function addFolder(name: string): Promise<Folder> {
  const folder: Folder = { id: uid(), name, createdAt: Date.now() };
  await idb.put("folders", folder);
  return folder;
}

export async function deleteFolder(id: string): Promise<void> {
  await idb.delete("folders", id);
}

export async function setSaved(id: string, saved: boolean): Promise<void> {
  const rec = await getRecording(id);
  if (!rec) return;
  await idb.put("meta", { ...rec, saved });
}
