import { describe, expect, it } from "vitest";
import { serializeUrlInput } from "@/lib/url-input";
import { CSV_URL_SAMPLES } from "@/lib/fixtures/csv-urls";

describe("serializeUrlInput", () => {
  it("rejects empty input", () => {
    expect(serializeUrlInput("   ")).toEqual({
      ok: false,
      reason: "Enter a URL to analyze",
    });
  });

  it("adds https when scheme is missing", () => {
    expect(serializeUrlInput("example.com/path")).toEqual({
      ok: true,
      url: "https://example.com/path",
    });
  });

  it("unwraps angle brackets and quotes", () => {
    expect(serializeUrlInput("<https://example.com>").ok).toBe(true);
    expect(serializeUrlInput('"http://example.com"').ok).toBe(true);
  });

  it("takes the first line of a multi-line paste", () => {
    const result = serializeUrlInput("https://a.example\nhttps://b.example");
    expect(result).toEqual({ ok: true, url: "https://a.example/" });
  });

  it("rejects non-http schemes", () => {
    expect(serializeUrlInput("ftp://files.example")).toEqual({
      ok: false,
      reason: "Only http(s) URLs are supported",
    });
  });

  it("serializes every CSV fixture sample", () => {
    for (const sample of CSV_URL_SAMPLES) {
      const result = serializeUrlInput(sample.url);
      expect(result.ok, sample.url).toBe(true);
      if (result.ok) {
        expect(result.url).toMatch(/^https?:\/\//);
      }
    }
  });
});
