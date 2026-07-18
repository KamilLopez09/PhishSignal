"use client";

type ApiStatusBannerProps = {
  configured: boolean;
  healthy: boolean | null;
};

/** Surfaces API reachability when live mode is configured. */
export function ApiStatusBanner({ configured, healthy }: ApiStatusBannerProps) {
  if (!configured) return null;
  if (healthy === null) {
    return (
      <p className="rounded-xl border border-border/70 bg-ps-card/80 px-4 py-2 text-sm text-ps-white/80">
        Checking API…
      </p>
    );
  }
  if (healthy) return null;

  return (
    <p className="rounded-xl border border-ps-mint/40 bg-ps-card px-4 py-2 text-sm text-[#FFFFFF]">
      API unreachable at{" "}
      <code className="text-ps-mint">NEXT_PUBLIC_API_BASE_URL</code>. Start
      FastAPI on port 8000 or the UI will keep failing analyzes.
    </p>
  );
}
