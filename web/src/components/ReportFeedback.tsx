"use client";

import type { FeedbackInput, FeedbackVerdict } from "@/lib/feedback-store";

type ReportFeedbackProps = {
  url: string;
  score: number;
  band: string;
  verdict?: FeedbackVerdict;
  onFeedback: (entry: FeedbackInput) => void;
  showCopy?: boolean;
};

const THANKS: Record<FeedbackVerdict, string> = {
  correct: "Thanks — marked as looking right.",
  misclassified: "Thanks — we will use this report.",
};

export function ReportFeedback({
  url,
  score,
  band,
  verdict,
  onFeedback,
  showCopy = false,
}: ReportFeedbackProps) {
  function tap(next: FeedbackVerdict) {
    if (verdict) return;
    onFeedback({ url, score, band, verdict: next });
  }

  return (
    <div className="flex w-full max-w-[18rem] flex-col items-center gap-2">
      {showCopy ? (
        <p className="text-center text-[11px] leading-relaxed text-ps-white/45">
          If PhishSignal misclassifies a URL, report it so we can investigate
          and improve. Phishing tactics keep changing, so we keep testing the
          model and learning from its mistakes.
        </p>
      ) : null}
      {verdict ? (
        <p className="text-center text-[11px] text-ps-mint">{THANKS[verdict]}</p>
      ) : (
        <>
          <p className="text-[11px] text-ps-white/55">
            Was this classification right?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => tap("correct")}
              className="rounded-full border border-border bg-[#1f1012] px-3 py-1 text-[11px] font-medium text-ps-white transition-colors hover:bg-[#3a1c22]"
            >
              Looks right
            </button>
            <button
              type="button"
              onClick={() => tap("misclassified")}
              className="rounded-full border border-ps-mint/50 bg-[#1f1012] px-3 py-1 text-[11px] font-medium text-ps-white transition-colors hover:bg-[#3a1c22]"
            >
              Report issue
            </button>
          </div>
        </>
      )}
    </div>
  );
}
