import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadHistory, prependHistory } from "@/lib/history-store";
import type { ScanResult } from "@/lib/types";

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

const sample: ScanResult = {
  url: "https://www.poolcenter.com/",
  score: 22,
  signals: ["Uses HTTPS"],
  band: "CLEAR",
};

describe("history-store", () => {
  beforeEach(() => {
    memory.clear();
  });

  it("starts empty", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("prepends analyzes and dedupes by URL", () => {
    prependHistory(sample);
    prependHistory({ ...sample, score: 30 });
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.score).toBe(30);
    expect(history[0]?.relativeTime).toBe("JUST NOW");
  });
});
