// Tracks recently-viewed recording ids in localStorage (client-only).

const KEY = "translume_recent";
const MAX = 30;

export function pushRecent(id: string): void {
  if (typeof window === "undefined") return;
  const list = getRecent().filter((x) => x !== id);
  list.unshift(id);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
