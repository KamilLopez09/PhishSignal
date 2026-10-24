export type FeedbackVerdict = "correct" | "misclassified";

export const MAX_NOTE_WORDS = 25;

export type FeedbackInput = {
  url: string;
  score: number;
  band: string;
  verdict: FeedbackVerdict;
  /** Plain string, at most 25 words. */
  note: string;
};

export type StoredFeedback = FeedbackInput & {
  reportedAt: string; // ISO
};

const STORAGE_KEY = "phishsignal.feedback.v1";
const MAX_ITEMS = 40;

export function clipNote(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.split(" ").slice(0, MAX_NOTE_WORDS).join(" ");
}

export function noteWordCount(raw: string): number {
  const text = clipNote(raw);
  return text ? text.split(" ").length : 0;
}

export function loadFeedback(): StoredFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredFeedback[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item) =>
          typeof item?.url === "string" &&
          (item.verdict === "correct" || item.verdict === "misclassified"),
      )
      .map((item) => ({ ...item, note: clipNote(item.note) }));
  } catch {
    return [];
  }
}

export function saveFeedback(entry: FeedbackInput): StoredFeedback[] {
  const nextEntry: StoredFeedback = {
    ...entry,
    note: clipNote(entry.note),
    reportedAt: new Date().toISOString(),
  };
  const next = [
    nextEntry,
    ...loadFeedback().filter((item) => item.url !== entry.url),
  ].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota / private mode — ignore persist failure.
  }
  return next;
}

export function feedbackByUrl(
  items: StoredFeedback[],
): Record<string, FeedbackVerdict> {
  return Object.fromEntries(items.map((item) => [item.url, item.verdict]));
}
