// Data API for Translume — the single surface the UI depends on.
//
// Local-first by default (IndexedDB, zero setup). When Supabase env vars are
// present the exact same calls route to the cloud provider instead, so share
// links work across devices and people. Components never change.

import * as local from "./local";
import * as cloud from "./cloud";
import { isCloud } from "./supabase";
import type { Comment, Folder, Recording } from "./types";
import type { SaveInput } from "./media";

export { uid, extractPoster } from "./media";
export type { SaveInput } from "./media";
export { isCloud } from "./supabase";

const provider = () => (isCloud() ? cloud : local);

export function saveRecording(input: SaveInput): Promise<Recording> {
  return provider().saveRecording(input);
}

export function listRecordings(): Promise<Recording[]> {
  return provider().listRecordings();
}

export function getRecording(id: string): Promise<Recording | undefined> {
  return provider().getRecording(id);
}

export function getObjectURL(id: string): Promise<string | null> {
  return provider().getObjectURL(id);
}

export function updateRecording(
  id: string,
  patch: Partial<Recording>
): Promise<Recording | undefined> {
  return provider().updateRecording(id, patch);
}

export function incrementViews(id: string): Promise<void> {
  return provider().incrementViews(id);
}

export function deleteRecording(id: string): Promise<void> {
  return provider().deleteRecording(id);
}

export function listComments(recordingId: string): Promise<Comment[]> {
  return provider().listComments(recordingId);
}

export function addComment(
  input: Omit<Comment, "id" | "createdAt">
): Promise<Comment> {
  return provider().addComment(input);
}

export function deleteComment(id: string): Promise<void> {
  return provider().deleteComment(id);
}

export function listFolders(): Promise<Folder[]> {
  return provider().listFolders();
}

export function addFolder(name: string): Promise<Folder> {
  return provider().addFolder(name);
}

export function deleteFolder(id: string): Promise<void> {
  return provider().deleteFolder(id);
}

export function setSaved(id: string, saved: boolean): Promise<void> {
  return provider().setSaved(id, saved);
}

/** Recordings shared into a team workspace (cloud only). */
export function listWorkspaceRecordings(workspaceId: string): Promise<Recording[]> {
  return isCloud() ? cloud.listWorkspaceRecordings(workspaceId) : Promise.resolve([]);
}

/** Count a click on a recording's call-to-action button (cloud only). */
export function incrementCtaClicks(id: string): Promise<void> {
  return isCloud() ? cloud.incrementCtaClicks(id) : Promise.resolve();
}

/** Set (or clear, with null) a recording's view password (cloud only). */
export function setRecordingPassword(id: string, password: string | null): Promise<void> {
  return isCloud() ? cloud.setRecordingPassword(id, password) : Promise.resolve();
}

/** Verify a recording's view password (cloud only; true when no password set). */
export function checkRecordingPassword(id: string, password: string): Promise<boolean> {
  return isCloud() ? cloud.checkRecordingPassword(id, password) : Promise.resolve(true);
}
