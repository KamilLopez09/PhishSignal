/**
 * Local fixtures used when `NEXT_PUBLIC_API_BASE_URL` is unset.
 * Shapes match FastAPI `{ url, score, signals }` + UI-only overview stats.
 */
import { toScanResult } from "@/lib/bands";
import type { AnalyzeResponse, ScanResult } from "@/lib/types";

export const INSPECT_PLACEHOLDER = "Enter URL";

/** Seed result shown before the user runs a live/mock analyze. */
export const INITIAL_RESULT: ScanResult = toScanResult(
  "https://example.com/login-verify-account-update",
  75,
  [
    "Lengthy URL (Exceeds 75 chars)",
    "Excessive Hyphens Present",
    "Uses HTTPS",
  ],
);

/**
 * Workspace counters — not returned by `/analyze`.
 * Keep as placeholders until an analytics endpoint exists.
 */
export const OVERVIEW_STATS = {
  totalScans: 1000,
  highRisk: 300,
  lowRisk: 700,
  recentWarnings: 50,
} as const;

/** Deterministic offline stand-in so the UI is exercisable without FastAPI. */
export function mockAnalyze(url: string): AnalyzeResponse {
  const normalized = url.trim();
  // Light heuristic so demos feel responsive; not the RandomForest model.
  const lengthPenalty = Math.min(40, Math.floor(normalized.length / 4));
  const hyphenPenalty = (normalized.match(/-/g) ?? []).length * 8;
  const httpsBonus = normalized.startsWith("https://") ? -10 : 15;
  const score = Math.min(
    100,
    Math.max(5, 35 + lengthPenalty + hyphenPenalty + httpsBonus),
  );

  const signals: string[] = [];
  if (normalized.length > 75) signals.push("Lengthy URL (Exceeds 75 chars)");
  if ((normalized.match(/-/g) ?? []).length >= 2) {
    signals.push("Excessive Hyphens Present");
  }
  if (normalized.startsWith("https://")) signals.push("Uses HTTPS");
  if (signals.length === 0) signals.push("No strong structural flags");

  return { url: normalized, score, signals };
}
