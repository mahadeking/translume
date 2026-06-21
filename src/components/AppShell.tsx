"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/useAuth";
import { signOut } from "@/lib/auth";
import {
  IconHome,
  IconLibrary,
  IconClock,
  IconBookmark,
  IconChart,
  IconRecord,
  IconSettings,
  IconLogout,
  IconMenu,
  IconClose,
} from "./icons";

const nav = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/library", label: "Library", icon: IconLibrary },
  { href: "/recent", label: "Recent", icon: IconClock },
  { href: "/watch-later", label: "Watch later", icon: IconBookmark },
  { href: "/insights", label: "Insights", icon: IconChart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, authRequired } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (authRequired && !loading && !user) router.replace("/login");
  }, [authRequired, loading, user, router]);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (authRequired && loading) {
    return (
      <div className="grid min-h-screen place-items-center text-[var(--text-dim)]">
        Loading…
      </div>
    );
  }
  if (authRequired && !user) {
    return <div className="min-h-screen" />; // redirecting
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase() || "ME";

  // Shared sidebar body (record button + nav + account), used by desktop
  // sidebar and the mobile slide-over.
  const sidebarBody = (
    <>
      <Link href="/record" className="btn btn-primary mb-4 w-full">
        <IconRecord width={18} height={18} />
        New recording
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "border border-[var(--border-strong)] bg-[var(--panel-strong)] text-[var(--text)]"
                  : "border border-transparent text-[var(--text-dim)] hover:bg-[var(--panel)] hover:text-[var(--text)]"
              }`}
            >
              <Icon width={18} height={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        {authRequired ? (
          <div className="card p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full brand-gradient text-xs font-bold text-white">
                {initials}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-[var(--text-dim)]">
                {email}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-1">
              <Link
                href="/settings"
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                  pathname === "/settings"
                    ? "bg-[var(--panel-strong)] text-[var(--text)]"
                    : "text-[var(--text-dim)] hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
                }`}
              >
                <IconSettings width={14} height={14} />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--text-dim)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--danger)]"
              >
                <IconLogout width={14} height={14} />
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-3.5 text-xs leading-relaxed text-[var(--text-dim)]">
            <div className="mb-1 font-semibold text-[var(--text)]">Local workspace</div>
            Recordings are stored privately in this browser. Add Supabase keys to
            sync &amp; share across devices.
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-[var(--border)] px-4 py-5 glass md:flex">
        <div className="px-2 pb-4">
          <Logo />
        </div>
        {sidebarBody}
      </aside>

      {/* Mobile slide-over menu */}
      {navOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-1 border-r border-[var(--border-strong)] bg-[var(--bg-soft)] px-4 py-5">
            <div className="flex items-center justify-between px-2 pb-4">
              <Logo />
              <button
                onClick={() => setNavOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-[var(--text-dim)] hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
              >
                <IconClose width={20} height={20} />
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--border)] px-4 py-3 glass md:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-1.5 text-[var(--text-dim)] hover:bg-[var(--panel-strong)] hover:text-[var(--text)]"
            >
              <IconMenu width={22} height={22} />
            </button>
            <Logo />
          </div>
          <Link href="/record" className="btn btn-primary">
            <IconRecord width={16} height={16} />
            Record
          </Link>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
