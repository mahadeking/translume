"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { signOut, updateDisplayName } from "@/lib/auth";
import {
  listRecordings,
  deleteRecording,
  listFolders,
  deleteFolder,
} from "@/lib/store";
import {
  getNotificationPrefs,
  setNotificationPrefs,
  getQuickRecordPrefs,
  setQuickRecordPrefs,
  getIntegrationPrefs,
  setIntegrationPrefs,
  type NotificationPrefs,
  type QuickRecordPrefs,
  type IntegrationPrefs,
} from "@/lib/settings";
import {
  IconLogout,
  IconBell,
  IconCalendar,
  IconUsers,
  IconKeyboard,
  IconPuzzle,
  IconMail,
  IconLink,
  IconCheck,
  IconScreen,
  IconCamera,
  IconBoth,
  IconRecord,
  IconTrash,
} from "@/components/icons";

type Tab =
  | "account"
  | "meetings"
  | "notifications"
  | "integrations"
  | "quick"
  | "shortcuts";

const TABS: { key: Tab; label: string; icon: typeof IconBell }[] = [
  { key: "account", label: "My account", icon: IconUsers },
  { key: "meetings", label: "Meeting recordings", icon: IconCalendar },
  { key: "notifications", label: "Push notifications", icon: IconBell },
  { key: "integrations", label: "Integrations", icon: IconPuzzle },
  { key: "quick", label: "Quick record", icon: IconRecord },
  { key: "shortcuts", label: "Keyboard shortcuts", icon: IconKeyboard },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("account");

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const email = user?.email ?? "Local user";
  const initials = (email.slice(0, 2) || "ME").toUpperCase();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Personal Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-dim)]">
          Manage your account, notifications, and integrations.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-px">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-[var(--brand)] text-[var(--text)]"
                    : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
                }`}
              >
                <Icon width={16} height={16} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "account" && (
            <AccountTab
              email={email}
              initials={initials}
              hasUser={!!user}
              metaName={(user?.user_metadata?.full_name as string) ?? ""}
              onSignOut={handleSignOut}
            />
          )}
          {tab === "meetings" && <MeetingsTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "integrations" && <IntegrationsTab />}
          {tab === "quick" && <QuickRecordTab />}
          {tab === "shortcuts" && <ShortcutsTab />}
        </div>
      </div>
    </AppShell>
  );
}

/* ---------------- shared bits ---------------- */

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        on ? "bg-[var(--brand)]" : "bg-[var(--panel-strong)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          on ? "left-[1.375rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Row({
  icon,
  title,
  desc,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <span className="grid h-9 w-9 shrink-0 place-items-center">{icon}</span>}
        <div className="min-w-0">
          <div className="text-sm font-medium">{title}</div>
          {desc && <div className="text-xs text-[var(--text-dim)]">{desc}</div>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/* ---------------- My account ---------------- */

function AccountTab({
  email,
  initials,
  hasUser,
  metaName,
  onSignOut,
}: {
  email: string;
  initials: string;
  hasUser: boolean;
  metaName: string;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(metaName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    setName(metaName);
  }, [metaName]);

  const workspace = email.includes("@")
    ? email.split("@")[1].split(".")[0]
    : "My workspace";

  async function saveName() {
    if (!hasUser) return;
    setSavingName(true);
    setNameSaved(false);
    await updateDisplayName(name.trim());
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function sendInvite() {
    const link = `${window.location.origin}/login`;
    const subject = encodeURIComponent("Join me on Translume");
    const body = encodeURIComponent(
      `I'm using Translume for quick screen + camera video messages. Join here: ${link}`
    );
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
  }

  function copyInviteLink() {
    navigator.clipboard
      .writeText(`${window.location.origin}/login`)
      .then(() => {
        setInviteCopied(true);
        setTimeout(() => setInviteCopied(false), 1500);
      });
  }

  async function deleteAllData() {
    if (
      !confirm(
        "Delete ALL your recordings and folders? This permanently removes your library and cannot be undone."
      )
    )
      return;
    setWiping(true);
    try {
      for (const r of await listRecordings()) await deleteRecording(r.id);
      for (const f of await listFolders()) await deleteFolder(f.id);
      alert("Your recordings and folders were deleted.");
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Profile */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="mt-4 flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full brand-gradient text-lg font-bold text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
              Full name
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={!hasUser}
                className="input"
              />
              <button
                onClick={saveName}
                disabled={!hasUser || savingName || name.trim() === metaName}
                className="btn btn-primary shrink-0"
              >
                {nameSaved ? (
                  <>
                    <IconCheck width={16} height={16} /> Saved
                  </>
                ) : savingName ? (
                  "Saving…"
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <div className="text-xs font-medium text-[var(--text-dim)]">Email address</div>
          <div className="mt-1 text-sm">{email}</div>
        </div>
      </div>

      {/* Workspace / Invite */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold">Workspace</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--panel-strong)] text-sm font-bold uppercase text-[var(--brand)]">
            {workspace.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium capitalize">{workspace}</div>
            <div className="text-xs text-[var(--text-faint)]">1 member · that&apos;s you</div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="input"
          />
          <button
            onClick={sendInvite}
            disabled={!inviteEmail.includes("@")}
            className="btn btn-primary shrink-0"
          >
            <IconUsers width={16} height={16} />
            Invite teammate
          </button>
        </div>
        <button
          onClick={copyInviteLink}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)] transition hover:text-[var(--text)]"
        >
          {inviteCopied ? <IconCheck width={13} height={13} /> : <IconLink width={13} height={13} />}
          {inviteCopied ? "Invite link copied" : "Copy invite link instead"}
        </button>
      </div>

      {/* Account actions */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold">Account</h2>
        <button onClick={onSignOut} className="btn btn-ghost mt-4">
          <IconLogout width={18} height={18} />
          Sign out
        </button>
      </div>

      {/* Danger zone */}
      <div className="card border-[rgba(255,90,120,0.25)] p-5">
        <h2 className="text-sm font-semibold text-[var(--danger)]">Danger zone</h2>
        <p className="mt-2 text-sm text-[var(--text-dim)]">
          Permanently delete all of your recordings and folders. This can&apos;t be undone.
        </p>
        <button onClick={deleteAllData} disabled={wiping} className="btn btn-danger mt-4">
          <IconTrash width={16} height={16} />
          {wiping ? "Deleting…" : "Delete all my recordings"}
        </button>
        <p className="mt-3 text-xs text-[var(--text-faint)]">
          Full account (login) deletion is coming soon.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Meeting recordings ---------------- */

function CalMark({ kind }: { kind: "google" | "outlook" }) {
  if (kind === "google") {
    return (
      <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
        <path fill="#4285F4" d="M43.6 20.5H24v8h11.3C33.7 33.2 29.3 36 24 36a12 12 0 1 1 0-24c3 0 5.8 1.1 8 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5Z" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden>
      <rect x="6" y="12" width="24" height="24" rx="3" fill="#0A66C2" />
      <path fill="#fff" d="M12 20h12v8H12z" opacity=".9" />
      <path fill="#28A8EA" d="M30 18l12-4v20l-12-4z" />
    </svg>
  );
}

function MeetingsTab() {
  const cals = [
    { kind: "google" as const, name: "Google Calendar" },
    { kind: "outlook" as const, name: "Outlook Calendar" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold">Calendar</h2>
          <p className="mt-1 text-xs text-[var(--text-dim)]">
            Connect a calendar to bring your meetings into Translume.
          </p>
        </div>
        {cals.map((c, i) => (
          <div
            key={c.kind}
            className={i > 0 ? "border-t border-[var(--border)]" : ""}
          >
            <Row icon={<CalMark kind={c.kind} />} title={c.name}>
              <span className="chip">Coming soon</span>
            </Row>
          </div>
        ))}
      </div>
      <p className="px-1 text-xs text-[var(--text-faint)]">
        Calendar connect + automatic meeting recording is on the roadmap. The buttons
        are here so it&apos;s ready to switch on.
      </p>
    </div>
  );
}

/* ---------------- Push notifications ---------------- */

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  useEffect(() => setPrefs(getNotificationPrefs()), []);

  function update(patch: Partial<NotificationPrefs>) {
    setPrefs((p) => {
      const next = { ...(p as NotificationPrefs), ...patch };
      setNotificationPrefs(next);
      return next;
    });
  }
  if (!prefs) return null;

  const items: { key: keyof NotificationPrefs; title: string; desc: string }[] = [
    { key: "comments", title: "Comments", desc: "When someone comments on your video" },
    { key: "views", title: "New views", desc: "When someone watches your video" },
    { key: "weekly", title: "Weekly summary", desc: "A digest of your activity each week" },
    { key: "product", title: "Product updates", desc: "New features and tips" },
  ];

  return (
    <div className="card overflow-hidden">
      {items.map((it, i) => (
        <div key={it.key} className={i > 0 ? "border-t border-[var(--border)]" : ""}>
          <Row
            icon={<IconBell width={18} height={18} className="text-[var(--text-dim)]" />}
            title={it.title}
            desc={it.desc}
          >
            <Toggle on={prefs[it.key]} onChange={(v) => update({ [it.key]: v })} />
          </Row>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Integrations ---------------- */

function SlackMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#36C5F0" d="M18 10a4 4 0 1 0-4 4h4z" />
      <path fill="#2EB67D" d="M38 18a4 4 0 1 0-4-4v4z" />
      <path fill="#ECB22E" d="M30 38a4 4 0 1 0 4-4h-4z" />
      <path fill="#E01E5A" d="M10 30a4 4 0 1 0 4 4v-4z" />
      <path fill="#36C5F0" d="M14 24a4 4 0 0 1 0 8 4 4 0 0 1 0-8z" opacity=".0" />
    </svg>
  );
}

function IntegrationsTab() {
  const [prefs, setPrefs] = useState<IntegrationPrefs | null>(null);
  const [slackBusy, setSlackBusy] = useState(false);
  const [slackMsg, setSlackMsg] = useState<string | null>(null);

  useEffect(() => setPrefs(getIntegrationPrefs()), []);

  function update(patch: Partial<IntegrationPrefs>) {
    setPrefs((p) => {
      const next = { ...(p as IntegrationPrefs), ...patch };
      setIntegrationPrefs(next);
      return next;
    });
  }
  if (!prefs) return null;

  async function testSlack() {
    setSlackBusy(true);
    setSlackMsg(null);
    try {
      const r = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook: prefs!.slackWebhook,
          text: "✅ Translume is connected to this channel.",
        }),
      });
      const d = await r.json();
      setSlackMsg(r.ok ? "Sent! Check your Slack channel." : d.message ?? "Failed to send.");
    } catch {
      setSlackMsg("Couldn't reach the server.");
    } finally {
      setSlackBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Slack */}
      <div className="card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center">
              <SlackMark />
            </span>
            <div>
              <div className="text-sm font-medium">Slack</div>
              <div className="text-xs text-[var(--text-dim)]">
                Post share links to a channel
              </div>
            </div>
          </div>
          <Toggle on={prefs.slackEnabled} onChange={(v) => update({ slackEnabled: v })} />
        </div>

        {prefs.slackEnabled && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-dim)]">
              Incoming webhook URL
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={prefs.slackWebhook}
                onChange={(e) => update({ slackWebhook: e.target.value })}
                placeholder="https://hooks.slack.com/services/…"
                className="input"
              />
              <button
                onClick={testSlack}
                disabled={slackBusy || !prefs.slackWebhook}
                className="btn btn-ghost shrink-0"
              >
                {slackBusy ? "Sending…" : "Send test"}
              </button>
            </div>
            {slackMsg && (
              <p className="mt-2 text-xs text-[var(--text-dim)]">{slackMsg}</p>
            )}
            <p className="mt-2 text-xs text-[var(--text-faint)]">
              Create a webhook at api.slack.com → Incoming Webhooks, then paste it here.
            </p>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="card p-5">
        <Row
          icon={<IconMail width={18} height={18} className="text-[var(--text-dim)]" />}
          title="Email sharing"
          desc="Share any recording straight to email"
        >
          <Toggle on={prefs.emailEnabled} onChange={(v) => update({ emailEnabled: v })} />
        </Row>
      </div>

      {/* Embed */}
      <div className="card p-5">
        <Row
          icon={<IconLink width={18} height={18} className="text-[var(--text-dim)]" />}
          title="Embed code"
          desc="Drop recordings into any site or doc"
        >
          <Toggle on={prefs.embedEnabled} onChange={(v) => update({ embedEnabled: v })} />
        </Row>
      </div>
    </div>
  );
}

/* ---------------- Quick record ---------------- */

function QuickRecordTab() {
  const [prefs, setPrefs] = useState<QuickRecordPrefs | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => setPrefs(getQuickRecordPrefs()), []);

  function update(patch: Partial<QuickRecordPrefs>) {
    setPrefs((p) => {
      const next = { ...(p as QuickRecordPrefs), ...patch };
      setQuickRecordPrefs(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      return next;
    });
  }
  if (!prefs) return null;

  const modes = [
    { key: "screen" as const, label: "Screen", icon: IconScreen },
    { key: "camera" as const, label: "Camera", icon: IconCamera },
    { key: "both" as const, label: "Both", icon: IconBoth },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <h2 className="text-sm font-semibold">Default capture mode</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = prefs.mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => update({ mode: m.key })}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${
                  active
                    ? "border-[var(--brand)] bg-[var(--panel-strong)] text-[var(--text)]"
                    : "border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)]"
                }`}
              >
                <Icon width={22} height={22} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card overflow-hidden">
        <Row title="Microphone on by default" desc="Capture your voice when recording">
          <Toggle on={prefs.mic} onChange={(v) => update({ mic: v })} />
        </Row>
        <div className="border-t border-[var(--border)]" />
        <Row title="3-2-1 countdown" desc="Short countdown before recording starts">
          <Toggle on={prefs.countdown} onChange={(v) => update({ countdown: v })} />
        </Row>
      </div>

      <p className="px-1 text-xs text-[var(--text-faint)]">
        {saved ? "Saved ✓ — applied to your next recording." : "Defaults apply to your next recording."}
      </p>
    </div>
  );
}

/* ---------------- Keyboard shortcuts ---------------- */

function ShortcutsTab() {
  const shortcuts: { keys: string[]; desc: string }[] = [
    { keys: ["Space"], desc: "Play / pause the video" },
    { keys: ["→"], desc: "Skip forward 5 seconds" },
    { keys: ["←"], desc: "Skip back 5 seconds" },
    { keys: ["Ctrl", "Enter"], desc: "Send a comment" },
  ];
  return (
    <div className="card overflow-hidden">
      {shortcuts.map((s, i) => (
        <div
          key={s.desc}
          className={`flex items-center justify-between px-5 py-3.5 ${
            i > 0 ? "border-t border-[var(--border)]" : ""
          }`}
        >
          <span className="text-sm text-[var(--text-dim)]">{s.desc}</span>
          <span className="flex items-center gap-1">
            {s.keys.map((k) => (
              <kbd
                key={k}
                className="rounded-md border border-[var(--border-strong)] bg-[var(--panel-strong)] px-2 py-0.5 text-xs font-semibold"
              >
                {k}
              </kbd>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
