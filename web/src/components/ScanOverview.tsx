"use client";

/**
 * Workspace counters derived from local history when available.
 * Metric tiles use Morphing Dialog for progressive disclosure.
 * @see https://godui.design/docs/components/overlays/morphing-dialog
 */
import { BarChart3, ShieldPlus, UserRoundPlus, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContent,
  MorphingDialogTrigger,
} from "@/components/godui/morphing-dialog";
import type { StoredScan } from "@/lib/history-store";
import { OVERVIEW_STATS } from "@/lib/mock-dashboard";

type OverviewMetric = {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClass: string;
  description: string;
  details: { label: string; value: string }[];
};

function statsFromHistory(history: StoredScan[]) {
  if (history.length === 0) return null;
  const highRisk = history.filter((h) => h.score >= 60).length;
  const lowRisk = history.filter((h) => h.score < 40).length;
  const recentWarnings = history.filter((h) => h.score >= 60).slice(0, 10)
    .length;
  return {
    totalScans: history.length,
    highRisk,
    lowRisk,
    recentWarnings,
    source: "local history" as const,
  };
}

type ScanOverviewProps = {
  history: StoredScan[];
};

export function ScanOverview({ history }: ScanOverviewProps) {
  const derived = statsFromHistory(history);
  const stats = derived ?? {
    ...OVERVIEW_STATS,
    source: "demo placeholder" as const,
  };

  const { totalScans, highRisk, lowRisk, recentWarnings } = stats;

  const metrics: OverviewMetric[] = [
    {
      label: "Total Scans",
      value: totalScans,
      icon: BarChart3,
      iconClass: "text-ps-mint",
      description:
        derived
          ? "Count of URLs analyzed in this browser (localStorage)."
          : "Placeholder until you run analyzes (then stats use local history).",
      details: [
        { label: "This browser", value: totalScans.toLocaleString() },
        {
          label: "High-risk share",
          value:
            totalScans === 0
              ? "—"
              : `${Math.round((highRisk / totalScans) * 100)}%`,
        },
      ],
    },
    {
      label: "High-Risk URLs",
      value: highRisk,
      icon: Zap,
      iconClass: "text-ps-danger",
      description: "Scores in SUSPICIOUS (60–79) or PHISHING (80–100).",
      details: [
        { label: "Flagged", value: highRisk.toLocaleString() },
        { label: "Threshold", value: "score ≥ 60" },
      ],
    },
    {
      label: "Low-Risk URLs",
      value: lowRisk,
      icon: ShieldPlus,
      iconClass: "text-[#5B9BD5]",
      description: "Scores in SAFE / CLEAR bands (under 40).",
      details: [
        { label: "Cleared", value: lowRisk.toLocaleString() },
        { label: "Threshold", value: "score < 40" },
      ],
    },
    {
      label: "Recent Warnings",
      value: recentWarnings,
      icon: UserRoundPlus,
      iconClass: "text-[#9CA3AF]",
      description: "High-risk results among recent local history.",
      details: [
        { label: "Open warnings", value: recentWarnings.toLocaleString() },
        { label: "Source", value: stats.source },
      ],
    },
  ];

  return (
    <ProductCard title="Scan Overview">
      <p className="-mt-1 mb-3 text-xs text-ps-white/40">
        {derived
          ? "From local scan history"
          : "Demo stats — run ANALYZE to populate from history"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </ProductCard>
  );
}

function MetricCard({ metric }: { metric: OverviewMetric }) {
  const { label, value, icon: Icon, iconClass, description, details } = metric;

  return (
    <MorphingDialog>
      <MorphingDialogTrigger className="flex items-center gap-3 rounded-2xl bg-[#1f1012] px-4 py-4 outline-none transition-colors hover:bg-[#3a1c22] focus-visible:ring-2 focus-visible:ring-ps-mint/50">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ps-card">
          <Icon className={`h-5 w-5 ${iconClass}`} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[20px] font-semibold leading-none text-ps-white">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-sm leading-snug text-ps-white/65">{label}</p>
        </div>
      </MorphingDialogTrigger>

      <MorphingDialogContent className="w-full max-w-md rounded-2xl border border-border bg-ps-card p-6 text-ps-white shadow-2xl">
        <MorphingDialogClose className="bg-[#1f1012] text-ps-white/70 hover:bg-[#3a1c22] hover:text-ps-white" />
        <div className="flex items-start gap-4 pr-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1f1012]">
            <Icon className={`h-6 w-6 ${iconClass}`} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[28px] font-semibold leading-none tracking-tight">
              {value.toLocaleString()}
            </p>
            <p className="mt-2 text-base font-medium text-ps-mint">{label}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-ps-white/70">
          {description}
        </p>
        <dl className="mt-6 grid gap-3">
          {details.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-xl bg-[#1f1012] px-4 py-3"
            >
              <dt className="text-sm text-ps-white/65">{row.label}</dt>
              <dd className="text-sm font-semibold text-ps-white">{row.value}</dd>
            </div>
          ))}
        </dl>
      </MorphingDialogContent>
    </MorphingDialog>
  );
}
