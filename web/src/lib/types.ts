/**
 * Frontend types aligned with FastAPI `GET /analyze` (Python unchanged).
 * @see docs/FRONTEND.md
 */

/** Wire response from `GET /analyze?url=` */
export type AnalyzeResponse = {
  url: string;
  /** Phishing confidence 0–100 */
  score: number;
  signals: string[];
};

export type ScoreBand =
  | "SAFE"
  | "CLEAR"
  | "UNCERTAIN"
  | "SUSPICIOUS"
  | "PHISHING";

/** UI view-model after band mapping */
export type ScanResult = AnalyzeResponse & {
  band: ScoreBand;
};

export type RecentScan = {
  url: string;
  score: number;
  relativeTime: string;
};

export type AnalyzeStatus = "idle" | "loading" | "error";
