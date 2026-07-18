"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  titleAlign?: "left" | "center";
};

export function ProductCard({
  title,
  children,
  className,
  bodyClassName,
  titleAlign = "left",
}: ProductCardProps) {
  return (
    <section
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border/90 bg-ps-card shadow-[0_18px_40px_-24px_rgba(0,0,0,0.65)]",
        className,
      )}
    >
      <header
        className={cn(
          "border-b border-border/70 px-5 py-4",
          titleAlign === "center" && "text-center",
        )}
      >
        <h2 className="text-[17px] font-semibold tracking-tight text-ps-white">
          {title}
        </h2>
      </header>
      <div className={cn("flex flex-1 flex-col p-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
