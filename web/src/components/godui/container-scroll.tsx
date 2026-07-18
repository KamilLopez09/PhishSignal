"use client";

/**
 * GodUI Container Scroll — device frame that un-tilts on scroll.
 * @see https://godui.design/docs/components/layout/container-scroll
 * @see https://godui.design/r/container-scroll.json
 *
 * Canonical behavior: frame starts tilted (rotateX 20°), scales from 1.05→1,
 * and the headline rises (translateY 0→-100) as the section scrolls through
 * the viewport.
 *
 * IMPORTANT: When `prefers-reduced-motion: reduce` is on, GodUI disables the
 * scroll-linked animation. Pass `ignoreReducedMotion` to keep the effect for
 * demos (OS/browser accessibility settings often enable reduce by default).
 */
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

export type ContainerScrollSize = "hero" | "card";

export type ContainerScrollProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Headline block rendered above the device, rising as you scroll. */
  header?: React.ReactNode;
  /** The "screen" content — an image, video, or live UI. */
  children: React.ReactNode;
  /**
   * `hero` — GodUI default (60–80rem centered track).
   * `card` — same physics, sticky stage inside a tall track (dashboard).
   */
  size?: ContainerScrollSize;
  /**
   * When true, run scroll physics even if the user prefers reduced motion.
   * Needed when the host browser (e.g. Cursor Simple Browser) has reduce on.
   */
  ignoreReducedMotion?: boolean;
};

// SPRING.smooth — surfaces / shared-layout feel (GodUI).
const SPRING = { stiffness: 320, damping: 32, mass: 0.9 } as const;

function DeviceFrame({
  size,
  children,
}: {
  size: ContainerScrollSize;
  children: React.ReactNode;
}) {
  if (size === "hero") {
    return (
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-card p-2 shadow-2xl md:p-3">
        <div className="aspect-[16/10] size-full overflow-hidden rounded-xl bg-muted [&>img]:size-full [&>img]:object-cover [&>video]:size-full [&>video]:object-cover">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full rounded-2xl border border-border bg-ps-card p-2 shadow-2xl">
      <div className="flex min-h-[280px] size-full flex-col overflow-visible rounded-xl bg-ps-card text-ps-white">
        {children}
      </div>
    </div>
  );
}

const ContainerScroll = React.forwardRef<HTMLDivElement, ContainerScrollProps>(
  (
    {
      header,
      children,
      className,
      size = "hero",
      ignoreReducedMotion = false,
      ...props
    },
    ref,
  ) => {
    const prefersReduced = useReducedMotion() ?? false;
    const reduce = prefersReduced && !ignoreReducedMotion;
    const containerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(
      ref,
      () => containerRef.current as HTMLDivElement,
    );

    // Always call hooks (Rules of Hooks). Values unused when `reduce` is true.
    const { scrollYProgress } = useScroll({ target: containerRef });

    const rotateX = useSpring(
      useTransform(scrollYProgress, [0, 1], [20, 0]),
      SPRING,
    );
    const scale = useSpring(
      useTransform(scrollYProgress, [0, 1], [1.05, 1]),
      SPRING,
    );
    const translateY = useSpring(
      useTransform(scrollYProgress, [0, 1], [0, -100]),
      SPRING,
    );

    // Card mode stays 2D: preserve-3d + rotateX breaks pointer hit-testing on
    // nested controls (ANALYZE never receives clicks). Hero keeps the tilt.
    const stage = (
      <div
        className={cn(
          "relative w-full",
          size === "hero" && "[perspective:1000px]",
        )}
      >
        {header ? (
          <motion.div
            style={reduce ? undefined : { translateY }}
            className={cn(
              "mx-auto text-center",
              size === "card" ? "mb-4 max-w-xl" : "mb-10 max-w-3xl",
            )}
          >
            {header}
          </motion.div>
        ) : null}
        <motion.div
          style={
            reduce
              ? undefined
              : size === "card"
                ? { scale }
                : { rotateX, scale }
          }
          className={size === "hero" ? "[transform-style:preserve-3d]" : undefined}
        >
          <DeviceFrame size={size}>{children}</DeviceFrame>
        </motion.div>
      </div>
    );

    // Reduced motion: upright static device — still framed, no scroll physics.
    if (reduce) {
      return (
        <div
          ref={containerRef}
          data-slot="container-scroll"
          data-size={size}
          data-motion="reduced"
          className={cn(
            size === "hero"
              ? "flex flex-col items-center px-4 py-16"
              : "flex w-full flex-col items-center px-2 py-6",
            className,
          )}
          {...props}
        >
          {header ? <div className="mb-6 text-center">{header}</div> : null}
          <DeviceFrame size={size}>{children}</DeviceFrame>
        </div>
      );
    }

    if (size === "hero") {
      return (
        <div
          ref={containerRef}
          data-slot="container-scroll"
          data-size={size}
          data-motion="scroll"
          className={cn(
            "relative flex h-[60rem] items-center justify-center p-4 md:h-[80rem] md:p-20",
            className,
          )}
          {...props}
        >
          {stage}
        </div>
      );
    }

    // Card: product-scale track + sticky stage (analyzer canvas).
    // Shorter than marketing hero so the GPTZero-style workspace stays usable.
    return (
      <div
        ref={containerRef}
        data-slot="container-scroll"
        data-size={size}
        data-motion="scroll"
        className={cn("relative h-[36rem] w-full md:h-[42rem]", className)}
        {...props}
      >
        <div className="sticky top-[5.5rem] flex w-full items-center justify-center px-1 py-2">
          {stage}
        </div>
      </div>
    );
  },
);
ContainerScroll.displayName = "ContainerScroll";

export { ContainerScroll };
