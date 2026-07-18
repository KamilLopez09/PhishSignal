"use client";

/**
 * Brand header — single-weight PhishSignal wordmark + GodUI dropdown nav.
 * @see https://godui.design/docs/components/navigation/dropdown-menu
 */
import { useState } from "react";
import { ChevronDown, Clock, Home, Settings } from "lucide-react";
import {
  DropdownMenu,
  type DropdownMenuItem,
} from "@/components/godui/dropdown-menu";

type NavId = "dashboard" | "settings" | "history";

type AppHeaderProps = {
  liveApi?: boolean;
};

const LABELS: Record<NavId, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  history: "History",
};

export function AppHeader({ liveApi = false }: AppHeaderProps) {
  const [active, setActive] = useState<NavId>("dashboard");

  const items: DropdownMenuItem[] = [
    {
      label: "Dashboard",
      icon: <Home className="h-4 w-4" strokeWidth={2} />,
      onSelect: () => setActive("dashboard"),
    },
    {
      label: "Settings",
      icon: <Settings className="h-4 w-4" strokeWidth={2} />,
      onSelect: () => setActive("settings"),
    },
    {
      label: "History",
      icon: <Clock className="h-4 w-4" strokeWidth={2} />,
      onSelect: () => setActive("history"),
    },
    { type: "separator" },
    {
      type: "label",
      label: liveApi ? "API live" : "Mock data",
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-ps-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4 md:px-8">
        <p className="font-sans text-[1.75rem] font-semibold tracking-[-0.03em] text-ps-ink md:text-[1.95rem]">
          Phish<span className="text-ps-mint">Signal</span>
        </p>

        <DropdownMenu
          side="bottom"
          align="end"
          trigger={
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-ps-card px-4 py-2 text-sm font-medium text-ps-white shadow-sm transition-colors hover:bg-[#3a1c22]">
              {LABELS[active]}
              <ChevronDown className="h-4 w-4 opacity-70" strokeWidth={2} />
            </span>
          }
          items={items}
        />
      </div>
    </header>
  );
}
