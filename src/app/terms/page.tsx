import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Terms of Service — Translume" };

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] glass">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3.5">
          <Logo />
          <Link href="/" className="btn btn-ghost btn-sm">Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-[var(--text-faint)]">Last updated: 23 June 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-[var(--text-dim)] leading-relaxed">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">1. Agreement</h2>
            <p>By creating an account or using Translume (the “Service”), operated by Transparency Strategies (“we”, “us”), you agree to these Terms. If you do not agree, do not use the Service.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">2. Your account</h2>
            <p>You are responsible for your account, your login credentials, and all activity under it. You must be old enough to form a binding contract in your jurisdiction.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">3. Your content</h2>
            <p>You retain ownership of the recordings and content you create. You grant us the limited rights needed to host, process, and deliver your content to the people you share it with. You are responsible for having the right to record and share whatever you upload, and for complying with the privacy of anyone captured in your recordings.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">4. Acceptable use</h2>
            <p>Don’t use the Service to break the law, infringe others’ rights, distribute malware, harass people, or record others without a lawful basis. We may suspend accounts that violate these Terms.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">5. Subscriptions & payments</h2>
            <p>Paid plans are billed in advance on a recurring basis through our payment processor. You can cancel anytime; access continues until the end of the current billing period. Fees are non-refundable except where required by law.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">6. Availability & changes</h2>
            <p>We aim for high availability but do not guarantee uninterrupted service. We may change or discontinue features, and we may update these Terms; continued use after changes means you accept them.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">7. Disclaimer & liability</h2>
            <p>The Service is provided “as is”. To the maximum extent permitted by law, we are not liable for indirect or consequential damages, and our total liability is limited to the amount you paid us in the prior 12 months.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">8. Contact</h2>
            <p>Questions? Email <a href="mailto:transparencystrategies@gmail.com" className="text-[var(--text)] underline">transparencystrategies@gmail.com</a>.</p>
          </section>
          <p className="text-sm text-[var(--text-faint)]">This is a starting template and not legal advice. Have it reviewed by a qualified professional before relying on it.</p>
        </div>
      </main>
    </div>
  );
}
