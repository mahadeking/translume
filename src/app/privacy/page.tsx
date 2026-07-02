import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Privacy Policy — Translume" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Logo />
          <Link href="/" className="btn btn-ghost btn-sm">Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[var(--text-faint)]">Last updated: 23 June 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-[var(--text-dim)] leading-relaxed">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">Who we are</h2>
            <p>Translume is operated by Transparency Strategies. This policy explains what we collect and how we use it.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">What we collect</h2>
            <p>Account details (name, email), the recordings and content you create, comments, and basic usage data (like view counts). If you subscribe to a paid plan, our payment processor handles your card details — we never see or store full card numbers.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">How we use it</h2>
            <p>To provide the Service — hosting and delivering your videos, generating AI summaries and transcripts, running your account, processing payments, and improving reliability and security.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">Service providers</h2>
            <p>We use trusted providers to run Translume, including Supabase (database, storage, authentication), Anthropic (AI features), Vercel (hosting), Google (optional sign-in), and a payment processor for subscriptions. Your data is processed only to deliver the Service.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">Sharing</h2>
            <p>Recordings are private to you unless you share a link. Anyone with a share link can view that recording (subject to any password or expiry you set). We do not sell your personal data.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">Your choices</h2>
            <p>You can edit your profile, delete individual recordings, or delete your entire account and data from Settings at any time.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">Contact</h2>
            <p>Privacy questions? Email <a href="mailto:transparencystrategies@gmail.com" className="text-[var(--text)] underline">transparencystrategies@gmail.com</a>.</p>
          </section>
          <p className="text-sm text-[var(--text-faint)]">This is a starting template and not legal advice. Have it reviewed by a qualified professional before relying on it.</p>
        </div>
      </main>
    </div>
  );
}
