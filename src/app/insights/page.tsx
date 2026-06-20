"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { listRecordings } from "@/lib/store";
import type { Recording } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { IconEye, IconVideo, IconClock, IconChart, IconPlay } from "@/components/icons";

export default function InsightsPage() {
  const [recs, setRecs] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listRecordings()
      .then(setRecs)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalViews = recs.reduce((s, r) => s + r.views, 0);
    const totalSeconds = recs.reduce((s, r) => s + r.duration, 0);
    const top = [...recs].sort((a, b) => b.views - a.views).slice(0, 5);
    return { totalViews, totalSeconds, top, count: recs.length };
  }, [recs]);

  const maxViews = stats.top[0]?.views || 1;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          How your recordings are performing.
        </p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-[var(--panel-strong)]" />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="card mt-8 grid place-items-center px-6 py-20 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--panel-strong)] text-[var(--brand)]">
              <IconChart width={26} height={26} />
            </span>
            <p className="text-[var(--text-dim)]">
              Record and share a video — your views and engagement will show up here.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 fade-up sm:grid-cols-3">
              <Stat icon={<IconVideo width={20} height={20} />} label="Recordings" value={stats.count.toString()} />
              <Stat icon={<IconEye width={20} height={20} />} label="Total views" value={stats.totalViews.toString()} />
              <Stat
                icon={<IconClock width={20} height={20} />}
                label="Total length"
                value={formatDuration(stats.totalSeconds)}
              />
            </div>

            <h2 className="mt-10 text-lg font-semibold">Top performing</h2>
            <div className="card mt-3 divide-y divide-[var(--border)]">
              {stats.top.map((r, i) => (
                <Link
                  key={r.id}
                  href={`/v/${r.id}`}
                  className="flex items-center gap-4 p-3 transition hover:bg-[var(--panel-strong)]"
                >
                  <span className="w-5 text-center text-sm font-semibold text-[var(--text-faint)]">
                    {i + 1}
                  </span>
                  <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black/40">
                    {r.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[var(--text-faint)]">
                        <IconPlay width={16} height={16} />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full brand-gradient"
                        style={{ width: `${Math.max(6, (r.views / maxViews) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm tabular-nums text-[var(--text-dim)]">
                    <IconEye width={14} height={14} />
                    {r.views}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-5">
      <span className="inline-grid h-10 w-10 place-items-center rounded-xl bg-[var(--panel-strong)] text-[var(--brand)]">
        {icon}
      </span>
      <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-sm text-[var(--text-dim)]">{label}</div>
    </div>
  );
}
