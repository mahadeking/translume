// Shared, provider-agnostic helpers used by both the local and cloud data layers.

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

/** Extract a poster frame + dimensions from a recorded blob. */
export async function extractPoster(
  blob: Blob,
  knownDuration: number
): Promise<{ thumbnail: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const done = (width: number, height: number, thumbnail: string) => {
      URL.revokeObjectURL(url);
      resolve({ thumbnail, width, height });
    };

    const fail = () => done(1280, 720, "");

    const grab = () => {
      try {
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const scale = Math.min(1, 640 / w);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return done(w, h, "");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        done(w, h, canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        fail();
      }
    };

    const timeout = setTimeout(grab, 2500);

    video.onloadedmetadata = () => {
      // MediaRecorder webm blobs often report Infinity duration & aren't
      // seekable until nudged. Force the browser to resolve the timeline.
      const target = Math.min(
        Number.isFinite(knownDuration) && knownDuration > 0 ? knownDuration * 0.2 : 0.1,
        2
      );
      const seek = () => {
        video.onseeked = () => {
          clearTimeout(timeout);
          grab();
        };
        video.currentTime = target;
      };
      if (video.duration === Infinity || Number.isNaN(video.duration)) {
        video.currentTime = 1e7;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          seek();
        };
      } else {
        seek();
      }
    };
    video.onerror = () => {
      clearTimeout(timeout);
      fail();
    };
  });
}

export interface SaveInput {
  blob: Blob;
  title: string;
  duration: number;
  mode: import("./types").RecordMode;
  mimeType: string;
  transcript?: import("./types").TranscriptSegment[];
  thumbnail?: string; // optional custom poster (overrides auto-extracted)
  trimStart?: number;
  trimEnd?: number;
}
