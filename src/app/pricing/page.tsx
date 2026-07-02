"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { PLANS, type PlanId } from "@/lib/plans";
import { IconCheck } from "@/components/icons";

export default function PricingPage() {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);

  function choose(id: PlanId) {
    if (id === "free") {
      router.push("/login?mode=signup");
      return;
    }
    // Phase 2 wires this to Stripe Checkout. Until billing is switched on,
    // send people in on the free plan and let them know upgrades are coming.
    setNotice(
      "Paid plans launch soon — create your free account now and you'll be able to upgrade from Settings."
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Logo />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/home" className="btn btn-primary btn-sm">
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <h1 className="fade-up text-4xl font-semibold tracking-tight sm:text-5xl">
          Simple, honest pricing
        </h1>
        <p className="fade-up mx-auto mt-4 max-w-xl text-lg text-[var(--text-dim)]">
          Start free. Upgrade when you need more recordings, longer videos, and
          team collaboration.
        </p>

        {notice && (
          <p className="fade-up mx-auto mt-6 max-w-md rounded-xl border border-[var(--border-strong)] bg-[var(--panel)] px-4 py-2.5 text-sm text-[var(--text-dim)]">
            {notice}
          </p>
        )}

        <div className="mt-12 grid gap-5 text-left md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`card relative flex flex-col p-6 ${
                p.highlighted ? "border-[var(--brand)] ring-1 ring-[var(--brand)]" : ""
              }`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full brand-gradient px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-sm text-[var(--text-faint)]">{p.tagline}</div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">${p.price}</span>
                <span className="mb-1 text-sm text-[var(--text-dim)]">
                  {p.price === 0 ? "forever" : "/ month"}
                </span>
              </div>

              <button
                onClick={() => choose(p.id)}
                className={`mt-5 w-full ${p.highlighted ? "btn btn-primary" : "btn btn-ghost"} py-2.5`}
              >
                {p.cta}
              </button>

              <ul className="mt-6 flex flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <IconCheck
                      width={17}
                      height={17}
                      className="mt-0.5 shrink-0 text-[var(--success)]"
                    />
                    <span className="text-[var(--text-dim)]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--text-faint)]">
          Prices in USD. Cancel anytime. Questions?{" "}
          <a href="mailto:transparencystrategies@gmail.com" className="underline">
            Contact us
          </a>
          .
        </p>
      </section>
    </div>
  );
}
