"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/useAuth";
import { isCloud } from "@/lib/store";
import { getInviteInfo, acceptInvite, type InviteInfo } from "@/lib/workspace";

type State = "loading" | "ready" | "joining" | "error" | "done";

export function Join({ token }: { token: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isCloud()) {
      setState("error");
      setMsg("Team workspaces require cloud mode.");
      return;
    }
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
      return;
    }
    (async () => {
      try {
        const i = await getInviteInfo(token);
        if (!i || !i.valid) {
          setState("error");
          setMsg("This invite is invalid or has expired.");
          return;
        }
        setInfo(i);
        setState("ready");
      } catch (e) {
        setState("error");
        setMsg(e instanceof Error ? e.message : "Couldn't load this invite.");
      }
    })();
  }, [loading, user, token, router]);

  async function join() {
    setState("joining");
    try {
      await acceptInvite(token);
      setState("done");
      setTimeout(() => router.replace("/team"), 900);
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "Couldn't join this workspace.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="card fade-up w-full max-w-sm p-8 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>

        {state === "loading" && (
          <p className="mt-6 text-sm text-[var(--text-dim)]">Loading invite…</p>
        )}

        {state === "error" && (
          <>
            <h1 className="mt-6 text-xl font-semibold">Invite unavailable</h1>
            <p className="mt-2 text-sm text-[var(--text-dim)]">{msg}</p>
            <Link href="/home" className="btn btn-ghost mt-6">
              Go home
            </Link>
          </>
        )}

        {(state === "ready" || state === "joining") && info && (
          <>
            <h1 className="mt-6 text-xl font-semibold">
              Join {info.workspace_name}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-dim)]">
              You&apos;ve been invited to collaborate in this workspace.
            </p>
            <button
              onClick={join}
              disabled={state === "joining"}
              className="btn btn-primary mt-6 w-full"
            >
              {state === "joining" ? "Joining…" : `Join ${info.workspace_name}`}
            </button>
          </>
        )}

        {state === "done" && (
          <>
            <h1 className="mt-6 text-xl font-semibold">You&apos;re in! 🎉</h1>
            <p className="mt-2 text-sm text-[var(--text-dim)]">
              Taking you to the team library…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
