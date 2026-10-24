"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnalyzerCanvas } from "@/components/AnalyzerCanvas";
import { ApiStatusBanner } from "@/components/ApiStatusBanner";
import { AppHeader, type AppPage } from "@/components/AppHeader";
import { FlagBreakdown } from "@/components/FlagBreakdown";
import { RecentScansHistory } from "@/components/RecentScansHistory";
import { ReportsInbox } from "@/components/ReportsInbox";
import { ScanOverview } from "@/components/ScanOverview";
import { AnalyzeGate, formatGateError } from "@/lib/analyze-gate";
import {
  analyzeUrl,
  checkHealth,
  isLiveApiConfigured,
} from "@/lib/api";
import { toScanResult } from "@/lib/bands";
import {
  feedbackByUrl,
  loadFeedback,
  saveFeedback,
  type FeedbackInput,
  type FeedbackVerdict,
  type StoredFeedback,
} from "@/lib/feedback-store";
import {
  loadHistory,
  prependHistory,
  type StoredScan,
} from "@/lib/history-store";
import { INITIAL_RESULT, mockAnalyze } from "@/lib/mock-dashboard";
import type { AnalyzeStatus, ScanResult } from "@/lib/types";
import { serializeUrlInput } from "@/lib/url-input";

export function Dashboard() {
  const liveConfigured = isLiveApiConfigured();
  const gate = useMemo(() => new AnalyzeGate(), []);

  const [page, setPage] = useState<AppPage>("dashboard");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<StoredScan[]>([]);
  const [reports, setReports] = useState<StoredFeedback[]>([]);
  const [verdicts, setVerdicts] = useState<Record<string, FeedbackVerdict>>(
    {},
  );
  const [status, setStatus] = useState<AnalyzeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(
    liveConfigured ? null : false,
  );

  useEffect(() => {
    setHistory(loadHistory());
    const stored = loadFeedback();
    setReports(stored);
    setVerdicts(feedbackByUrl(stored));
  }, []);

  const onFeedback = useCallback((entry: FeedbackInput) => {
    const next = saveFeedback(entry);
    setReports(next);
    setVerdicts(feedbackByUrl(next));
  }, []);

  useEffect(() => {
    if (!liveConfigured) {
      setApiHealthy(false);
      return;
    }
    setApiHealthy(null);
    let active = true;
    void (async () => {
      const ok = await checkHealth();
      if (active) setApiHealthy(ok);
    })();
    return () => {
      active = false;
    };
  }, [liveConfigured]);

  const onAnalyze = useCallback(
    async (rawInput: string) => {
      const serialized = serializeUrlInput(rawInput);
      if (!serialized.ok) {
        setError(serialized.reason);
        setStatus("error");
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const gated = await gate.runExclusive(async () => {
          const raw = liveConfigured
            ? await analyzeUrl(serialized.url)
            : mockAnalyze(serialized.url);
          return toScanResult(raw.url, raw.score, raw.signals);
        });

        if (!gated.ok) {
          setStatus("error");
          setError(formatGateError(gated.reject));
          return;
        }

        const next = gated.value;
        setResult(next);
        setHistory(prependHistory(next));
        if (liveConfigured) setApiHealthy(true);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Analyze failed");
        if (liveConfigured) setApiHealthy(false);
      }
    },
    [gate, liveConfigured],
  );

  const displayResult = result ?? INITIAL_RESULT;

  return (
    <div className="min-h-screen bg-ps-bg font-sans text-ps-ink">
      <AppHeader
        page={page}
        onPageChange={setPage}
        liveApi={liveConfigured && apiHealthy === true}
      />
      <main className="px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
          <ApiStatusBanner configured={liveConfigured} healthy={apiHealthy} />

          {page === "dashboard" ? (
            <>
              <AnalyzerCanvas
                result={displayResult}
                status={status}
                error={error}
                onAnalyze={onAnalyze}
                hasLiveResult={result != null}
                verdict={result ? verdicts[result.url] : undefined}
                onFeedback={onFeedback}
              />

              <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-stretch">
                <RecentScansHistory
                  scans={history}
                  verdicts={verdicts}
                  onFeedback={onFeedback}
                />
                <ScanOverview history={history} />
              </div>

              <FlagBreakdown
                signals={displayResult.signals}
                url={displayResult.url}
                fromApi={result != null}
              />
            </>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
              <RecentScansHistory
                scans={history}
                verdicts={verdicts}
                onFeedback={onFeedback}
                limit={40}
              />
              <ReportsInbox reports={reports} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
