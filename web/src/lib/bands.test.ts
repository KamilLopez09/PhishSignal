import { describe, expect, it } from "vitest";
import { bandFromScore, toScanResult } from "@/lib/bands";

describe("bandFromScore", () => {
  it.each([
    [0, "SAFE"],
    [19, "SAFE"],
    [20, "CLEAR"],
    [39, "CLEAR"],
    [40, "UNCERTAIN"],
    [59, "UNCERTAIN"],
    [60, "SUSPICIOUS"],
    [79, "SUSPICIOUS"],
    [80, "PHISHING"],
    [100, "PHISHING"],
  ] as const)("maps score %i → %s", (score, band) => {
    expect(bandFromScore(score)).toBe(band);
  });

  it("clamps out-of-range scores", () => {
    expect(bandFromScore(-5)).toBe("SAFE");
    expect(bandFromScore(150)).toBe("PHISHING");
  });

  it("rounds fractional scores before banding", () => {
    expect(bandFromScore(19.4)).toBe("SAFE");
    expect(bandFromScore(19.6)).toBe("CLEAR");
  });
});

describe("toScanResult", () => {
  it("attaches band to analyze payload", () => {
    expect(toScanResult("https://example.com", 48, ["signal-a"])).toEqual({
      url: "https://example.com",
      score: 48,
      signals: ["signal-a"],
      band: "UNCERTAIN",
    });
  });
});
