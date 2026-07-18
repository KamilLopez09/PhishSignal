import { describe, expect, it } from "vitest";
import {
  CSV_LEGITIMATE_SAMPLES,
  CSV_PHISHING_SAMPLES,
  CSV_URL_SAMPLES,
  inspectSampleLinks,
  sampleChipLabel,
} from "@/lib/fixtures/csv-urls";

describe("csv-urls fixtures", () => {
  it("loads balanced legitimate and phishing samples", () => {
    expect(CSV_URL_SAMPLES.length).toBeGreaterThanOrEqual(8);
    expect(CSV_LEGITIMATE_SAMPLES.length).toBeGreaterThanOrEqual(4);
    expect(CSV_PHISHING_SAMPLES.length).toBeGreaterThanOrEqual(4);
  });

  it("keeps expected labels aligned with status", () => {
    for (const sample of CSV_URL_SAMPLES) {
      expect(sample.expected).toBe(sample.label);
      expect(sample.url).toMatch(/^https?:\/\//);
    }
  });

  it("exposes four inspect chips with distinct hosts", () => {
    const chips = inspectSampleLinks();
    expect(chips).toHaveLength(4);
    const hosts = chips.map((c) => sampleChipLabel(c.url));
    expect(new Set(hosts).size).toBe(4);
  });
});
