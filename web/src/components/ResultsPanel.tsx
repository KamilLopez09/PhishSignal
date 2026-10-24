"use client";

/**
 * Confidence score from analyze JSON `score` (+ frontend band map).
 * @see https://chakra-ui.com/docs/charts/donut-chart#point-label
 */
import { ReportFeedback } from "@/components/ReportFeedback";
import { ScoreDonut } from "@/components/ScoreDonut";
import type { FeedbackInput, FeedbackVerdict } from "@/lib/feedback-store";
import type { AnalyzeStatus, ScanResult } from "@/lib/types";

type ResultsPanelProps = {
  result: ScanResult;
  status: AnalyzeStatus;
  error: string | null;
  hasLiveResult: boolean;
  verdict?: FeedbackVerdict;
  onFeedback: (entry: FeedbackInput) => void;
};

export function ResultsPanel({
  result,
  status,
  error,
  hasLiveResult,
  verdict,
  onFeedback,
}: ResultsPanelProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-border/70 bg-[#1f1012]/90 px-3 py-4">
      <p className="text-sm font-medium text-ps-white/70">Confidence score</p>
      <ScoreDonut score={result.score} size={148} />
      <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-ps-white">
        {status === "loading" ? "Analyzing…" : result.band}
      </p>
      <p className="text-xs text-ps-white/45">
        {hasLiveResult
          ? `API score: ${result.score}/100`
          : "Run ANALYZE to load live JSON"}
      </p>
      {error ? (
        <p className="max-w-[16rem] text-center text-xs text-[#ffb4b4]">
          {error}
        </p>
      ) : (
        <p className="max-w-[16rem] text-center text-xs leading-relaxed text-ps-white/45">
          Risk indicator from URL structure &amp; domain age — not a content
          scan.
        </p>
      )}
      {hasLiveResult && status !== "loading" ? (
        <ReportFeedback
          url={result.url}
          score={result.score}
          band={result.band}
          verdict={verdict}
          onFeedback={onFeedback}
          showCopy
        />
      ) : null}
    </div>
  );
}
