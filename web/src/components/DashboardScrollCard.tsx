"use client";

/**
 * Container Scroll with ignoreReducedMotion for Cursor/OS reduce-motion defaults.
 * @see https://godui.design/docs/components/layout/container-scroll
 */
import {
  ContainerScroll,
  type ContainerScrollProps,
} from "@/components/godui/container-scroll";

export function DashboardScrollCard({
  ignoreReducedMotion = true,
  size = "card",
  ...props
}: ContainerScrollProps) {
  return (
    <ContainerScroll
      size={size}
      ignoreReducedMotion={ignoreReducedMotion}
      {...props}
    />
  );
}
