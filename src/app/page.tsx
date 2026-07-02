import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LandingNav } from "@/components/LandingNav";
import { LandingMobileMenu } from "@/components/LandingMobileMenu";
import {
  IconRecord,
  IconScreen,
  IconSparkle,
  IconComment,
  IconLink,
  IconEye,
  IconLibrary,
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

const LOGOS = [
  {
    name: "Nimbus",
    mark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.6A3.5 3.5 0 0 1 17 18H7Z" />
      </svg>
    ),
  },
  {
    name: "Flowbase",
    mark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <rect x="3" y="11" width="3.5" height="9" rx="1.5" />
        <rect x="10" y="6" width="3.5" height="14" rx="1.5" />
        <rect x="17" y="3" width="3.5" height="17" rx="1.5" />
      </svg>
    ),
  },
  {
    name: "Hexa",
    mark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3l7 4v8l-7 4-7-4V7z" />
      </svg>
    ),
  },
  {
    name: "Orbit",
    mark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "Vela",
    mark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M5 19 19 5v14z" />
      </svg>
    ),
  },
  {
    name: "Pulse",
    mark: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 12h4l2-5 3 10 2-5h4" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo />
          <LandingNav />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/record" className="btn btn-primary btn-sm">
              <IconRecord width={18} height={18} />
              <span className="hidden sm:inline">Start recording</span>
              <span className="sm:hidden">Record</span>
            </Link>
            <LandingMobileMenu />
          </div>
        </div>
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
        <div className="fade-up mx-auto mt-9 flex max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
          <Link
            href="/record"
            className="btn btn-primary w-full justify-center px-6 py-3 text-base sm:w-auto"
          >
            <IconRecord width={20} height={20} />
            Record your first Translume
          </Link>
          <Link
            href="/login?mode=signup"
            className="btn btn-ghost w-full justify-center px-6 py-3 text-base sm:w-auto"
          >
            Start for free
          </Link>
        </div>
        <p className="mt-4 text-sm text-[var(--text-faint)]">
          No sign-up. Runs right in your browser.
        </p>

        {/* Product preview mock */}
        <div id="demo" className="fade-up mt-16 scroll-mt-24">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[var(--border-strong)] glass-strong shadow-2xl shadow-[rgba(124,108,255,0.25)]">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 truncate rounded-md bg-black/30 px-3 py-1 text-xs text-[var(--text-faint)]">
                translume.app/v/quarterly-update
              </span>
            </div>
            <div className="relative aspect-video bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src="https://kzpjcgfjxxuiojvncvrl.supabase.co/storage/v1/object/public/recordings/demo.webm"
                poster="https://kzpjcgfjxxuiojvncvrl.supabase.co/storage/v1/object/public/recordings/demo-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-[var(--border)] py-14">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            Thousands of product and brand teams use{" "}
            <span className="brand-text">Translume</span> to ignite collaboration
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-7 text-[var(--text-faint)]">
            {LOGOS.map((l) => (
              <span
                key={l.name}
                className="flex items-center gap-2 text-lg font-bold tracking-tight transition hover:text-[var(--text-dim)]"
              >
                {l.mark}
                {l.name}
              </span>
            ))}
          </div>
          <p className="mt-7 text-xs text-[var(--text-faint)]">Sample brands shown.</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20 scroll-mt-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          More than a screen recorder.{" "}
          <span className="brand-text">It&apos;s the whole conversation.</span>
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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-center text-sm text-[var(--text-faint)] sm:flex-row sm:text-left">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="transition hover:text-[var(--text)]">Pricing</Link>
            <Link href="/terms" className="transition hover:text-[var(--text)]">Terms</Link>
            <Link href="/privacy" className="transition hover:text-[var(--text)]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
