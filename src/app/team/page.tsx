"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { VideoCard } from "@/components/VideoCard";
import { ensureMyWorkspace } from "@/lib/workspace";
import { listWorkspaceRecordings, isCloud } from "@/lib/store";
import type { Recording } from "@/lib/types";
import { IconUsers } from "@/components/icons";

export default function TeamPage() {
  const [recs, setRecs] = useState<Recording[] | null>(null);
  const [wsName, setWsName] = useState("");

  useEffect(() => {
    (async () => {
      if (!isCloud()) {
        setRecs([]);
        return;
      }
      try {
        const ws = await ensureMyWorkspace();
        if (!ws) {
          setRecs([]);
          return;
        }
        setWsName(ws.name);
        setRecs(await listWorkspaceRecordings(ws.id));
      } catch {
        setRecs([]);
      }
    })();
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Team library</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Recordings shared into {wsName || "your workspace"}.
        </p>

        {recs === null ? (
          <p className="mt-8 text-sm text-[var(--text-dim)]">Loading…</p>
        ) : recs.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--panel-strong)] text-[var(--brand)]">
              <IconUsers width={24} height={24} />
            </span>
            <h2 className="mt-4 font-semibold">No shared recordings yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-dim)]">
              Open one of your recordings and choose{" "}
              <span className="text-[var(--text)]">Share to team</span> to make it
              visible to everyone in your workspace.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map((r) => (
              <VideoCard key={r.id} rec={r} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
