"use client";

import { Chart, useChart } from "@chakra-ui/charts";
import { Label, Pie, PieChart, Sector } from "recharts";
import { tokens } from "@/lib/tokens";

type ScoreDonutProps = {
  score: number;
  /** Outer box size in px */
  size?: number;
  showCenterScore?: boolean;
};

/**
 * Chakra Charts donut with point labels (percentages).
 * @see https://chakra-ui.com/docs/charts/donut-chart#point-label
 */
export function ScoreDonut({
  score,
  size = 180,
  showCenterScore = true,
}: ScoreDonutProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const remainder = Math.max(0, 100 - clamped);

  const chart = useChart({
    data: [
      { name: "Score", value: clamped, color: tokens.mint },
      { name: "Remainder", value: remainder, color: "#3A3B46" },
    ],
  });

  const inner = Math.round(size * 0.38);
  const outer = Math.round(size * 0.48);

  return (
    <Chart.Root boxSize={`${size}px`} chart={chart} mx="auto">
      <PieChart
        margin={{ left: 28, top: 16, right: 28, bottom: 16 }}
        responsive
      >
        <Pie
          innerRadius={inner}
          outerRadius={outer}
          isAnimationActive={false}
          data={chart.data}
          dataKey={chart.key("value")}
          nameKey="name"
          paddingAngle={2}
          cornerRadius={4}
          labelLine={{ stroke: tokens.white, strokeWidth: 1, opacity: 0.45 }}
          label={({ value, cx, cy, midAngle, outerRadius: or }) => {
            if (value == null || value <= 0 || midAngle == null) return null;
            const RADIAN = Math.PI / 180;
            const radius = Number(or) + 14;
            const x = Number(cx) + radius * Math.cos(-midAngle * RADIAN);
            const y = Number(cy) + radius * Math.sin(-midAngle * RADIAN);
            return (
              <text
                x={x}
                y={y}
                fill={tokens.white}
                textAnchor={x > Number(cx) ? "start" : "end"}
                dominantBaseline="central"
                fontSize={12}
                fontFamily="var(--font-inter), Inter, sans-serif"
                fontWeight={600}
              >
                {`${value}%`}
              </text>
            );
          }}
          shape={(props) => (
            <Sector
              {...props}
              strokeWidth={0}
              fill={(props.payload as { color?: string })?.color ?? tokens.mint}
            />
          )}
        >
          {showCenterScore ? (
            <Label
              content={({ viewBox }) => (
                <Chart.RadialText
                  viewBox={viewBox}
                  title={`${clamped}%`}
                  description=""
                />
              )}
            />
          ) : null}
        </Pie>
      </PieChart>
    </Chart.Root>
  );
}
