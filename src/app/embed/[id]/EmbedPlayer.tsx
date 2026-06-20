"use client";

import { useEffect, useState } from "react";
import { Player } from "@/components/Player";
import { getRecording, getObjectURL, incrementViews } from "@/lib/store";
import type { Recording } from "@/lib/types";

export function EmbedPlayer({ id }: { id: string }) {
  const [rec, setRec] = useState<Recording | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    (async () => {
      const r = await getRecording(id);
      if (!r) {
        setLoading(false);
        return;
      }
      setRec(r);
      objectUrl = await getObjectURL(id);
      setUrl(objectUrl);
      incrementViews(id);
      setLoading(false);
    })();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return (
    <div className="grid min-h-screen place-items-center bg-black p-0">
      {loading ? (
        <span className="text-sm text-[var(--text-dim)]">Loading…</span>
      ) : !rec || !url ? (
        <span className="px-4 text-center text-sm text-[var(--text-dim)]">
          This recording isn’t available.
        </span>
      ) : (
        <div className="w-full">
          <Player
            src={url}
            poster={rec.thumbnail || undefined}
            clip={
              rec.trimStart != null || rec.trimEnd != null
                ? { start: rec.trimStart ?? 0, end: rec.trimEnd ?? rec.duration }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
