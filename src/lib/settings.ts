"use client";

// Local, per-browser preferences for the Personal Settings page. These are
// lightweight UI prefs (notifications, quick-record defaults, integrations) and
// live in localStorage so they work without extra backend tables. Display name
// lives in Supabase auth (user_metadata) — see auth.ts.

export interface NotificationPrefs {
  comments: boolean; // someone comments on my video
  views: boolean; // someone watches my video
  weekly: boolean; // weekly activity summary
  product: boolean; // product news & tips
}

export interface QuickRecordPrefs {
  mode: "screen" | "camera" | "both";
  mic: boolean;
  countdown: boolean;
}

export interface IntegrationPrefs {
  slackEnabled: boolean;
  slackWebhook: string;
  emailEnabled: boolean;
  embedEnabled: boolean;
}

const KEYS = {
  notifications: "translume_prefs_notifications",
  quickRecord: "translume_prefs_quickrecord",
  integrations: "translume_prefs_integrations",
} as const;

const DEFAULTS = {
  notifications: { comments: true, views: true, weekly: false, product: true } as NotificationPrefs,
  quickRecord: { mode: "both", mic: true, countdown: true } as QuickRecordPrefs,
  integrations: {
    slackEnabled: false,
    slackWebhook: "",
    emailEnabled: true,
    embedEnabled: true,
  } as IntegrationPrefs,
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const getNotificationPrefs = () => read(KEYS.notifications, DEFAULTS.notifications);
export const setNotificationPrefs = (v: NotificationPrefs) => write(KEYS.notifications, v);

export const getQuickRecordPrefs = () => read(KEYS.quickRecord, DEFAULTS.quickRecord);
export const setQuickRecordPrefs = (v: QuickRecordPrefs) => write(KEYS.quickRecord, v);

export const getIntegrationPrefs = () => read(KEYS.integrations, DEFAULTS.integrations);
export const setIntegrationPrefs = (v: IntegrationPrefs) => write(KEYS.integrations, v);
