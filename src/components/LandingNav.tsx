"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Item = { label: string; href: string; desc?: string; external?: boolean };

const APPS: Item[] = [
  { label: "Translume", href: "/record", desc: "Screen & camera recorder" },
  {
    label: "Cadence",
    href: "https://cadence-ovxh.vercel.app/",
    desc: "Scheduling & booking",
    external: true,
  },
];

const RESOURCES: Item[] = [
  { label: "Features", href: "/#features" },
  { label: "Demo", href: "/#demo" },
  { label: "GitHub", href: "https://github.com/mahadeking/translume", external: true },
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

  function Dropdown({ name, items, width }: { name: string; items: Item[]; width: string }) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(open === name ? null : name)}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:text-[var(--text)]"
        >
          {name}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition ${open === name ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open === name && (
          <div
            className={`absolute left-0 top-full mt-1 ${width} overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-soft)] p-1 shadow-2xl`}
          >
            {items.map((it) => {
              const inner = it.desc ? (
                <>
                  <div className="font-medium text-[var(--text)]">{it.label}</div>
                  <div className="text-xs text-[var(--text-faint)]">{it.desc}</div>
                </>
              ) : (
                it.label
              );
              const cls =
                "block rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)]";
              return it.external ? (
                <a
                  key={it.label}
                  href={it.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(null)}
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <Link key={it.label} href={it.href} onClick={() => setOpen(null)} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <nav ref={ref} className="hidden items-center gap-1 text-sm font-medium md:flex">
      <Dropdown name="Apps" items={APPS} width="w-60" />
      <Link
        href="/#features"
        className="rounded-lg px-3 py-2 text-[var(--text-dim)] transition hover:text-[var(--text)]"
      >
        Solutions
      </Link>
      <Dropdown name="Resources" items={RESOURCES} width="w-56" />
    </nav>
  );
}
