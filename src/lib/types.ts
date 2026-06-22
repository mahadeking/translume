export type RecordMode = "screen" | "camera" | "both";

export interface TranscriptSegment {
  time: number; // seconds into the video
  text: string;
}

export interface Chapter {
  time: number; // start time in seconds
  title: string;
}

export interface AISummary {
  title: string;
  summary: string;
  chapters: Chapter[];
  generatedAt: number;
}

export interface Recording {
  id: string;
  title: string;
  createdAt: number;
  duration: number; // seconds
  width: number;
  height: number;
  size: number; // bytes
  mode: RecordMode;
  thumbnail: string; // data URL (poster frame)
  views: number;
  folder: string | null;
  mimeType: string;
  transcript?: TranscriptSegment[];
  ai?: AISummary;
  trimStart?: number; // seconds; playback starts here
  trimEnd?: number; // seconds; playback ends here
  saved?: boolean; // bookmarked for "Watch later"
  owner?: string; // auth user id of the creator (cloud mode only)
  workspaceId?: string | null; // shared into this team workspace (cloud mode)
  ctaLabel?: string | null; // call-to-action button text
  ctaUrl?: string | null; // call-to-action button link
  ctaClicks?: number; // how many times the CTA was clicked
  expiresAt?: string | null; // ISO; link stops working after this (owner exempt)
  allowDownload?: boolean; // viewers may download the file
  passwordProtected?: boolean; // viewers must enter a password to watch
}

export interface Comment {
  id: string;
  recordingId: string;
  author: string;
  body: string;
  time: number; // playhead seconds the comment is pinned to
  emoji: string | null;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}
