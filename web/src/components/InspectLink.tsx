"use client";

/**
 * URL entry — ANALYZE is the sole path that processes the input text
 * (serialize → rate-limit → API). Form Enter routes through the same handler.
 *
 * @see https://godui.design/docs/components/buttons/hold-confirm-button
 */
import { FormEvent, useState } from "react";
import { HoldConfirmButton } from "@/components/godui/hold-confirm-button";
import {
  inspectSampleLinks,
  sampleChipLabel,
  type CsvUrlSample,
} from "@/lib/fixtures/csv-urls";
import { INSPECT_PLACEHOLDER } from "@/lib/mock-dashboard";
import type { AnalyzeStatus } from "@/lib/types";

const SAMPLE_LINKS = inspectSampleLinks();

type InspectLinkProps = {
  status: AnalyzeStatus;
  /** Processes the current input string (Dashboard serializes + analyzes). */
  onAnalyze: (rawInput: string) => void | Promise<void>;
};

export function InspectLink({ status, onAnalyze }: InspectLinkProps) {
  const [url, setUrl] = useState("");
  const busy = status === "loading";
  const canSubmit = Boolean(url.trim()) && !busy;

  function processInput() {
    if (!canSubmit) return;
    void onAnalyze(url);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    processInput();
  }

  function selectSample(sample: CsvUrlSample) {
    if (busy) return;
    setUrl(sample.url);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-1 py-1">
      <form className="ps-browser" onSubmit={onSubmit}>
        <div className="tabs-head">
          <div className="tabs">
            <div className="tab-open">
              <div className="rounded-l">
                <div className="mask-round" />
              </div>
              <span>PhishSignal</span>
              <div className="close-tab">✕</div>
              <div className="rounded-r">
                <div className="mask-round" />
              </div>
            </div>
          </div>
          <div className="window-opt">
            <button type="button" tabIndex={-1} aria-hidden>
              -
            </button>
            <button type="button" tabIndex={-1} aria-hidden>
              □
            </button>
            <button
              type="button"
              className="window-close"
              tabIndex={-1}
              aria-hidden
            >
              ✕
            </button>
          </div>
        </div>

        <div className="head-browser">
          <button type="button" disabled aria-label="Back">
            ←
          </button>
          <button type="button" disabled aria-label="Forward">
            →
          </button>
          <input
            type="text"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={INSPECT_PLACEHOLDER}
            aria-label="URL to analyze"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
          <button
            type="submit"
            aria-label="Analyze entered URL"
            title="Analyze entered URL"
            disabled={!canSubmit}
          >
            ⋮
          </button>
          <button
            type="submit"
            className="star"
            aria-label="Analyze entered URL"
            title="Analyze entered URL"
            disabled={!canSubmit}
          >
            ✰
          </button>
        </div>
      </form>

      <HoldConfirmButton
        variant="default"
        size="md"
        duration={900}
        holdingLabel="Analyzing…"
        confirmedLabel="Done"
        disabled={!canSubmit}
        onConfirm={processInput}
        className="min-w-[10.5rem] tracking-[0.08em]"
      >
        ANALYZE
      </HoldConfirmButton>

      <div className="flex w-full max-w-md flex-col items-center gap-2 px-2">
        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/80">
          Test cases
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SAMPLE_LINKS.map((sample) => {
            const active = url === sample.url;
            return (
              <button
                key={sample.url}
                type="button"
                disabled={busy}
                onClick={() => selectSample(sample)}
                title={sample.url}
                className={[
                  "max-w-[11rem] truncate border px-2.5 py-1 text-left text-[0.72rem] text-white transition",
                  "border-white/30 bg-[#801929]/25",
                  "hover:border-[#c9a227]/70 hover:bg-[#801929]/40",
                  "disabled:opacity-50",
                  active ? "border-[#c9a227] bg-[#801929]/50" : "",
                ].join(" ")}
              >
                <span className="mr-1.5 text-[0.62rem] uppercase tracking-wide text-white/70">
                  {sample.label === "phishing" ? "phish" : "ok"}
                </span>
                {sampleChipLabel(sample.url)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
