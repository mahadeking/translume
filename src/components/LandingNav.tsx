"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = { label: string; href: string; external?: boolean };

// Plain links (no dropdown)
const LINKS: Item[] = [
  { label: "Apps", href: "/record" },
  { label: "Solutions", href: "/#features" },
];

// The one dropdown menu
const RESOURCES: Item[] = [
  { label: "Features", href: "/#features" },
  { label: "Demo", href: "/#demo" },
  { label: "GitHub", href: "https://github.com/mahadeking/translume", external: true },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className="rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:text-[var(--text)]"
        >
          {l.label}
        </Link>
      ))}

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:text-[var(--text)]"
        >
          Resources
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition ${open ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1 w-56 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-soft)] p-1 shadow-2xl">
            {RESOURCES.map((it) =>
              it.external ? (
                <a
                  key={it.label}
                  href={it.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
                >
                  {it.label}
                </a>
              ) : (
                <Link
                  key={it.label}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
                >
                  {it.label}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
