"use client";

import { ProductCard } from "@/components/ProductCard";
import { ScoreDonut } from "@/components/ScoreDonut";
import type { RecentScan } from "@/lib/types";

type RecentScansHistoryProps = {
  scans: RecentScan[];
};

export function RecentScansHistory({ scans }: RecentScansHistoryProps) {
  const latest = scans[0];

  return (
    <ProductCard title="Recent Scans History">
      {!latest ? (
        <p className="text-sm text-ps-white/55">No scans yet.</p>
      ) : (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="max-w-[220px] truncate rounded-full bg-[#1f1012] px-3 py-1.5 text-sm text-ps-white">
              {latest.url}
            </span>
            <span className="text-[11px] font-medium tracking-wide text-ps-white/45">
              {latest.relativeTime}
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <ScoreDonut score={latest.score} size={140} />
          </div>
        </div>
      )}
    </ProductCard>
  );
}
