"use client";

import { useEffect } from "react";
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

  // Route protection: in cloud mode, require a signed-in user.
  useEffect(() => {
    if (authRequired && !loading && !user) router.replace("/login");
  }, [authRequired, loading, user, router]);

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

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 border-r border-[var(--border)] px-4 py-5 glass">
        <div className="px-2 pb-4">
          <Logo />
        </div>

        <Link href="/record" className="btn btn-primary w-full mb-4">
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
                    ? "bg-[var(--panel-strong)] text-[var(--text)] border border-[var(--border-strong)]"
                    : "text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--panel)] border border-transparent"
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
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between border-b border-[var(--border)] px-4 py-3 glass sticky top-0 z-30">
          <Logo />
          <Link href="/record" className="btn btn-primary">
            <IconRecord width={16} height={16} />
            Record
          </Link>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
