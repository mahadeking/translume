"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { VideoCard } from "@/components/VideoCard";
import { listRecordings, setSaved, deleteRecording } from "@/lib/store";
import type { Recording } from "@/lib/types";
import { IconBookmark } from "@/components/icons";

export default function WatchLaterPage() {
  const [recs, setRecs] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRecordings()
      .then((r) => setRecs(r.filter((x) => x.saved)))
      .finally(() => setLoading(false));
  }, []);

  async function toggleSave(id: string, saved: boolean) {
    await setSaved(id, saved);
    if (!saved) setRecs((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recording? This can't be undone.")) return;
    await deleteRecording(id);
    setRecs((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Watch later</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Recordings you’ve bookmarked to revisit.
        </p>

        <div className="mt-8">
          {loading ? (
            <GridSkeleton />
          ) : recs.length === 0 ? (
            <div className="card grid place-items-center px-6 py-20 text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--panel-strong)] text-[var(--brand)]">
                <IconBookmark width={26} height={26} />
              </span>
              <p className="text-[var(--text-dim)]">
                Nothing saved yet. Tap the bookmark on any recording to add it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 fade-up sm:grid-cols-2 lg:grid-cols-3">
              {recs.map((rec) => (
                <VideoCard
                  key={rec.id}
                  rec={rec}
                  onToggleSave={toggleSave}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card aspect-[4/3] animate-pulse bg-[var(--panel-strong)]" />
      ))}
    </div>
  );
}
