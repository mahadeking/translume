// Live transcription via the Web Speech API, stamping each final phrase with
// the recording clock so we can build a timestamped transcript + captions.
// Chrome/Edge only; degrades gracefully where unsupported.

import type { TranscriptSegment } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function isTranscriptionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

export class LiveTranscriber {
  supported: boolean;
  segments: TranscriptSegment[] = [];
  private rec: any = null;
  private active = false;

  /** getTime returns the current recording position in seconds. */
  constructor(private getTime: () => number) {
    this.supported = isTranscriptionSupported();
  }

  start() {
    if (!this.supported) return;
    const SR = getSpeechRecognition();
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = navigator.language || "en-US";

    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = (result[0]?.transcript ?? "").trim();
          if (text) this.segments.push({ time: this.getTime(), text });
        }
      }
    };

    // SpeechRecognition stops on its own after pauses — restart while recording.
    rec.onend = () => {
      if (this.active) {
        try {
          rec.start();
        } catch {
          /* already starting */
        }
      }
    };
    rec.onerror = () => {
      /* swallow transient errors; onend handles restart */
    };

    this.rec = rec;
    this.active = true;
    try {
      rec.start();
    } catch {
      /* ignore */
    }
  }

  stop(): TranscriptSegment[] {
    this.active = false;
    try {
      this.rec?.stop();
    } catch {
      /* ignore */
    }
    return this.segments;
  }
}
