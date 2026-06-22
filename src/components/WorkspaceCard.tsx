"use client";

import { useEffect, useState } from "react";
import { isCloud } from "@/lib/store";
import {
  ensureMyWorkspace,
  listMembers,
  createInvite,
  type Workspace,
  type Member,
} from "@/lib/workspace";
import { IconUsers, IconLink, IconCheck } from "./icons";

export function WorkspaceCard() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isCloud()) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const w = await ensureMyWorkspace();
        setWs(w);
        if (w) setMembers(await listMembers(w.id));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Couldn't load workspace.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function invite() {
    if (!ws) return;
    setCreating(true);
    setErr(null);
    try {
      const token = await createInvite(ws.id);
      setInviteLink(`${window.location.origin}/join/${token}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't create an invite.");
    } finally {
      setCreating(false);
    }
  }

  function copy() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (!isCloud()) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold">Workspace</h2>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Team workspaces are available in cloud mode.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold">Workspace</h2>

      {loading ? (
        <p className="mt-3 text-sm text-[var(--text-dim)]">Loading…</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--panel-strong)] text-sm font-bold uppercase text-[var(--brand)]">
              {ws?.name?.slice(0, 1) ?? "W"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{ws?.name}</div>
              <div className="text-xs text-[var(--text-faint)]">
                {members.length} member{members.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {members.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full brand-gradient text-xs font-bold text-white">
                    {m.email.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{m.email}</span>
                  <span className="chip capitalize">{m.role}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            {inviteLink ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={inviteLink}
                  onFocus={(e) => e.target.select()}
                  className="input"
                />
                <button onClick={copy} className="btn btn-primary shrink-0">
                  {copied ? (
                    <>
                      <IconCheck width={16} height={16} /> Copied
                    </>
                  ) : (
                    <>
                      <IconLink width={16} height={16} /> Copy link
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button onClick={invite} disabled={creating} className="btn btn-primary">
                <IconUsers width={16} height={16} />
                {creating ? "Creating…" : "Invite teammate"}
              </button>
            )}
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              Anyone with the link can join this workspace. Links expire in 30 days.
            </p>
          </div>

          {err && <p className="mt-2 text-xs text-[var(--danger)]">{err}</p>}
        </>
      )}
    </div>
  );
}
