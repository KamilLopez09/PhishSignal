/** Sample URLs from `apidataset.csv` (legitimate | phishing) for Inspect test chips. */
import samples from "@/lib/fixtures/csv-urls.json";

export type CsvUrlSample = {
  url: string;
  label: "legitimate" | "phishing";
  expected: "legitimate" | "phishing";
};

export const CSV_URL_SAMPLES = samples as CsvUrlSample[];

export const CSV_LEGITIMATE_SAMPLES = CSV_URL_SAMPLES.filter(
  (s) => s.label === "legitimate",
);

export const CSV_PHISHING_SAMPLES = CSV_URL_SAMPLES.filter(
  (s) => s.label === "phishing",
);

/** Compact host label for UI chips. */
export function sampleChipLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host.length > 28 ? `${host.slice(0, 26)}…` : host;
  } catch {
    return url.slice(0, 28);
  }
}

/** Four quick picks for the Inspect panel (2 + 2). */
export function inspectSampleLinks(): CsvUrlSample[] {
  return [
    ...CSV_LEGITIMATE_SAMPLES.slice(0, 2),
    ...CSV_PHISHING_SAMPLES.slice(0, 2),
  ];
}
