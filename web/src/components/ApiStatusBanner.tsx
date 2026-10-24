"use client";

import { DEFAULT_API_BASE, getApiBaseUrl } from "@/lib/api";

type ApiStatusBannerProps = {
  configured: boolean;
  healthy: boolean | null;
};

/** Only shown when live mode is configured and /health failed. */
export function ApiStatusBanner({ configured, healthy }: ApiStatusBannerProps) {
  if (!configured || healthy !== false) return null;

  const healthUrl = `${getApiBaseUrl() ?? DEFAULT_API_BASE}/health`;
  return (
    <p className="rounded-xl border border-ps-mint/40 bg-ps-card px-4 py-2 text-sm text-[#FFFFFF]">
      API inactive — <code className="text-ps-mint">{healthUrl}</code> did not
      respond.
    </p>
  );
}
