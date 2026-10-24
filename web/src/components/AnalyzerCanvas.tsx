"use client";

/**
 * Detector canvas: input → ANALYZE → Confidence (JSON score) beside it.
 * @see https://godui.design/docs/components/layout/container-scroll
 */
import { DashboardScrollCard } from "@/components/DashboardScrollCard";
import { InspectLink } from "@/components/InspectLink";
import { ResultsPanel } from "@/components/ResultsPanel";
import type { FeedbackInput, FeedbackVerdict } from "@/lib/feedback-store";
import type { AnalyzeStatus, ScanResult } from "@/lib/types";

type AnalyzerCanvasProps = {
  result: ScanResult;
  status: AnalyzeStatus;
  error: string | null;
  hasLiveResult: boolean;
  verdict?: FeedbackVerdict;
  onAnalyze: (rawInput: string) => void | Promise<void>;
  onFeedback: (entry: FeedbackInput) => void;
};

export function AnalyzerCanvas({
  result,
  status,
  error,
  hasLiveResult,
  verdict,
  onAnalyze,
  onFeedback,
}: AnalyzerCanvasProps) {
  return (
    <DashboardScrollCard
      size="card"
      className="h-[40rem] md:h-[44rem]"
      header={
        <div className="space-y-2">
          <h2 className="text-[1.35rem] font-semibold tracking-tight text-ps-ink md:text-[1.5rem]">
            Inspect a link
          </h2>
          <p className="text-sm text-ps-ink/70">
            Enter a URL, then hold{" "}
            <span className="font-semibold text-ps-mint">ANALYZE</span> to
            process it against the API.
          </p>
        </div>
      }
    >
      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[1.35fr_1fr]">
        <InspectLink status={status} onAnalyze={onAnalyze} />
        <ResultsPanel
          result={result}
          status={status}
          error={error}
          hasLiveResult={hasLiveResult}
          verdict={verdict}
          onFeedback={onFeedback}
        />
      </div>
    </DashboardScrollCard>
  );
}
