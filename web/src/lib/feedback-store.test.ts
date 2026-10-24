import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  feedbackByUrl,
  loadFeedback,
  saveFeedback,
  type FeedbackInput,
} from "@/lib/feedback-store";

const memory = new Map<string, string>();

vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
  clear: () => {
    memory.clear();
  },
});

const sample: FeedbackInput = {
  url: "https://www.poolcenter.com/",
  score: 22,
  band: "CLEAR",
  verdict: "correct",
};

describe("feedback-store", () => {
  beforeEach(() => {
    memory.clear();
  });

  it("starts empty", () => {
    expect(loadFeedback()).toEqual([]);
  });

  it("saves a verdict and dedupes by URL", () => {
    saveFeedback(sample);
    saveFeedback({ ...sample, verdict: "misclassified", score: 80 });
    const stored = loadFeedback();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.verdict).toBe("misclassified");
    expect(stored[0]?.score).toBe(80);
    expect(stored[0]?.reportedAt).toEqual(expect.any(String));
  });

  it("maps latest verdicts by URL", () => {
    saveFeedback(sample);
    saveFeedback({
      url: "https://phish.example/",
      score: 91,
      band: "PHISHING",
      verdict: "misclassified",
    });
    expect(feedbackByUrl(loadFeedback())).toEqual({
      "https://phish.example/": "misclassified",
      "https://www.poolcenter.com/": "correct",
    });
  });
});
