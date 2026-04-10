"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { BFStep, Graph } from "@/types/graph";
import { CURRENCY_MAP } from "@/lib/currencies";
import { LineChart as LineChartIcon } from "lucide-react";

interface Props {
  graph: Graph;
  steps: BFStep[];
  currentIndex: number;
}

export function ConvergencePlot({ graph, steps, currentIndex }: Props) {
  if (steps.length === 0) return null;

  const byIteration = new Map<number, BFStep>();
  for (const step of steps.slice(0, currentIndex + 1)) {
    byIteration.set(step.iteration, step);
  }

  const V = graph.nodes.length;

  const data = Array.from(byIteration.values()).map((step) => {
    const row: Record<string, number | string> = { iteration: step.iteration + 1 };
    for (const node of graph.nodes) {
      const val = step.distances[node];
      row[node] = val != null && isFinite(val) ? parseFloat(val.toFixed(4)) : 999;
    }
    return row;
  });

  const maxIter = Math.max(...data.map((d) => d.iteration as number), 0);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <LineChartIcon className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold leading-none">Distance Convergence</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Node distances across BF iterations
          </p>
        </div>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.3 0.02 260)"
              strokeOpacity={0.3}
            />
            <XAxis
              dataKey="iteration"
              stroke="oklch(0.4 0.02 260)"
              tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 10 }}
              label={{
                value: "Iteration",
                position: "insideBottom",
                offset: -2,
                fill: "oklch(0.5 0.02 260)",
                fontSize: 10,
              }}
            />
            <YAxis
              stroke="oklch(0.4 0.02 260)"
              tick={{ fill: "oklch(0.55 0.02 260)", fontSize: 9 }}
              tickFormatter={(v) => (v >= 999 ? "\u221e" : v.toFixed(1))}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "oklch(0.16 0.02 260)",
                border: "1px solid oklch(0.26 0.025 260)",
                borderRadius: 12,
                fontSize: 11,
                padding: "8px 12px",
                boxShadow: "0 8px 24px oklch(0 0 0 / 30%)",
              }}
              formatter={(value, name) => [
                typeof value === "number" && value >= 999 ? "\u221e" : value,
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              iconType="line"
              iconSize={12}
            />
            {maxIter >= V - 1 && (
              <ReferenceLine
                x={V}
                stroke="#f59e0b"
                strokeDasharray="6 3"
                strokeOpacity={0.6}
                label={{
                  value: "Detection pass",
                  position: "top",
                  fill: "#f59e0b",
                  fontSize: 9,
                }}
              />
            )}
            {graph.nodes.map((node) => (
              <Line
                key={node}
                type="monotone"
                dataKey={node}
                stroke={CURRENCY_MAP[node]?.color ?? "#64748b"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
