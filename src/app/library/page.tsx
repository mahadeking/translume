"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { VideoCard } from "@/components/VideoCard";
import {
  listRecordings,
  deleteRecording,
  updateRecording,
  listFolders,
  addFolder,
  setSaved,
  isCloud,
} from "@/lib/store";
import { ensureMyWorkspace } from "@/lib/workspace";
import type { Folder, Recording } from "@/lib/types";
import { IconSearch, IconRecord, IconVideo, IconPlus } from "@/components/icons";

export default function LibraryPage() {
  const [recs, setRecs] = useState<Recording[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<"all" | "none" | string>("all");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listRecordings(), listFolders()])
      .then(([r, f]) => {
        setRecs(r);
        setFolders(f);
      })
      .finally(() => setLoading(false));
    if (isCloud()) {
      ensureMyWorkspace()
        .then((w) => setWorkspaceId(w?.id ?? null))
        .catch(() => {});
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recs.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q)) return false;
      if (activeFolder === "all") return true;
      if (activeFolder === "none") return r.folder === null;
      return r.folder === activeFolder;
    });
  }, [recs, query, activeFolder]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this recording? This can't be undone.")) return;
    await deleteRecording(id);
    setRecs((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleRename(id: string, title: string) {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, title } : r)));
    await updateRecording(id, { title });
  }

  async function handleMove(id: string, folder: string | null) {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, folder } : r)));
    await updateRecording(id, { folder });
  }

  async function handleToggleSave(id: string, saved: boolean) {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, saved } : r)));
    await setSaved(id, saved);
  }

  async function handleToggleTeam(id: string, shared: boolean) {
    const wsid = shared ? workspaceId : null;
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, workspaceId: wsid } : r)));
    await updateRecording(id, { workspaceId: wsid });
  }

  async function handleNewFolder() {
    const name = prompt("New folder name");
    if (!name || !name.trim()) return;
    const folder = await addFolder(name.trim());
    setFolders((prev) => [...prev, folder]);
    setActiveFolder(folder.id);
  }

  const countFor = (key: "all" | "none" | string) =>
    key === "all"
      ? recs.length
      : key === "none"
        ? recs.filter((r) => r.folder === null).length
        : recs.filter((r) => r.folder === key).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
            <p className="mt-1 text-sm text-[var(--text-dim)]">
              {recs.length} {recs.length === 1 ? "recording" : "recordings"} in
              this workspace
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <IconSearch
                width={16}
                height={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search recordings"
                className="input w-56 pl-9"
              />
            </div>
            <Link href="/record" className="btn btn-primary">
              <IconRecord width={18} height={18} />
              Record
            </Link>
          </div>
        </div>

        {/* Folder filter bar */}
        {(recs.length > 0 || folders.length > 0) && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <FolderChip
              label="All"
              count={countFor("all")}
              active={activeFolder === "all"}
              onClick={() => setActiveFolder("all")}
            />
            <FolderChip
              label="Unfiled"
              count={countFor("none")}
              active={activeFolder === "none"}
              onClick={() => setActiveFolder("none")}
            />
            {folders.map((f) => (
              <FolderChip
                key={f.id}
                label={f.name}
                count={countFor(f.id)}
                active={activeFolder === f.id}
                onClick={() => setActiveFolder(f.id)}
              />
            ))}
            <button
              onClick={handleNewFolder}
              className="flex items-center gap-1 rounded-full border border-dashed border-[var(--border-strong)] px-3 py-1 text-xs font-medium text-[var(--text-dim)] transition hover:text-[var(--text)]"
            >
              <IconPlus width={13} height={13} />
              New folder
            </button>
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="card aspect-[4/3] animate-pulse bg-[var(--panel-strong)]"
                />
              ))}
            </div>
          ) : recs.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <div className="card grid place-items-center px-6 py-20 text-center">
              <p className="text-[var(--text-dim)]">
                {query ? `No recordings match “${query}”.` : "Nothing in this folder yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 fade-up sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((rec) => (
                <VideoCard
                  key={rec.id}
                  rec={rec}
                  folders={folders}
                  onDelete={handleDelete}
                  onRename={handleRename}
                  onMove={handleMove}
                  onToggleSave={handleToggleSave}
                  onToggleTeam={workspaceId ? handleToggleTeam : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FolderChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-[var(--brand)] bg-[var(--panel-strong)] text-[var(--text)]"
          : "border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)]"
      }`}
    >
      {label}
      <span className="text-[var(--text-faint)]">{count}</span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="card relative grid place-items-center overflow-hidden px-6 py-24 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(36rem 18rem at 50% 0%, rgba(124,108,255,0.2), transparent 70%)",
        }}
      />
      <span className="relative mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--panel-strong)] text-[var(--brand)]">
        <IconVideo width={30} height={30} />
      </span>
      <h2 className="relative text-xl font-semibold">No recordings yet</h2>
      <p className="relative mt-2 max-w-sm text-sm text-[var(--text-dim)]">
        Record your screen and camera, and your videos will show up here with
        instant share links.
      </p>
      <Link href="/record" className="btn btn-primary relative mt-6">
        <IconRecord width={18} height={18} />
        Record your first Translume
      </Link>
    </div>
  );
}
