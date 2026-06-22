"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { signIn, signUp, signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";

/** Where to go after auth: a safe ?next= path, else /home. */
function destAfterAuth(): string {
  if (typeof window === "undefined") return "/home";
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") ? next : "/home";
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, authRequired } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authRequired) router.replace("/library");
    else if (!loading && user) router.replace(destAfterAuth());
  }, [authRequired, loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await signUp(email.trim(), password);
        if (error) throw error;
        if (data.session) router.replace(destAfterAuth());
        else setNotice("Account created. Check your email to confirm, then sign in.");
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
        router.replace(destAfterAuth());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(
        /not enabled|unsupported/i.test(error.message)
          ? "Google sign-in isn’t enabled yet. Turn it on in Supabase → Authentication → Providers."
          : error.message
      );
      setBusy(false);
    }
    // On success the browser redirects to Google.
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-6 py-10">
      {/* subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black, transparent 75%)",
        }}
      />

      <div className="w-full max-w-sm fade-up">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Welcome to Translume
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-dim)]">
            Sign in or create an account to record &amp; share.
          </p>
        </div>

        <div className="glass-strong mt-7 rounded-2xl p-6">
          {/* Segmented tabs */}
          <div className="flex rounded-xl border border-[var(--border)] bg-black/20 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  mode === m
                    ? "bg-[var(--panel-strong)] text-[var(--text)] shadow"
                    : "text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-[rgba(255,90,120,0.3)] bg-[rgba(255,90,120,0.1)] px-3 py-2 text-sm text-[#ff8aa0]">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-xl border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] px-3 py-2 text-sm text-[var(--success)]">
                {notice}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary py-3">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {/* OR divider */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs font-medium text-[var(--text-faint)]">OR</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="btn btn-ghost w-full py-3"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--text-faint)]">
          By continuing you agree to the{" "}
          <span className="underline">terms</span>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 36 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
