/**
 * Serialize / sanitize URL text from the inspect input before analyze.
 * Keeps structural analysis honest (no page crawl) while rejecting junk.
 */

const MAX_URL_LENGTH = 2048;

export type SerializeUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Normalize pasted text into a single analyzable URL string.
 * - strips whitespace / zero-width chars
 * - takes first line only (paste of multi-line)
 * - unwraps common `<url>` and `"url"` wrappers
 * - adds https:// when scheme is missing
 */
export function serializeUrlInput(raw: string): SerializeUrlResult {
  let text = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();

  if (!text) return { ok: false, reason: "Enter a URL to analyze" };

  // First non-empty line only — serialization of multi-line paste.
  text = text.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  if (!text) return { ok: false, reason: "Enter a URL to analyze" };

  if (
    (text.startsWith("<") && text.endsWith(">")) ||
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  // Collapse internal whitespace (copy from rich docs).
  text = text.replace(/\s+/g, "");

  if (text.length > MAX_URL_LENGTH) {
    return { ok: false, reason: `URL exceeds ${MAX_URL_LENGTH} characters` };
  }

  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(text)) {
    text = `https://${text}`;
  }

  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, reason: "Only http(s) URLs are supported" };
    }
    if (!parsed.hostname) {
      return { ok: false, reason: "URL is missing a hostname" };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, reason: "Could not parse that URL" };
  }
}
