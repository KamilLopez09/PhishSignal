/**
 * Browser localStorage history for past analyzes.
 * @see docs/FRONTEND.md
 */
import type { RecentScan, ScanResult } from "@/lib/types";

const STORAGE_KEY = "phishsignal.history.v1";
const MAX_ITEMS = 40;

export type StoredScan = RecentScan & {
  band: string;
  signals: string[];
  analyzedAt: string; // ISO
};

function relativeFromIso(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "JUST NOW";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} MINUTE${mins === 1 ? "" : "S"} AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} HOUR${hours === 1 ? "" : "S"} AGO`;
  const days = Math.floor(hours / 24);
  return `${days} DAY${days === 1 ? "" : "S"} AGO`;
}

export function loadHistory(): StoredScan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredScan[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      relativeTime: relativeFromIso(item.analyzedAt),
    }));
  } catch {
    return [];
  }
}

export function prependHistory(result: ScanResult): StoredScan[] {
  const entry: StoredScan = {
    url: result.url,
    score: result.score,
    band: result.band,
    signals: result.signals,
    analyzedAt: new Date().toISOString(),
    relativeTime: "JUST NOW",
  };
  const next = [
    entry,
    ...loadHistory().filter((h) => h.url !== entry.url),
  ].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota / private mode — ignore persist failure.
  }
  return next;
}

export function toRecentScans(items: StoredScan[]): RecentScan[] {
  return items.map(({ url, score, relativeTime }) => ({
    url,
    score,
    relativeTime,
  }));
}
