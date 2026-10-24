"use client";

import { ProductCard } from "@/components/ProductCard";
import type { StoredFeedback } from "@/lib/feedback-store";

type ReportsInboxProps = {
  reports: StoredFeedback[];
};

function verdictLabel(verdict: StoredFeedback["verdict"]) {
  return verdict === "misclassified" ? "Reported issue" : "Looks right";
}

export function ReportsInbox({ reports }: ReportsInboxProps) {
  return (
    <ProductCard title="Submitted reports">
      <p className="-mt-1 mb-3 text-xs text-ps-white/40">
        Taps from the score panel land here (this browser) so we can review
        mistakes.
      </p>
      {reports.length === 0 ? (
        <p className="text-sm text-ps-white/55">
          No reports yet. After ANALYZE, tap Looks right or Report issue.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li
              key={`${report.url}-${report.reportedAt}`}
              className="rounded-xl bg-[#1f1012] px-3 py-3"
            >
              <p className="truncate text-sm text-ps-white">{report.url}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ps-white/70">
                {verdictLabel(report.verdict)} · {report.band} · {report.score}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ProductCard>
  );
}
