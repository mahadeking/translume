import Anthropic from "@anthropic-ai/sdk";
import type { Chapter, TranscriptSegment } from "@/lib/types";

export const runtime = "nodejs";

interface GenerateBody {
  transcript: TranscriptSegment[];
  durationSec: number;
  currentTitle?: string;
}

function fmt(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "A concise, descriptive video title (max ~8 words)" },
    summary: {
      type: "string",
      description: "A 2-4 sentence summary of what the video covers, in a friendly, clear voice.",
    },
    chapters: {
      type: "array",
      description: "Chapter markers covering the video in order.",
      items: {
        type: "object",
        properties: {
          time: { type: "number", description: "Chapter start time in seconds (>= 0)" },
          title: { type: "string", description: "Short chapter title (max ~6 words)" },
        },
        required: ["time", "title"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "summary", "chapters"],
  additionalProperties: false,
} as const;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error: "no_key",
        message:
          "AI is not configured. Add ANTHROPIC_API_KEY to .env.local to enable auto title, summary, and chapters.",
      },
      { status: 501 }
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const transcript = body.transcript ?? [];
  if (transcript.length === 0) {
    return Response.json(
      {
        error: "no_transcript",
        message:
          "This recording has no transcript yet. Record with your microphone on (in a Chromium browser) to capture one.",
      },
      { status: 422 }
    );
  }

  const transcriptText = transcript
    .map((s) => `[${fmt(s.time)}] ${s.text}`)
    .join("\n");

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2000,
      system:
        "You turn a timestamped transcript of a screen/camera recording into a clean title, a short summary, and chapter markers. " +
        "Chapter `time` values must be actual seconds taken from the bracketed [m:ss] timestamps in the transcript. " +
        "Always include a chapter starting at 0. Keep chapters proportionate to the video length; short videos may need only 1-3.",
      messages: [
        {
          role: "user",
          content:
            `Video length: ${fmt(body.durationSec)} (${Math.round(body.durationSec)} seconds).\n` +
            (body.currentTitle ? `Current working title: ${body.currentTitle}\n` : "") +
            `\nTranscript:\n${transcriptText}`,
        },
      ],
      // Constrain the response to valid JSON matching our schema.
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const parsed = JSON.parse(raw) as {
      title: string;
      summary: string;
      chapters: Chapter[];
    };

    // Sort + clamp chapters defensively.
    const chapters = (parsed.chapters ?? [])
      .map((c) => ({ time: Math.max(0, Math.min(body.durationSec, c.time)), title: c.title }))
      .sort((a, b) => a.time - b.time);

    return Response.json({ title: parsed.title, summary: parsed.summary, chapters });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return Response.json({ error: "ai_failed", message }, { status: 502 });
  }
}
