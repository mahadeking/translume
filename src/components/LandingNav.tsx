"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = { label: string; href: string; external?: boolean };

const MENUS: { label: string; items: Item[] }[] = [
  {
    label: "Apps",
    items: [
      { label: "Screen & cam recorder", href: "/record" },
      { label: "Video library", href: "/library" },
      { label: "Team library", href: "/team" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "Async standups", href: "/record" },
      { label: "Product demos", href: "/record" },
      { label: "Customer support", href: "/record" },
      { label: "Onboarding & training", href: "/record" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Features", href: "/#features" },
      { label: "Demo", href: "/#demo" },
      { label: "GitHub", href: "https://github.com/mahadeking/translume", external: true },
    ],
  },
];

export function LandingNav() {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <nav ref={ref} className="hidden items-center gap-1 text-sm font-medium md:flex">
      {MENUS.map((m) => (
        <div key={m.label} className="relative">
          <button
            onClick={() => setOpen(open === m.label ? null : m.label)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:text-[var(--text)]"
          >
            {m.label}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition ${open === m.label ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {open === m.label && (
            <div className="absolute left-0 top-full mt-1 w-56 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-soft)] p-1 shadow-2xl">
              {m.items.map((it) =>
                it.external ? (
                  <a
                    key={it.label}
                    href={it.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setOpen(null)}
                    className="block rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
                  >
                    {it.label}
                  </a>
                ) : (
                  <Link
                    key={it.label}
                    href={it.href}
                    onClick={() => setOpen(null)}
                    className="block rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
                  >
                    {it.label}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
