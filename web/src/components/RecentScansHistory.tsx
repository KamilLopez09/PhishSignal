"use client";

import { ProductCard } from "@/components/ProductCard";
import { ReportFeedback } from "@/components/ReportFeedback";
import type { FeedbackInput, FeedbackVerdict } from "@/lib/feedback-store";
import type { StoredScan } from "@/lib/history-store";

const VISIBLE = 5;

type RecentScansHistoryProps = {
  scans: StoredScan[];
  verdicts: Record<string, FeedbackVerdict>;
  onFeedback: (entry: FeedbackInput) => void;
};

export function RecentScansHistory({
  scans,
  verdicts,
  onFeedback,
}: RecentScansHistoryProps) {
  const rows = scans.slice(0, VISIBLE);

  return (
    <ProductCard title="Recent Scans History">
      {rows.length === 0 ? (
        <p className="text-sm text-ps-white/55">No scans yet.</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-3">
          {rows.map((scan) => (
            <li key={scan.url} className="rounded-xl bg-[#1f1012] px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="max-w-[220px] truncate text-sm text-ps-white">
                  {scan.url}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ps-white/70">
                  {scan.band} · {scan.score}
                </span>
                <span className="text-[11px] font-medium tracking-wide text-ps-white/45">
                  {scan.relativeTime}
                </span>
              </div>
              <div className="mt-2">
                <ReportFeedback
                  url={scan.url}
                  score={scan.score}
                  band={scan.band}
                  verdict={verdicts[scan.url]}
                  onFeedback={onFeedback}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ProductCard>
  );
}
