import type { AnalyzeResponse } from "@/lib/types";
import { serializeUrlInput } from "@/lib/url-input";

const ANALYZE_TIMEOUT_MS = 60_000;

/** Hosted FastAPI. Override with NEXT_PUBLIC_API_BASE_URL; use `mock` for offline. */
export const DEFAULT_API_BASE = "https://phishsignal.onrender.com";

export function getApiBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw === "mock") return null;
  if (!raw) return DEFAULT_API_BASE;
  return raw.replace(/\/$/, "");
}

export function isLiveApiConfigured(): boolean {
  return getApiBaseUrl() != null;
}

async function fetchJson(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** `GET /analyze?url=` — FastAPI contract. */
export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  const serialized = serializeUrlInput(url);
  if (!serialized.ok) {
    throw new Error(serialized.reason);
  }

  const endpoint = `${base}/analyze?url=${encodeURIComponent(serialized.url)}`;
  const res = await fetchJson(endpoint, ANALYZE_TIMEOUT_MS);

  if (res.status === 429) {
    throw new Error("Rate limited by API — try again shortly");
  }
  if (!res.ok) {
    throw new Error(`Analyze failed (${res.status})`);
  }

  const data = (await res.json()) as Partial<AnalyzeResponse>;
  if (
    typeof data.url !== "string" ||
    typeof data.score !== "number" ||
    !Array.isArray(data.signals)
  ) {
    throw new Error("Analyze response missing url, score, or signals");
  }

  return {
    url: data.url,
    score: data.score,
    signals: data.signals.map(String),
  };
}
