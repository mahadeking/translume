"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconMenu, IconClose, IconRecord } from "./icons";

const linkCls =
  "rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-dim)] transition hover:bg-[var(--panel)] hover:text-[var(--text)]";

export function LandingMobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Lock body scroll while the menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-lg p-1.5 text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)] md:hidden"
      >
        <IconMenu width={22} height={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <aside className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 border-l border-[var(--border-strong)] bg-[var(--bg-soft)] px-4 py-5">
            <div className="flex items-center justify-between px-2 pb-3">
              <span className="text-sm font-semibold text-[var(--text-faint)]">Menu</span>
              <button
                onClick={close}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
              >
                <IconClose width={20} height={20} />
              </button>
            </div>

            <Link href="/record" onClick={close} className={linkCls}>Apps</Link>
            <Link href="/#features" onClick={close} className={linkCls}>Solutions</Link>

            <div className="mt-2 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
              Resources
            </div>
            <Link href="/#features" onClick={close} className={linkCls}>Features</Link>
            <Link href="/#demo" onClick={close} className={linkCls}>Demo</Link>
            <a
              href="https://github.com/mahadeking/translume"
              target="_blank"
              rel="noreferrer"
              onClick={close}
              className={linkCls}
            >
              GitHub
            </a>

            <div className="my-3 border-t border-[var(--border)]" />

            <Link href="/login?mode=signup" onClick={close} className={linkCls}>
              Start for free
            </Link>
            <Link href="/record" onClick={close} className="btn btn-primary mt-1 w-full">
              <IconRecord width={18} height={18} />
              Start recording
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
