// Browser recording engine: screen / camera / both, with live canvas
// compositing for the floating webcam bubble and mixed mic + system audio.

import type { RecordMode } from "./types";

export interface RecorderOptions {
  mode: RecordMode;
  mic: boolean;
  systemAudio: boolean;
}

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return "video/webm";
}

export class RecorderEngine {
  opts: RecorderOptions;
  mimeType = "video/webm";
  recordStream: MediaStream | null = null;
  /** Called when the user ends screen-sharing from the browser's own UI. */
  onAutoStop: (() => void) | null = null;

  // Normalized camera-bubble center + diameter (fraction of canvas height).
  camRect = { x: 0.84, y: 0.8, size: 0.26 };

  private displayStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private screenVideo: HTMLVideoElement | null = null;
  private camVideo: HTMLVideoElement | null = null;
  private raf = 0;

  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  private startedAt = 0;
  private pausedAccum = 0;
  private pauseStart = 0;
  state: "idle" | "prepared" | "recording" | "paused" | "stopped" = "idle";

  constructor(opts: RecorderOptions) {
    this.opts = opts;
  }

  /** Acquire streams + build the recording pipeline, but don't record yet. */
  async prepare(): Promise<void> {
    const { mode, mic, systemAudio } = this.opts;

    if (mode === "screen" || mode === "both") {
      this.displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: systemAudio,
      });
      this.displayStream.getVideoTracks()[0].addEventListener("ended", () => {
        this.onAutoStop?.();
      });
    }

    if (mode === "camera" || mode === "both") {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
    }

    if (mic) {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch {
        this.micStream = null;
      }
    }

    const audioTracks = this.buildAudio();
    let videoTrack: MediaStreamTrack;

    if (mode === "both") {
      videoTrack = await this.startCompositing();
    } else if (mode === "camera") {
      videoTrack = this.cameraStream!.getVideoTracks()[0];
    } else {
      videoTrack = this.displayStream!.getVideoTracks()[0];
    }

    this.recordStream = new MediaStream([videoTrack, ...audioTracks]);
    this.mimeType = pickMimeType();

    this.recorder = new MediaRecorder(this.recordStream, {
      mimeType: this.mimeType,
      videoBitsPerSecond: 6_000_000,
    });
    this.chunks = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };
    this.state = "prepared";
  }

  /** Start the actual recording — call after any countdown. */
  begin(): void {
    if (!this.recorder || this.state === "recording") return;
    this.recorder.start(1000);
    this.startedAt = performance.now();
    this.pausedAccum = 0;
    this.state = "recording";
  }

  private buildAudio(): MediaStreamTrack[] {
    const sources: MediaStream[] = [];
    if (this.micStream?.getAudioTracks().length) sources.push(this.micStream);
    if (this.opts.systemAudio && this.displayStream?.getAudioTracks().length) {
      sources.push(this.displayStream);
    }
    if (sources.length === 0) return [];
    if (sources.length === 1) return [sources[0].getAudioTracks()[0]];

    // Mix multiple sources into one track.
    this.audioCtx = new AudioContext();
    const dest = this.audioCtx.createMediaStreamDestination();
    for (const s of sources) {
      const src = this.audioCtx.createMediaStreamSource(
        new MediaStream(s.getAudioTracks())
      );
      src.connect(dest);
    }
    return [dest.stream.getAudioTracks()[0]];
  }

  private async startCompositing(): Promise<MediaStreamTrack> {
    const settings = this.displayStream!.getVideoTracks()[0].getSettings();
    const W = Math.min(settings.width || 1920, 1920);
    const H = Math.min(settings.height || 1080, 1080);

    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.canvas.getContext("2d")!;

    this.screenVideo = await this.attach(this.displayStream!);
    this.camVideo = await this.attach(this.cameraStream!);

    const draw = () => {
      const sv = this.screenVideo!;
      const cv = this.camVideo!;
      if (sv.readyState >= 2) {
        ctx.drawImage(sv, 0, 0, W, H);
      }
      if (cv.readyState >= 2) {
        const d = this.camRect.size * H; // diameter
        const cx = this.camRect.x * W;
        const cy = this.camRect.y * H;
        const vw = cv.videoWidth;
        const vh = cv.videoHeight;
        const sq = Math.min(vw, vh);
        const sx = (vw - sq) / 2;
        const sy = (vh - sq) / 2;

        ctx.save();
        // soft shadow ring
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2 + 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(124,108,255,0.9)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
        ctx.clip();
        // mirror the webcam (selfie view)
        ctx.translate(cx + d / 2, cy - d / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(cv, sx, sy, sq, sq, 0, 0, d, d);
        ctx.restore();
      }
      this.raf = requestAnimationFrame(draw);
    };
    draw();

    return this.canvas.captureStream(30).getVideoTracks()[0];
  }

  private attach(stream: MediaStream): Promise<HTMLVideoElement> {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.srcObject = stream;
      v.onloadedmetadata = () => {
        v.play().finally(() => resolve(v));
      };
    });
  }

  setCamPosition(nx: number, ny: number) {
    this.camRect.x = Math.max(0.06, Math.min(0.94, nx));
    this.camRect.y = Math.max(0.08, Math.min(0.92, ny));
  }

  pause() {
    if (this.recorder?.state === "recording") {
      this.recorder.pause();
      this.pauseStart = performance.now();
      this.state = "paused";
    }
  }

  resume() {
    if (this.recorder?.state === "paused") {
      this.recorder.resume();
      this.pausedAccum += performance.now() - this.pauseStart;
      this.state = "recording";
    }
  }

  elapsed(): number {
    if (!this.startedAt) return 0;
    const now = this.state === "paused" ? this.pauseStart : performance.now();
    return Math.max(0, (now - this.startedAt - this.pausedAccum) / 1000);
  }

  stop(): Promise<{ blob: Blob; duration: number; mimeType: string }> {
    return new Promise((resolve) => {
      const duration = this.elapsed();
      const finish = () => {
        const blob = new Blob(this.chunks, { type: this.mimeType });
        this.dispose();
        this.state = "stopped";
        resolve({ blob, duration, mimeType: this.mimeType });
      };
      if (this.recorder && this.recorder.state !== "inactive") {
        this.recorder.onstop = finish;
        this.recorder.stop();
      } else {
        finish();
      }
    });
  }

  private dispose() {
    cancelAnimationFrame(this.raf);
    this.displayStream?.getTracks().forEach((t) => t.stop());
    this.cameraStream?.getTracks().forEach((t) => t.stop());
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.audioCtx?.close().catch(() => {});
    if (this.screenVideo) this.screenVideo.srcObject = null;
    if (this.camVideo) this.camVideo.srcObject = null;
  }
}
