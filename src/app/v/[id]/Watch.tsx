"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Player, type PlayerHandle } from "@/components/Player";
import { ShareDialog } from "@/components/ShareDialog";
import {
  getRecording,
  getObjectURL,
  listComments,
  addComment,
  deleteComment,
  deleteRecording,
  incrementViews,
  incrementCtaClicks,
  setRecordingPassword,
  checkRecordingPassword,
  updateRecording,
  isCloud,
} from "@/lib/store";
import { currentUserId } from "@/lib/auth";
import { ensureMyWorkspace } from "@/lib/workspace";
import type { AISummary, Comment, Recording } from "@/lib/types";
import { formatDuration, formatRelativeDate, initials } from "@/lib/format";
import { pushRecent } from "@/lib/recent";
import {
  IconLink,
  IconEye,
  IconComment,
  IconArrowLeft,
  IconTrash,
  IconSparkle,
} from "@/components/icons";

const QUICK_EMOJI = ["👍", "❤️", "😂", "🎉", "🤔", "👏"];

// Call-to-action is hidden for now. Flip to true to bring the feature back
// (owner editor + public CTA button); the data + API are already in place.
const CTA_ENABLED = false;

/** ISO timestamp → value for a <input type="datetime-local"> (local time). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function Watch({ id }: { id: string }) {
  const router = useRouter();
  const playerRef = useRef<PlayerHandle | null>(null);
  const [rec, setRec] = useState<Recording | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [playhead, setPlayhead] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [myWorkspaceId, setMyWorkspaceId] = useState<string | null>(null);
  const [sharingTeam, setSharingTeam] = useState(false);
  const [editingCta, setEditingCta] = useState(false);
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [savingCta, setSavingCta] = useState(false);
  // Access controls
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwChecking, setPwChecking] = useState(false);
  const [editingAccess, setEditingAccess] = useState(false);
  const [savingAccess, setSavingAccess] = useState(false);
  const [accPassword, setAccPassword] = useState("");
  const [accExpiry, setAccExpiry] = useState("");

  const [name, setName] = useState("You");
  const [body, setBody] = useState("");
  const [showShare, setShowShare] = useState(false);

  const [ai, setAi] = useState<AISummary | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);

  // 1) Load metadata + ownership (no media yet — access may be gated).
  useEffect(() => {
    (async () => {
      const r = await getRecording(id);
      if (!r) {
        setLoading(false);
        return;
      }
      setRec(r);
      if (r.ai) setAi(r.ai);
      // You can delete/manage a recording you own. In local mode every recording
      // lives in your own browser; in cloud mode compare owners.
      if (!isCloud()) setIsOwner(true);
      else {
        const me = await currentUserId();
        setIsOwner(!!me && r.owner === me);
      }
      pushRecent(id);
      setLoading(false);
    })();
    const saved = localStorage.getItem("translume_name");
    if (saved) setName(saved);
  }, [id]);

  const expired =
    !!rec?.expiresAt && Date.now() > new Date(rec.expiresAt).getTime();
  const blockedByExpiry = expired && !isOwner;
  const locked = !!rec?.passwordProtected && !isOwner && !unlocked;
  const accessGranted = !!rec && !blockedByExpiry && !locked;

  // 2) Load the video + comments only once access is granted.
  useEffect(() => {
    if (!accessGranted || !rec) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      objectUrl = await getObjectURL(rec.id);
      if (cancelled) return;
      setUrl(objectUrl);
      setComments(await listComments(rec.id));
      incrementViews(rec.id);
    })();
    return () => {
      cancelled = true;
      if (objectUrl && objectUrl.startsWith("blob:")) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessGranted, rec?.id]);

  // When you own this recording, load your workspace so you can share it.
  useEffect(() => {
    if (!isOwner || !isCloud()) return;
    ensureMyWorkspace()
      .then((w) => setMyWorkspaceId(w?.id ?? null))
      .catch(() => {});
  }, [isOwner]);

  async function submitComment(emoji: string | null) {
    if (!rec) return;
    if (!emoji && !body.trim()) return;
    const time = playerRef.current?.getCurrentTime() ?? playhead;
    const c = await addComment({
      recordingId: rec.id,
      author: name.trim() || "Anonymous",
      body: body.trim(),
      time,
      emoji,
    });
    setComments((prev) => [...prev, c].sort((a, b) => a.time - b.time));
    setBody("");
    localStorage.setItem("translume_name", name.trim() || "You");
  }

  async function removeComment(cid: string) {
    await deleteComment(cid);
    setComments((prev) => prev.filter((c) => c.id !== cid));
  }

  async function handleDelete() {
    if (!rec || deleting) return;
    if (!confirm(`Delete "${rec.title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteRecording(rec.id);
      router.push("/library");
    } catch {
      setDeleting(false);
      alert("Couldn't delete this recording. Please try again.");
    }
  }

  async function toggleTeam() {
    if (!rec || !myWorkspaceId || sharingTeam) return;
    setSharingTeam(true);
    const next = rec.workspaceId ? null : myWorkspaceId;
    try {
      await updateRecording(rec.id, { workspaceId: next });
      setRec({ ...rec, workspaceId: next });
    } finally {
      setSharingTeam(false);
    }
  }

  function openCtaEditor() {
    setCtaLabel(rec?.ctaLabel ?? "");
    setCtaUrl(rec?.ctaUrl ?? "");
    setEditingCta(true);
  }

  async function saveCta() {
    if (!rec) return;
    const label = ctaLabel.trim();
    let url = ctaUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setSavingCta(true);
    try {
      await updateRecording(rec.id, { ctaLabel: label || "Learn more", ctaUrl: url });
      setRec({ ...rec, ctaLabel: label || "Learn more", ctaUrl: url });
      setEditingCta(false);
    } finally {
      setSavingCta(false);
    }
  }

  async function clearCta() {
    if (!rec) return;
    setSavingCta(true);
    try {
      await updateRecording(rec.id, { ctaLabel: null, ctaUrl: null });
      setRec({ ...rec, ctaLabel: null, ctaUrl: null });
      setEditingCta(false);
    } finally {
      setSavingCta(false);
    }
  }

  function trackCta() {
    if (rec) incrementCtaClicks(rec.id).catch(() => {});
  }

  async function unlock() {
    if (!rec) return;
    setPwChecking(true);
    setPwError(null);
    try {
      const ok = await checkRecordingPassword(rec.id, pwInput);
      if (ok) setUnlocked(true);
      else setPwError("Incorrect password.");
    } catch {
      setPwError("Couldn't verify the password.");
    } finally {
      setPwChecking(false);
    }
  }

  function openAccessEditor() {
    setAccPassword("");
    setAccExpiry(rec?.expiresAt ? toLocalInput(rec.expiresAt) : "");
    setEditingAccess(true);
  }

  async function saveAccess() {
    if (!rec) return;
    setSavingAccess(true);
    try {
      const expiresAt = accExpiry ? new Date(accExpiry).toISOString() : null;
      await updateRecording(rec.id, { expiresAt });
      let passwordProtected = rec.passwordProtected;
      if (accPassword.trim()) {
        await setRecordingPassword(rec.id, accPassword.trim());
        passwordProtected = true;
      }
      setRec({ ...rec, expiresAt, passwordProtected });
      setEditingAccess(false);
    } finally {
      setSavingAccess(false);
    }
  }

  async function clearPassword() {
    if (!rec) return;
    setSavingAccess(true);
    try {
      await setRecordingPassword(rec.id, null);
      setRec({ ...rec, passwordProtected: false });
    } finally {
      setSavingAccess(false);
    }
  }

  async function toggleDownload() {
    if (!rec) return;
    const next = !(rec.allowDownload ?? true);
    await updateRecording(rec.id, { allowDownload: next });
    setRec({ ...rec, allowDownload: next });
  }

  async function generateAI() {
    if (!rec) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: rec.transcript ?? [],
          durationSec: rec.duration,
          currentTitle: rec.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.message ?? "Couldn't generate AI summary.");
        return;
      }
      const summary: AISummary = {
        title: data.title,
        summary: data.summary,
        chapters: data.chapters ?? [],
        generatedAt: Date.now(),
      };
      setAi(summary);
      await updateRecording(rec.id, { ai: summary });
    } catch {
      setAiError("Couldn't reach the AI service.");
    } finally {
      setAiBusy(false);
    }
  }

  // The transcript line currently under the playhead (for captions).
  const currentCaption = useMemo(() => {
    const t = rec?.transcript;
    if (!t || t.length === 0) return null;
    let current: string | null = null;
    for (const seg of t) {
      if (seg.time <= playhead + 0.3) current = seg.text;
      else break;
    }
    return current;
  }, [rec?.transcript, playhead]);

  const hasTranscript = (rec?.transcript?.length ?? 0) > 0;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-[var(--text-dim)]">
        Loading…
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="card max-w-md p-10">
          <h1 className="text-xl font-semibold">Recording not found</h1>
          <p className="mt-2 text-sm text-[var(--text-dim)]">
            {isCloud()
              ? "This link is invalid, or the recording was deleted."
              : "Translume stores recordings privately in the browser they were made in. This link works on that device — add Supabase keys to share across devices and people."}
          </p>
          <Link href="/library" className="btn btn-primary mt-6">
            <IconArrowLeft width={18} height={18} />
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  if (blockedByExpiry) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="card max-w-md p-10">
          <h1 className="text-xl font-semibold">This link has expired</h1>
          <p className="mt-2 text-sm text-[var(--text-dim)]">
            The owner set this share link to expire. Ask them for a fresh link.
          </p>
          <Link href="/" className="btn btn-ghost mt-6">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="card fade-up w-full max-w-sm p-8 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="mt-6 text-xl font-semibold">Password required</h1>
          <p className="mt-2 text-sm text-[var(--text-dim)]">
            This recording is protected. Enter the password to watch.
          </p>
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") unlock();
            }}
            placeholder="Password"
            className="input mt-5"
            autoFocus
          />
          {pwError && <p className="mt-2 text-sm text-[#ff8aa0]">{pwError}</p>}
          <button
            onClick={unlock}
            disabled={pwChecking || !pwInput}
            className="btn btn-primary mt-4 w-full"
          >
            {pwChecking ? "Checking…" : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="grid min-h-screen place-items-center text-[var(--text-dim)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/library" className="btn btn-ghost btn-sm">
            <IconArrowLeft width={18} height={18} />
            <span className="hidden sm:inline">Library</span>
          </Link>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="btn btn-danger btn-sm"
              aria-label="Delete recording"
            >
              <IconTrash width={18} height={18} />
              <span className="hidden sm:inline">
                {deleting ? "Deleting…" : "Delete"}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowShare(true)}
            className="btn btn-primary btn-sm"
          >
            <IconLink width={18} height={18} />
            Share
          </button>
        </div>
      </header>

      <ShareDialog
        open={showShare}
        onClose={() => setShowShare(false)}
        recId={rec.id}
        title={rec.title}
        downloadUrl={url}
        allowDownload={rec.allowDownload !== false || isOwner}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-12 sm:px-8 lg:grid-cols-[1fr_360px]">
        {/* main */}
        <div className="min-w-0">
          <Player
            ref={playerRef}
            src={url}
            poster={rec.thumbnail || undefined}
            clip={
              rec.trimStart != null || rec.trimEnd != null
                ? { start: rec.trimStart ?? 0, end: rec.trimEnd ?? rec.duration }
                : undefined
            }
            markers={comments.map((c) => ({ id: c.id, time: c.time, emoji: c.emoji }))}
            onTimeUpdate={setPlayhead}
            onMarkerClick={() => {}}
          />

          {captionsOn && hasTranscript && (
            <div className="mt-2 min-h-[2.5rem] rounded-xl border border-[var(--border)] bg-black/40 px-4 py-2.5 text-center text-sm">
              {currentCaption ?? (
                <span className="text-[var(--text-faint)]">…</span>
              )}
            </div>
          )}

          {CTA_ENABLED && rec.ctaUrl && (
            <a
              href={rec.ctaUrl}
              target="_blank"
              rel="noreferrer"
              onClick={trackCta}
              className="btn btn-primary mt-4 w-full justify-center py-3 text-base"
            >
              {rec.ctaLabel || "Learn more"}
              <span aria-hidden>→</span>
            </a>
          )}

          <div className="mt-5">
            <h1 className="text-2xl font-semibold tracking-tight">{rec.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--text-dim)]">
              <span>{formatRelativeDate(rec.createdAt)}</span>
              <span className="flex items-center gap-1">
                <IconEye width={15} height={15} /> {rec.views} views
              </span>
              <span className="flex items-center gap-1">
                <IconComment width={15} height={15} /> {comments.length} comments
              </span>
              <span className="chip">{formatDuration(rec.duration)}</span>
              {hasTranscript && (
                <button
                  onClick={() => setCaptionsOn((v) => !v)}
                  className={`chip transition ${
                    captionsOn
                      ? "border-[var(--brand)] text-[var(--brand)]"
                      : "hover:text-[var(--text)]"
                  }`}
                >
                  CC
                </button>
              )}
              {isOwner && myWorkspaceId && (
                <button
                  onClick={toggleTeam}
                  disabled={sharingTeam}
                  className={`chip transition ${
                    rec.workspaceId
                      ? "border-[var(--brand)] text-[var(--brand)]"
                      : "hover:text-[var(--text)]"
                  }`}
                >
                  {rec.workspaceId ? "✓ Shared to team" : "Share to team"}
                </button>
              )}
            </div>
          </div>

          {/* Owner: call-to-action editor */}
          {CTA_ENABLED && isOwner && (
            <div className="card mt-5 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Call to action</h2>
                {(rec.ctaClicks ?? 0) > 0 && (
                  <span className="text-xs text-[var(--text-faint)]">
                    {rec.ctaClicks} {rec.ctaClicks === 1 ? "click" : "clicks"}
                  </span>
                )}
              </div>

              {editingCta ? (
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Button text (e.g. Book a call)"
                    className="input"
                  />
                  <input
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="https://…"
                    className="input"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveCta}
                      disabled={savingCta || !ctaUrl.trim()}
                      className="btn btn-primary"
                    >
                      {savingCta ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingCta(false)} className="btn btn-ghost">
                      Cancel
                    </button>
                    {rec.ctaUrl && (
                      <button
                        onClick={clearCta}
                        disabled={savingCta}
                        className="btn btn-danger ml-auto"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : rec.ctaUrl ? (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{rec.ctaLabel}</div>
                    <div className="truncate text-xs text-[var(--text-dim)]">{rec.ctaUrl}</div>
                  </div>
                  <button onClick={openCtaEditor} className="btn btn-ghost btn-sm shrink-0">
                    Edit
                  </button>
                </div>
              ) : (
                <button onClick={openCtaEditor} className="btn btn-ghost mt-3">
                  Add a call-to-action button
                </button>
              )}
            </div>
          )}

          {/* Owner: access controls */}
          {isOwner && (
            <div className="card mt-5 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Access controls</h2>
                {!editingAccess && (
                  <button
                    onClick={openAccessEditor}
                    className="btn btn-ghost btn-sm"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Download toggle (always visible) */}
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">Allow downloads</div>
                  <div className="text-xs text-[var(--text-dim)]">
                    Viewers can save the video file
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={rec.allowDownload !== false}
                  onClick={toggleDownload}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    rec.allowDownload !== false
                      ? "bg-[var(--brand)]"
                      : "bg-[var(--panel-strong)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      rec.allowDownload !== false ? "left-[1.375rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Status line */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`chip ${rec.passwordProtected ? "border-[var(--brand)] text-[var(--brand)]" : ""}`}>
                  {rec.passwordProtected ? "🔒 Password set" : "No password"}
                </span>
                <span className={`chip ${rec.expiresAt ? "border-[var(--brand)] text-[var(--brand)]" : ""}`}>
                  {rec.expiresAt
                    ? `Expires ${new Date(rec.expiresAt).toLocaleDateString()}`
                    : "No expiry"}
                </span>
              </div>

              {editingAccess && (
                <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
                      {rec.passwordProtected ? "Change password" : "Set a password"}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={accPassword}
                        onChange={(e) => setAccPassword(e.target.value)}
                        placeholder={rec.passwordProtected ? "New password" : "Password"}
                        className="input"
                      />
                      {rec.passwordProtected && (
                        <button
                          onClick={clearPassword}
                          disabled={savingAccess}
                          className="btn btn-ghost btn-sm shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
                      Link expiry
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={accExpiry}
                        onChange={(e) => setAccExpiry(e.target.value)}
                        className="input"
                      />
                      {accExpiry && (
                        <button
                          onClick={() => setAccExpiry("")}
                          className="btn btn-ghost btn-sm shrink-0"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveAccess}
                      disabled={savingAccess}
                      className="btn btn-primary"
                    >
                      {savingAccess ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingAccess(false)}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI summary */}
          <div className="card mt-5 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <IconSparkle width={16} height={16} className="text-[var(--brand-2)]" />
              AI summary
              {!ai && (
                <button
                  onClick={generateAI}
                  disabled={aiBusy}
                  className="btn btn-primary ml-auto px-3 py-1.5 text-xs"
                >
                  {aiBusy ? "Generating…" : "Generate"}
                </button>
              )}
              {ai && (
                <button
                  onClick={generateAI}
                  disabled={aiBusy}
                  className="ml-auto text-xs text-[var(--text-faint)] hover:text-[var(--text)]"
                >
                  {aiBusy ? "Regenerating…" : "Regenerate"}
                </button>
              )}
            </div>

            {ai ? (
              <>
                <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                  {ai.summary}
                </p>
                {ai.chapters.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                      Chapters
                    </div>
                    <ul className="flex flex-col gap-1">
                      {ai.chapters.map((ch, i) => (
                        <li key={i}>
                          <button
                            onClick={() => playerRef.current?.seek(ch.time)}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-[var(--panel-strong)]"
                          >
                            <span className="chip tabular-nums">
                              {formatDuration(ch.time)}
                            </span>
                            <span className="text-[var(--text)]">{ch.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : aiError ? (
              <p className="text-sm leading-relaxed text-[#ff8aa0]">{aiError}</p>
            ) : hasTranscript ? (
              <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                A transcript was captured for this recording. Generate an
                auto-title, summary, and chapter markers with Claude.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-[var(--text-dim)]">
                No transcript was captured. Record with your microphone on in a
                Chromium browser (Chrome/Edge) to enable AI summaries.
              </p>
            )}
          </div>

          {/* Transcript */}
          {hasTranscript && (
            <div className="card mt-4 overflow-hidden">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold transition hover:bg-[var(--panel-strong)]"
              >
                <span>Transcript</span>
                <span className="text-[var(--text-faint)]">
                  {showTranscript ? "Hide" : "Show"}
                </span>
              </button>
              {showTranscript && (
                <div className="scrollbar-thin max-h-80 overflow-y-auto border-t border-[var(--border)] px-5 py-3">
                  <ul className="flex flex-col gap-2">
                    {rec.transcript!.map((seg, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <button
                          onClick={() => playerRef.current?.seek(seg.time)}
                          className="chip shrink-0 tabular-nums hover:border-[var(--brand)] hover:text-[var(--brand)]"
                        >
                          {formatDuration(seg.time)}
                        </button>
                        <span className="text-[var(--text-dim)]">{seg.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* comments sidebar */}
        <aside className="flex flex-col">
          <div className="card flex max-h-[calc(100vh-2rem)] flex-col lg:sticky lg:top-4">
            <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold">
              Conversation
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-3">
              {comments.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--text-faint)]">
                  No comments yet. Drop the first reaction below.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {comments.map((c) => (
                    <li key={c.id} className="group flex gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full brand-gradient text-xs font-bold text-white">
                        {initials(c.author) || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {c.author}
                          </span>
                          <button
                            onClick={() => playerRef.current?.seek(c.time)}
                            className="chip hover:border-[var(--brand)] hover:text-[var(--brand)]"
                          >
                            {formatDuration(c.time)}
                          </button>
                          <button
                            onClick={() => removeComment(c.id)}
                            className="ml-auto text-[var(--text-faint)] opacity-0 transition hover:text-[var(--danger)] group-hover:opacity-100"
                            aria-label="Delete comment"
                          >
                            <IconTrash width={14} height={14} />
                          </button>
                        </div>
                        <p className="mt-0.5 break-words text-sm text-[var(--text-dim)]">
                          {c.emoji && <span className="mr-1 text-base">{c.emoji}</span>}
                          {c.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* composer */}
            <div className="border-t border-[var(--border)] p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_EMOJI.map((e) => (
                  <button
                    key={e}
                    onClick={() => submitComment(e)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-base transition hover:border-[var(--brand)] hover:bg-[var(--panel-strong)]"
                    title={`React at ${formatDuration(playhead)}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input mb-2 text-xs"
                placeholder="Your name"
              />
              <div className="flex items-end gap-2">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment(null);
                  }}
                  rows={2}
                  placeholder={`Comment at ${formatDuration(playhead)}…`}
                  className="input flex-1 resize-none"
                />
                <button
                  onClick={() => submitComment(null)}
                  disabled={!body.trim()}
                  className="btn btn-primary px-3 py-2.5"
                  aria-label="Send comment"
                >
                  <IconComment width={18} height={18} />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
