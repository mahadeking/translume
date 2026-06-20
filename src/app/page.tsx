import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  IconRecord,
  IconScreen,
  IconSparkle,
  IconComment,
  IconLink,
  IconEye,
  IconLibrary,
  IconPlay,
} from "@/components/icons";

const features = [
  {
    icon: IconScreen,
    title: "Screen, cam, or both",
    body: "Capture your screen with a floating webcam bubble you can drag anywhere — composited live, baked into the video.",
  },
  {
    icon: IconLink,
    title: "Instant share links",
    body: "Stop recording and a beautiful watch page is ready immediately. No upload spinner, no waiting.",
  },
  {
    icon: IconComment,
    title: "Timeline conversations",
    body: "Viewers drop comments and emoji reactions pinned to the exact second. Replies feel like a conversation.",
  },
  {
    icon: IconEye,
    title: "Know who watched",
    body: "View counts and engagement on every recording, so you know your message actually landed.",
  },
  {
    icon: IconSparkle,
    title: "AI-ready",
    body: "Built for auto titles, chapters, transcripts and summaries — the smart layer, designed in from day one.",
  },
  {
    icon: IconLibrary,
    title: "A library you'll love",
    body: "Fast search, folders, and a grid that actually looks good. Find any recording in seconds.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost">
            Sign in
          </Link>
          <Link href="/record" className="btn btn-primary">
            <IconRecord width={18} height={18} />
            Start recording
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 text-center">
        <div className="fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-1.5 text-sm text-[var(--text-dim)]">
          <IconSparkle width={15} height={15} className="text-[var(--brand-2)]" />
          The async video tool your screenshots wish they were
        </div>
        <h1 className="fade-up mx-auto max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Talk through it.
          <br />
          <span className="brand-text">Don&apos;t type it all out.</span>
        </h1>
        <p className="fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-dim)]">
          Record your screen and camera, get an instant link, and let people
          reply right on the timeline. A faster, far better-looking way to send a
          video message.
        </p>
        <div className="fade-up mt-9 flex items-center justify-center gap-3">
          <Link href="/record" className="btn btn-primary px-6 py-3 text-base">
            <IconRecord width={20} height={20} />
            Record your first Translume
          </Link>
          <Link href="/library" className="btn btn-ghost px-6 py-3 text-base">
            Open library
          </Link>
        </div>
        <p className="mt-4 text-sm text-[var(--text-faint)]">
          No sign-up. Runs right in your browser.
        </p>

        {/* Product preview mock */}
        <div className="fade-up mt-16">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[var(--border-strong)] glass-strong shadow-2xl shadow-[rgba(124,108,255,0.25)]">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 truncate rounded-md bg-black/30 px-3 py-1 text-xs text-[var(--text-faint)]">
                translume.app/v/quarterly-update
              </span>
            </div>
            <div className="relative aspect-video bg-gradient-to-br from-[#15131f] via-[#0e0c16] to-[#1a1326]">
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-20 w-20 place-items-center rounded-full brand-gradient shadow-xl shadow-[rgba(124,108,255,0.6)]">
                  <IconPlay width={34} height={34} className="text-white" />
                </span>
              </div>
              {/* webcam bubble */}
              <div className="absolute bottom-5 right-5 h-28 w-28 rounded-full border-2 border-[var(--brand)] bg-[#221a33] shadow-2xl" />
              {/* timeline */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-5 pb-4">
                <div className="h-1.5 flex-1 rounded-full bg-white/15">
                  <div className="h-full w-1/3 rounded-full brand-gradient" />
                </div>
                <span className="chip">2:14</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Everything you need to record.{" "}
          <span className="brand-text">Designed like it&apos;s 2026.</span>
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card p-6 transition hover:border-[var(--border-strong)] hover:bg-[var(--panel-strong)]"
              >
                <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-[var(--panel-strong)] text-[var(--brand)]">
                  <Icon width={22} height={22} />
                </span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-dim)]">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="card relative overflow-hidden p-12 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(40rem 20rem at 50% 0%, rgba(124,108,255,0.25), transparent 70%)",
            }}
          />
          <h2 className="relative text-3xl font-semibold tracking-tight">
            Send your first one in under a minute.
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-[var(--text-dim)]">
            Hit record, talk through your screen, and share the link. That&apos;s it.
          </p>
          <Link
            href="/record"
            className="btn btn-primary relative mt-7 px-6 py-3 text-base"
          >
            <IconRecord width={20} height={20} />
            Start recording
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm text-[var(--text-faint)] sm:flex-row">
          <Logo />
          <span>Built as a modern take on async video messaging.</span>
        </div>
      </footer>
    </div>
  );
}
