"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { RecorderEngine } from "@/lib/recorder";
import { LiveTranscriber } from "@/lib/transcribe";
import { useAuth } from "@/lib/useAuth";
import { saveRecording } from "@/lib/store";
import type { RecordMode, TranscriptSegment } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import {
  IconScreen,
  IconCamera,
  IconBoth,
  IconMic,
  IconMicOff,
  IconSpeaker,
  IconRecord,
  IconStop,
  IconPause,
  IconPlay,
  IconArrowLeft,
  IconDownload,
  IconCheck,
  IconSparkle,
} from "@/components/icons";

type Phase = "setup" | "countdown" | "recording" | "review";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const modes: { id: RecordMode; label: string; icon: typeof IconScreen; hint: string }[] = [
  { id: "both", label: "Screen + Cam", icon: IconBoth, hint: "Your screen with a webcam bubble" },
  { id: "screen", label: "Screen only", icon: IconScreen, hint: "Just capture your screen" },
  { id: "camera", label: "Camera only", icon: IconCamera, hint: "A talking-head message" },
];

export default function RecordPage() {
  const router = useRouter();
  const { user, loading, authRequired } = useAuth();
  useEffect(() => {
    if (authRequired && !loading && !user) router.replace("/login");
  }, [authRequired, loading, user, router]);

  const engineRef = useRef<RecorderEngine | null>(null);
  const transcriberRef = useRef<LiveTranscriber | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const reviewRef = useRef<HTMLVideoElement | null>(null);

  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<RecordMode>("both");
  const [mic, setMic] = useState(true);
  const [systemAudio, setSystemAudio] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [result, setResult] = useState<{
    blob: Blob;
    url: string;
    duration: number;
    mimeType: string;
    mode: RecordMode;
    transcript: TranscriptSegment[];
  } | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [trim, setTrim] = useState<{ start: number; end: number } | null>(null);
  const [reviewDur, setReviewDur] = useState(0);
  const [customThumb, setCustomThumb] = useState<string | null>(null);

  // tick the timer while recording
  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => {
      setElapsed(engineRef.current?.elapsed() ?? 0);
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      transcriberRef.current?.stop();
      engineRef.current?.stop().catch(() => {});
    };
  }, []);

  const finalizeStop = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const transcript = transcriberRef.current?.stop() ?? [];
    transcriberRef.current = null;
    const { blob, duration, mimeType } = await engine.stop();
    const url = URL.createObjectURL(blob);
    setResult({ blob, url, duration, mimeType, mode: engine.opts.mode, transcript });
    setReviewDur(duration);
    setTrim({ start: 0, end: duration });
    setCustomThumb(null);
    setTitle(defaultTitle(engine.opts.mode));
    setPhase("review");
  }, []);

  async function startRecording() {
    setError(null);
    const engine = new RecorderEngine({ mode, mic, systemAudio });
    engine.onAutoStop = () => {
      // user clicked "Stop sharing" in the browser bar
      if (engineRef.current === engine && phaseRef.current === "recording") {
        finalizeStop();
      }
    };
    try {
      await engine.prepare();
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Permission denied or the picker was dismissed. Try again."
          : "Couldn't start recording. Check camera / screen permissions.";
      setError(msg);
      engine.stop().catch(() => {});
      return;
    }
    engineRef.current = engine;

    // Show the live preview, then run a 3-2-1 countdown before recording begins.
    setPhase("countdown");
    requestAnimationFrame(() => {
      if (previewRef.current && engine.recordStream) {
        previewRef.current.srcObject = engine.recordStream;
        previewRef.current.play().catch(() => {});
      }
    });
    for (let n = 3; n >= 1; n--) {
      setCountdown(n);
      await wait(750);
    }
    setCountdown(0);

    // Bail if the user navigated away / cancelled during the countdown.
    if (engineRef.current !== engine) return;

    engine.begin();
    if (mic) {
      const transcriber = new LiveTranscriber(() => engine.elapsed());
      transcriber.start();
      transcriberRef.current = transcriber;
    }
    setPaused(false);
    setElapsed(0);
    setPhase("recording");
  }

  // keep a ref of the phase for the onAutoStop closure
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  function togglePause() {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) {
      engine.resume();
      setPaused(false);
    } else {
      engine.pause();
      setPaused(true);
    }
  }

  function handleBubbleDrag(e: React.PointerEvent<HTMLVideoElement>) {
    if (mode !== "both") return;
    const engine = engineRef.current;
    const el = previewRef.current;
    if (!engine || !el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    engine.setCamPosition(nx, ny);
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    const trimmed =
      trim && (trim.start > 0.05 || trim.end < reviewDur - 0.05)
        ? { trimStart: trim.start, trimEnd: trim.end }
        : {};
    try {
      const rec = await saveRecording({
        blob: result.blob,
        title: title.trim() || defaultTitle(result.mode),
        duration: result.duration,
        mode: result.mode,
        mimeType: result.mimeType,
        transcript: result.transcript,
        thumbnail: customThumb ?? undefined,
        ...trimmed,
      });
      router.push(`/v/${rec.id}`);
    } catch {
      setError("Couldn't save the recording.");
      setSaving(false);
    }
  }

  function discard() {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setTitle("");
    setPhase("setup");
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${(title || "translume").replace(/[^a-z0-9]+/gi, "-")}.webm`;
    a.click();
  }

  function seekReview(t: number) {
    if (reviewRef.current) reviewRef.current.currentTime = t;
  }

  function captureThumb() {
    const v = reviewRef.current;
    if (!v) return;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    const scale = Math.min(1, 640 / w);
    const c = document.createElement("canvas");
    c.width = Math.round(w * scale);
    c.height = Math.round(h * scale);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    setCustomThumb(c.toDataURL("image/jpeg", 0.7));
  }

  const trimmedDur =
    trim && reviewDur ? Math.max(0, trim.end - trim.start) : result?.duration ?? 0;

  if (authRequired && !user) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Logo />
        {phase === "recording" ? (
          <div className="flex items-center gap-2 rounded-full border border-[rgba(255,90,120,0.4)] bg-[rgba(255,90,120,0.12)] px-4 py-1.5 text-sm font-semibold">
            <span className="rec-dot h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />
            <span className="tabular-nums">{formatDuration(elapsed)}</span>
          </div>
        ) : (
          <Link href="/library" className="btn btn-ghost">
            <IconArrowLeft width={18} height={18} />
            Library
          </Link>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-8">
        {phase === "setup" && (
          <div className="w-full fade-up">
            <h1 className="text-center text-3xl font-semibold tracking-tight">
              What do you want to record?
            </h1>
            <p className="mt-2 text-center text-[var(--text-dim)]">
              Pick a mode, check your audio, and hit record.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {modes.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`card flex flex-col items-start gap-3 p-5 text-left transition ${
                      active
                        ? "border-[var(--brand)] bg-[var(--panel-strong)] ring-2 ring-[rgba(124,108,255,0.35)]"
                        : "hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl ${
                        active
                          ? "brand-gradient text-white"
                          : "bg-[var(--panel-strong)] text-[var(--brand)]"
                      }`}
                    >
                      <Icon width={20} height={20} />
                    </span>
                    <span className="font-semibold">{m.label}</span>
                    <span className="text-xs text-[var(--text-dim)]">{m.hint}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Toggle
                on={mic}
                onClick={() => setMic((v) => !v)}
                onIcon={<IconMic width={18} height={18} />}
                offIcon={<IconMicOff width={18} height={18} />}
                label="Microphone"
              />
              {(mode === "screen" || mode === "both") && (
                <Toggle
                  on={systemAudio}
                  onClick={() => setSystemAudio((v) => !v)}
                  onIcon={<IconSpeaker width={18} height={18} />}
                  offIcon={<IconSpeaker width={18} height={18} />}
                  label="System audio"
                />
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-[rgba(255,90,120,0.3)] bg-[rgba(255,90,120,0.1)] px-4 py-3 text-sm text-[#ff8aa0]">
                {error}
              </p>
            )}

            <button onClick={startRecording} className="btn btn-primary mt-7 w-full py-3 text-base">
              <IconRecord width={20} height={20} />
              Start recording
            </button>
            <p className="mt-3 text-center text-xs text-[var(--text-faint)]">
              {mode === "camera"
                ? "We'll ask for camera access."
                : "You'll choose which screen or window to share."}
            </p>
          </div>
        )}

        {(phase === "recording" || phase === "countdown") && (
          <div className="w-full fade-up">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black">
              <video
                ref={previewRef}
                muted
                playsInline
                onPointerDown={handleBubbleDrag}
                onPointerMove={(e) => e.buttons === 1 && handleBubbleDrag(e)}
                className={`aspect-video w-full object-contain ${
                  mode === "both" && phase === "recording"
                    ? "cursor-grab active:cursor-grabbing"
                    : ""
                }`}
              />
              {paused && phase === "recording" && (
                <div className="absolute inset-0 grid place-items-center bg-black/60 text-lg font-semibold">
                  Paused
                </div>
              )}
              {phase === "countdown" && (
                <div className="absolute inset-0 grid place-items-center bg-black/50">
                  <span className="grid h-28 w-28 place-items-center rounded-full brand-gradient text-5xl font-bold text-white shadow-2xl">
                    {countdown || "GO"}
                  </span>
                </div>
              )}
            </div>
            {phase === "recording" && mode === "both" && (
              <p className="mt-3 text-center text-xs text-[var(--text-faint)]">
                Drag on the preview to reposition your webcam bubble.
              </p>
            )}

            {phase === "recording" && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button onClick={togglePause} className="btn btn-ghost px-5 py-3">
                  {paused ? <IconPlay width={18} height={18} /> : <IconPause width={18} height={18} />}
                  {paused ? "Resume" : "Pause"}
                </button>
                <button onClick={finalizeStop} className="btn btn-primary px-6 py-3">
                  <IconStop width={18} height={18} />
                  Stop &amp; review
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "review" && result && (
          <div className="w-full fade-up">
            <h1 className="text-center text-2xl font-semibold tracking-tight">
              Looking good. Ready to share?
            </h1>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black">
              <video
                ref={reviewRef}
                src={result.url}
                controls
                playsInline
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  // MediaRecorder webm reports Infinity duration & isn't seekable
                  // until nudged — do that so trim handles can scrub.
                  if (v.duration === Infinity || Number.isNaN(v.duration)) {
                    v.currentTime = 1e7;
                    v.ontimeupdate = () => {
                      v.ontimeupdate = null;
                      v.currentTime = 0;
                    };
                  }
                }}
                className="aspect-video w-full"
              />
            </div>

            <label className="mt-5 block text-sm font-medium text-[var(--text-dim)]">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input mt-1.5"
              placeholder="Give your recording a title"
            />

            {/* Trim */}
            {trim && reviewDur > 0 && (
              <div className="card mt-4 p-4">
                <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                  <span>Trim</span>
                  <span className="text-xs font-normal text-[var(--text-dim)]">
                    {formatDuration(trim.start)} – {formatDuration(trim.end)} ·{" "}
                    {formatDuration(trimmedDur)} kept
                  </span>
                </div>
                <label className="mb-1 block text-xs text-[var(--text-faint)]">
                  Start
                </label>
                <input
                  type="range"
                  min={0}
                  max={reviewDur}
                  step={0.1}
                  value={trim.start}
                  onChange={(e) => {
                    const start = Math.min(Number(e.target.value), trim.end - 0.2);
                    setTrim({ ...trim, start });
                    seekReview(start);
                  }}
                  className="w-full accent-[var(--brand)]"
                />
                <label className="mb-1 mt-2 block text-xs text-[var(--text-faint)]">
                  End
                </label>
                <input
                  type="range"
                  min={0}
                  max={reviewDur}
                  step={0.1}
                  value={trim.end}
                  onChange={(e) => {
                    const end = Math.max(Number(e.target.value), trim.start + 0.2);
                    setTrim({ ...trim, end });
                    seekReview(end);
                  }}
                  className="w-full accent-[var(--brand)]"
                />
                {(trim.start > 0.05 || trim.end < reviewDur - 0.05) && (
                  <button
                    onClick={() => setTrim({ start: 0, end: reviewDur })}
                    className="mt-2 text-xs text-[var(--text-faint)] hover:text-[var(--text)]"
                  >
                    Reset trim
                  </button>
                )}
              </div>
            )}

            {/* Thumbnail */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-black/40">
                {customThumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customThumb} alt="thumbnail" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="text-sm">
                <button onClick={captureThumb} className="btn btn-ghost px-3 py-1.5 text-xs">
                  Use current frame as thumbnail
                </button>
                <p className="mt-1 text-xs text-[var(--text-faint)]">
                  Scrub the video above, then capture a frame. Otherwise we pick one
                  automatically.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-faint)]">
              <span className="chip">{formatDuration(trimmedDur)}</span>
              <span className="chip">{result.mode}</span>
              {result.transcript.length > 0 && (
                <span className="chip">
                  <IconSparkle width={12} height={12} className="text-[var(--brand-2)]" />
                  Transcript captured
                </span>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm text-[#ff8aa0]">{error}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={save} disabled={saving} className="btn btn-primary px-6 py-3">
                <IconCheck width={18} height={18} />
                {saving ? "Saving…" : "Save & get link"}
              </button>
              <button onClick={download} className="btn btn-ghost px-5 py-3">
                <IconDownload width={18} height={18} />
                Download
              </button>
              <button onClick={discard} className="btn btn-ghost px-5 py-3">
                Re-record
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  onIcon,
  offIcon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        on
          ? "border-[var(--border-strong)] bg-[var(--panel-strong)] text-[var(--text)]"
          : "border-[var(--border)] bg-transparent text-[var(--text-faint)]"
      }`}
    >
      <span className={on ? "text-[var(--brand)]" : ""}>{on ? onIcon : offIcon}</span>
      {label}
      <span
        className={`ml-1 h-4 w-7 rounded-full p-0.5 transition ${
          on ? "brand-gradient" : "bg-[var(--border-strong)]"
        }`}
      >
        <span
          className={`block h-3 w-3 rounded-full bg-white transition ${
            on ? "translate-x-3" : ""
          }`}
        />
      </span>
    </button>
  );
}

function defaultTitle(mode: RecordMode): string {
  const d = new Date();
  const when = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const label = mode === "camera" ? "Camera message" : mode === "screen" ? "Screen recording" : "Screen + cam";
  return `${label} — ${when}`;
}
