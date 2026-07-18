/** Score → band label (frontend-owned; API returns score only). */
import type { ScoreBand } from "@/lib/types";

export function bandFromScore(score: number): ScoreBand {
  const s = Math.min(100, Math.max(0, Math.round(score)));
  if (s <= 19) return "SAFE";
  if (s <= 39) return "CLEAR";
  if (s <= 59) return "UNCERTAIN";
  if (s <= 79) return "SUSPICIOUS";
  return "PHISHING";
}

export function toScanResult(url: string, score: number, signals: string[]) {
  return { url, score, signals, band: bandFromScore(score) };
}
