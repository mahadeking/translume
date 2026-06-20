"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { VideoCard } from "@/components/VideoCard";
import { GridSkeleton } from "@/app/watch-later/page";
import { listRecordings, setSaved } from "@/lib/store";
import { useAuth } from "@/lib/useAuth";
import type { Recording } from "@/lib/types";
import { IconRecord, IconLibrary } from "@/components/icons";

export default function HomePage() {
  const { user } = useAuth();
  const [recs, setRecs] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRecordings()
      .then(setRecs)
      .finally(() => setLoading(false));
  }, []);

  async function toggleSave(id: string, saved: boolean) {
    await setSaved(id, saved);
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, saved } : r)));
  }

  const name = (user?.email ?? "there").split("@")[0];
  const latest = recs.slice(0, 6);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {/* Hero CTA */}
        <div className="card relative overflow-hidden p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(40rem 18rem at 0% 0%, rgba(124,108,255,0.22), transparent 70%)",
            }}
          />
          <div className="relative">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back, <span className="capitalize">{name}</span> 👋
            </h1>
            <p className="mt-2 max-w-md text-sm text-[var(--text-dim)]">
              Record your screen and camera, get an instant share link, and let
              people reply right on the timeline.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/record" className="btn btn-primary px-5 py-2.5">
                <IconRecord width={18} height={18} />
                New recording
              </Link>
              <Link href="/library" className="btn btn-ghost px-5 py-2.5">
                <IconLibrary width={18} height={18} />
                Go to library
              </Link>
            </div>
          </div>
        </div>

        {/* Latest */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your latest</h2>
          {recs.length > 6 && (
            <Link href="/library" className="text-sm text-[var(--brand)] hover:underline">
              View all
            </Link>
          )}
        </div>

        <div className="mt-4">
          {loading ? (
            <GridSkeleton />
          ) : latest.length === 0 ? (
            <div className="card grid place-items-center px-6 py-16 text-center">
              <p className="text-[var(--text-dim)]">
                No recordings yet — hit <strong>New recording</strong> to make your first.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 fade-up sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((rec) => (
                <VideoCard key={rec.id} rec={rec} onToggleSave={toggleSave} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
