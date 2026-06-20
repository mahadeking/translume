# Translume 🎬

**Say it clearly.** A modern, beautiful async video-messaging app — screen +
camera recording with instant share links, timeline conversations, and an
AI layer that writes the title, summary, and chapters for you.

Built with **Next.js 16**, **React 19**, **Tailwind v4**, the **Anthropic SDK**
(Claude), and a **local-first** data layer (IndexedDB) that's ready to swap onto
**Supabase**.

## Features

- 🎥 **Record** screen, camera, or both — with a draggable webcam bubble
  composited live into the video, mixed mic + system audio, and pause/resume.
- 🔗 **Instant share page** — a polished custom player with scrubber, speed
  control, fullscreen, and keyboard shortcuts.
- 💬 **Timeline comments & emoji reactions** pinned to the exact second.
- 🧠 **AI layer** — live transcript, plus Claude-generated title, summary, and
  clickable chapters; CC captions on the player.
- 📚 **Library** with search, thumbnails, view counts, and instant deletion.

## Run it

```bash
npm install   # already done by the scaffold
npm run dev
```

Open http://localhost:3000. No accounts, no backend — recording works right in
the browser and everything persists locally in IndexedDB.

> Recording requires a secure context. `localhost` is fine; on a deployed host
> use HTTPS. Transcription uses the Web Speech API (Chrome/Edge).

### Enable AI

Copy `.env.local.example` to `.env.local` and set `ANTHROPIC_API_KEY`
(from [console.anthropic.com](https://console.anthropic.com)). Without it the app
still works; the AI panel just shows a "not configured" message.

## Architecture

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Marketing landing page |
| `src/app/record/page.tsx` | Recorder studio (setup → record → review) |
| `src/app/library/page.tsx` | Dashboard / video grid |
| `src/app/v/[id]/` | Watch & share page (player + comments + AI) |
| `src/app/api/ai/generate/` | Claude route: transcript → title/summary/chapters |
| `src/lib/recorder.ts` | Capture engine (getDisplayMedia/getUserMedia, canvas compositing, audio mixing) |
| `src/lib/transcribe.ts` | Live timestamped transcription (Web Speech API) |
| `src/lib/store.ts` | **Data API** — the single surface the UI depends on |
| `src/lib/idb.ts` | IndexedDB wrapper |
| `supabase/` | Cloud schema + setup guide |

## Going to the cloud

The UI only ever talks to `src/lib/store.ts`. To move from local-first to
multi-user cloud, implement the same functions against Supabase — see
[`supabase/README.md`](./supabase/README.md). No UI changes required.

## Roadmap

- Editor: trim, stitch, edit-by-transcript
- Auth + Supabase storage, cross-device share links, viewer analytics & CTAs
- Folders, custom thumbnails, password/expiry on links, Slack/embed
