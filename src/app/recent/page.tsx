"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { VideoCard } from "@/components/VideoCard";
import { GridSkeleton } from "@/app/watch-later/page";
import { getRecording, setSaved } from "@/lib/store";
import { getRecent } from "@/lib/recent";
import type { Recording } from "@/lib/types";
import { IconClock, IconRecord } from "@/components/icons";

export default function RecentPage() {
  const [recs, setRecs] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ids = getRecent().slice(0, 18);
      const results = await Promise.all(ids.map((id) => getRecording(id).catch(() => undefined)));
      setRecs(results.filter((r): r is Recording => Boolean(r)));
      setLoading(false);
    })();
  }, []);

  async function toggleSave(id: string, saved: boolean) {
    await setSaved(id, saved);
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, saved } : r)));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Recent</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Recordings you’ve watched recently, on this device.
        </p>

        <div className="mt-8">
          {loading ? (
            <GridSkeleton />
          ) : recs.length === 0 ? (
            <div className="card grid place-items-center px-6 py-20 text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--panel-strong)] text-[var(--brand)]">
                <IconClock width={26} height={26} />
              </span>
              <p className="text-[var(--text-dim)]">
                Nothing here yet — videos you open will show up for quick access.
              </p>
              <Link href="/record" className="btn btn-primary mt-5">
                <IconRecord width={18} height={18} />
                Record something
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 fade-up sm:grid-cols-2 lg:grid-cols-3">
              {recs.map((rec) => (
                <VideoCard key={rec.id} rec={rec} onToggleSave={toggleSave} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
