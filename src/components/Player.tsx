"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { formatDuration } from "@/lib/format";
import { IconPlay, IconPause, IconSpeaker } from "./icons";

export interface PlayerHandle {
  seek: (t: number) => void;
  getCurrentTime: () => number;
  pause: () => void;
}

export interface Marker {
  id: string;
  time: number;
  emoji?: string | null;
}

interface PlayerProps {
  src: string;
  poster?: string;
  markers?: Marker[];
  /** AI chapter markers shown as ticks on the timeline. */
  chapters?: { time: number; title: string }[];
  /** Non-destructive trim: play only this range. */
  clip?: { start: number; end: number };
  /** Start playback at this time (e.g. from a ?t= deep link). */
  startAt?: number;
  onTimeUpdate?: (t: number) => void;
  onMarkerClick?: (id: string) => void;
}

const SPEEDS = [1, 1.25, 1.5, 2];

export const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  { src, poster, markers = [], chapters = [], clip, startAt, onTimeUpdate, onMarkerClick },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(false);

  // Effective trim window.
  const clipStart = clip ? Math.max(0, clip.start) : 0;
  const clipEnd = clip && clip.end > clipStart ? clip.end : duration;
  const span = Math.max(0.01, clipEnd - clipStart);
  const rel = Math.max(0, Math.min(span, current - clipStart));

  const clampToClip = (t: number) => Math.max(clipStart, Math.min(clipEnd, t));

  useImperativeHandle(ref, () => ({
    seek: (t: number) => {
      const v = videoRef.current;
      if (v) {
        v.currentTime = clampToClip(t);
        v.play().catch(() => {});
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    pause: () => videoRef.current?.pause(),
  }));

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    // Restart from the in-point if we're parked at the out-point.
    if (v.paused && v.currentTime >= clipEnd - 0.1) v.currentTime = clipStart;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function onScrub(e: React.MouseEvent<HTMLDivElement>) {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = clipStart + ratio * span;
  }

  function cycleSpeed() {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  }

  function fullscreen() {
    videoRef.current?.parentElement?.requestFullscreen?.().catch(() => {});
  }

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      const v = videoRef.current;
      if (!v) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        v.currentTime = clampToClip(v.currentTime + 5);
      } else if (e.code === "ArrowLeft") {
        v.currentTime = clampToClip(v.currentTime - 5);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, clipStart, clipEnd]);

  const pct = (rel / span) * 100;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
          const target =
            startAt && startAt > clipStart
              ? Math.min(startAt, Number.isFinite(d) ? d : startAt)
              : clipStart;
          if (target > 0) e.currentTarget.currentTime = target;
          setReady(true);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          // Enforce the out-point.
          if (clip && t >= clipEnd - 0.05) {
            e.currentTarget.pause();
            e.currentTarget.currentTime = clipEnd;
            setCurrent(clipEnd);
            onTimeUpdate?.(clipEnd);
            return;
          }
          setCurrent(t);
          onTimeUpdate?.(t);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="aspect-video w-full cursor-pointer bg-black object-contain"
      />

      {/* center play */}
      {!playing && ready && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center bg-black/20 transition"
          aria-label="Play"
        >
          <span className="grid h-20 w-20 place-items-center rounded-full brand-gradient shadow-2xl shadow-[rgba(124,108,255,0.6)] transition hover:scale-105">
            <IconPlay width={34} height={34} className="text-white" />
          </span>
        </button>
      )}

      {/* controls */}
      <div className="touch-visible absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-10 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 data-[show=true]:opacity-100">
        {/* timeline */}
        <div className="relative">
          <div
            onClick={onScrub}
            className="group/track relative h-2 cursor-pointer rounded-full bg-white/20"
          >
            <div
              className="h-full rounded-full brand-gradient"
              style={{ width: `${pct}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
              style={{ left: `${pct}%` }}
            />
            {/* comment markers (within the trim window) */}
            {markers
              .filter((m) => m.time >= clipStart && m.time <= clipEnd)
              .map((m) => {
                const left = ((m.time - clipStart) / span) * 100;
                return (
                  <button
                    key={m.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick?.(m.id);
                      if (videoRef.current)
                        videoRef.current.currentTime = clampToClip(m.time);
                    }}
                    title={`Comment at ${formatDuration(m.time - clipStart)}`}
                    className="absolute -top-1.5 grid h-5 w-5 -translate-x-1/2 place-items-center rounded-full border border-white/60 bg-[var(--brand-2)] text-[10px] shadow"
                    style={{ left: `${left}%` }}
                  >
                    {m.emoji ?? "💬"}
                  </button>
                );
              })}
            {/* AI chapter ticks */}
            {chapters
              .filter((c) => c.time > clipStart + 0.5 && c.time <= clipEnd)
              .map((c, i) => {
                const left = ((c.time - clipStart) / span) * 100;
                return (
                  <button
                    key={`ch-${i}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current)
                        videoRef.current.currentTime = clampToClip(c.time);
                    }}
                    title={`${formatDuration(c.time - clipStart)} · ${c.title}`}
                    className="absolute top-1/2 h-3.5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 transition hover:h-4 hover:bg-white"
                    style={{ left: `${left}%` }}
                  />
                );
              })}
          </div>
        </div>

        {/* buttons row */}
        <div className="mt-2.5 flex items-center gap-3 text-sm">
          <button onClick={togglePlay} aria-label="Play/Pause" className="hover:text-[var(--brand)]">
            {playing ? <IconPause width={20} height={20} /> : <IconPlay width={20} height={20} />}
          </button>
          <span className="tabular-nums text-[var(--text-dim)]">
            {formatDuration(rel)}{" "}
            <span className="text-[var(--text-faint)]">/ {formatDuration(span)}</span>
          </span>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={cycleSpeed}
              className="rounded-md px-2 py-0.5 text-xs font-semibold text-[var(--text-dim)] hover:bg-white/10 hover:text-white"
            >
              {speed}×
            </button>
            <button
              onClick={() => {
                setMuted((m) => !m);
                if (videoRef.current) videoRef.current.muted = !muted;
              }}
              aria-label="Mute"
              className={muted ? "text-[var(--text-faint)]" : "hover:text-[var(--brand)]"}
            >
              <IconSpeaker width={20} height={20} />
            </button>
            <button onClick={fullscreen} aria-label="Fullscreen" className="hover:text-[var(--brand)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
