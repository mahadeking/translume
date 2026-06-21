"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Folder, Recording } from "@/lib/types";
import { formatDuration, formatRelativeDate } from "@/lib/format";
import {
  IconPlay,
  IconEye,
  IconTrash,
  IconScreen,
  IconCamera,
  IconBoth,
  IconEdit,
  IconLink,
  IconCheck,
  IconBookmark,
  IconBookmarkFilled,
} from "./icons";

const modeIcon = {
  screen: IconScreen,
  camera: IconCamera,
  both: IconBoth,
};

export function VideoCard({
  rec,
  folders = [],
  onDelete,
  onRename,
  onMove,
  onToggleSave,
}: {
  rec: Recording;
  folders?: Folder[];
  onDelete?: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onMove?: (id: string, folder: string | null) => void;
  onToggleSave?: (id: string, saved: boolean) => void;
}) {
  const ModeIcon = modeIcon[rec.mode];
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function rename() {
    setMenuOpen(false);
    const next = prompt("Rename recording", rec.title);
    if (next && next.trim() && next.trim() !== rec.title) onRename?.(rec.id, next.trim());
  }

  function copyLink() {
    navigator.clipboard
      .writeText(`${window.location.origin}/v/${rec.id}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  }

  const shownDuration =
    rec.trimStart != null || rec.trimEnd != null
      ? (rec.trimEnd ?? rec.duration) - (rec.trimStart ?? 0)
      : rec.duration;

  return (
    <div className="group card relative transition hover:border-[var(--border-strong)]">
      {onToggleSave && (
        <button
          onClick={() => onToggleSave(rec.id, !rec.saved)}
          aria-label={rec.saved ? "Remove from Watch later" : "Save to Watch later"}
          className={`absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-lg bg-black/60 backdrop-blur transition ${
            rec.saved
              ? "text-[var(--brand-2)]"
              : "touch-visible text-white opacity-0 group-hover:opacity-100 hover:text-[var(--brand-2)]"
          }`}
        >
          {rec.saved ? (
            <IconBookmarkFilled width={15} height={15} />
          ) : (
            <IconBookmark width={15} height={15} />
          )}
        </button>
      )}
      <Link
        href={`/v/${rec.id}`}
        className="relative block aspect-video overflow-hidden rounded-t-[15px] bg-black/40"
      >
        {rec.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rec.thumbnail} alt={rec.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#15131f] to-[#1a1326] text-[var(--text-faint)]">
            <ModeIcon width={28} height={28} />
          </div>
        )}

        <div className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <span className="grid h-14 w-14 place-items-center rounded-full brand-gradient shadow-lg">
            <IconPlay width={24} height={24} className="text-white" />
          </span>
        </div>

        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium tabular-nums">
          {formatDuration(shownDuration)}
        </span>
        <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/60 text-[var(--text-dim)] backdrop-blur">
          <ModeIcon width={15} height={15} />
        </span>
      </Link>

      <div className="flex items-start justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <Link
            href={`/v/${rec.id}`}
            className="block truncate text-sm font-semibold hover:text-[var(--brand)]"
          >
            {rec.title}
          </Link>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-faint)]">
            <span>{formatRelativeDate(rec.createdAt)}</span>
            <span className="flex items-center gap-1">
              <IconEye width={13} height={13} />
              {rec.views}
            </span>
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More actions"
            data-open={menuOpen}
            className="touch-visible rounded-lg p-1.5 text-[var(--text-faint)] opacity-0 transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)] group-hover:opacity-100 data-[open=true]:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="12" cy="19" r="1.6" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-48 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-soft)] py-1 text-sm shadow-2xl">
              {onRename && (
                <button onClick={rename} className="menu-item">
                  <IconEdit width={15} height={15} /> Rename
                </button>
              )}
              <button
                onClick={() => {
                  copyLink();
                  setMenuOpen(false);
                }}
                className="menu-item"
              >
                {copied ? <IconCheck width={15} height={15} /> : <IconLink width={15} height={15} />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              {onToggleSave && (
                <button
                  onClick={() => {
                    onToggleSave(rec.id, !rec.saved);
                    setMenuOpen(false);
                  }}
                  className="menu-item"
                >
                  {rec.saved ? (
                    <IconBookmarkFilled width={15} height={15} />
                  ) : (
                    <IconBookmark width={15} height={15} />
                  )}
                  {rec.saved ? "Remove from Watch later" : "Save to Watch later"}
                </button>
              )}

              {onMove && (
                <>
                  <div className="my-1 border-t border-[var(--border)]" />
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                    Move to
                  </div>
                  <button
                    onClick={() => {
                      onMove(rec.id, null);
                      setMenuOpen(false);
                    }}
                    className={`menu-item ${rec.folder === null ? "text-[var(--brand)]" : ""}`}
                  >
                    No folder
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        onMove(rec.id, f.id);
                        setMenuOpen(false);
                      }}
                      className={`menu-item ${rec.folder === f.id ? "text-[var(--brand)]" : ""}`}
                    >
                      {f.name}
                    </button>
                  ))}
                </>
              )}

              {onDelete && (
                <>
                  <div className="my-1 border-t border-[var(--border)]" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(rec.id);
                    }}
                    className="menu-item text-[var(--danger)]"
                  >
                    <IconTrash width={15} height={15} /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
