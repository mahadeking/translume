"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Player, type PlayerHandle } from "@/components/Player";
import { ShareDialog } from "@/components/ShareDialog";
import {
  getRecording,
  getObjectURL,
  listComments,
  addComment,
  deleteComment,
  incrementViews,
  updateRecording,
  isCloud,
} from "@/lib/store";
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

export function Watch({ id }: { id: string }) {
  const playerRef = useRef<PlayerHandle | null>(null);
  const [rec, setRec] = useState<Recording | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [playhead, setPlayhead] = useState(0);

  const [name, setName] = useState("You");
  const [body, setBody] = useState("");
  const [showShare, setShowShare] = useState(false);

  const [ai, setAi] = useState<AISummary | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    (async () => {
      const r = await getRecording(id);
      if (!r) {
        setLoading(false);
        return;
      }
      setRec(r);
      if (r.ai) setAi(r.ai);
      pushRecent(id);
      objectUrl = await getObjectURL(id);
      setUrl(objectUrl);
      setComments(await listComments(id));
      incrementViews(id);
      setLoading(false);
    })();
    const saved = localStorage.getItem("translume_name");
    if (saved) setName(saved);
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

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

  if (!rec || !url) {
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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/library" className="btn btn-ghost">
            <IconArrowLeft width={18} height={18} />
            <span className="hidden sm:inline">Library</span>
          </Link>
          <button onClick={() => setShowShare(true)} className="btn btn-primary">
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
            </div>
          </div>

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
