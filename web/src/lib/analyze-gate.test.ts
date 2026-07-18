import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyzeGate, formatGateError } from "@/lib/analyze-gate";

describe("AnalyzeGate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs a single exclusive task", async () => {
    const gate = new AnalyzeGate();
    const result = await gate.runExclusive(async () => 42);
    expect(result).toEqual({ ok: true, value: 42, remaining: 4 });
  });

  it("rejects while a task is in flight", async () => {
    const gate = new AnalyzeGate();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });

    const first = gate.runExclusive(() => pending.then(() => "ok"));
    const second = await gate.runExclusive(async () => "nope");
    expect(second).toEqual({ ok: false, reject: { kind: "busy" } });

    release();
    await first;
  });

  it("throttles rapid successive starts", async () => {
    const gate = new AnalyzeGate();
    await gate.runExclusive(async () => 1);
    const blocked = await gate.runExclusive(async () => 2);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reject.kind).toBe("throttle");
    }
  });
});

describe("formatGateError", () => {
  it("formats reject kinds", () => {
    expect(formatGateError({ kind: "busy" })).toMatch(/already running/i);
    expect(
      formatGateError({ kind: "throttle", retryAfterMs: 1500 }),
    ).toMatch(/1\.5s/);
    expect(
      formatGateError({ kind: "rate_limit", retryAfterMs: 3000, remaining: 0 }),
    ).toMatch(/Rate limited/);
  });
});
