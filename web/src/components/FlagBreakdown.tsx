"use client";

/**
 * Flag Breakdown ← analyze JSON `signals[]` for the processed URL.
 */
import { ProductCard } from "@/components/ProductCard";

type FlagBreakdownProps = {
  signals: string[];
  url?: string;
  fromApi: boolean;
};

export function FlagBreakdown({ signals, url, fromApi }: FlagBreakdownProps) {
  return (
    <ProductCard title="Flag Breakdown" titleAlign="center">
      {fromApi && url ? (
        <p className="mb-3 truncate text-center text-xs text-ps-white/45">
          Signals for <span className="text-ps-white/70">{url}</span>
        </p>
      ) : (
        <p className="mb-3 text-center text-xs text-ps-white/45">
          Signals appear here after ANALYZE returns JSON
        </p>
      )}

      {signals.length === 0 ? (
        <p className="text-center text-sm text-ps-white/55">
          No signals returned for this URL.
        </p>
      ) : (
        <ul className="mx-auto grid w-full max-w-2xl gap-2 sm:grid-cols-2">
          {signals.map((item) => (
            <li
              key={item}
              className="rounded-xl bg-[#1f1012] px-4 py-3 text-[14px] leading-snug text-ps-white/90"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </ProductCard>
  );
}
