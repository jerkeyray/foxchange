"use client";

import { useEffect, useRef } from "react";
import type { BFStep, Graph } from "@/types/graph";
import { CURRENCY_MAP } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { Table2 } from "lucide-react";

interface Props {
  graph: Graph;
  steps: BFStep[];
  currentIndex: number;
}

export function IterationTable({ graph, steps, currentIndex }: Props) {
  const currentStep = steps[currentIndex];
  const tableRef = useRef<HTMLDivElement>(null);

  const byIteration = new Map<number, BFStep[]>();
  for (const step of steps) {
    if (!byIteration.has(step.iteration)) {
      byIteration.set(step.iteration, []);
    }
    byIteration.get(step.iteration)!.push(step);
  }

  const iterations = [...byIteration.keys()].sort((a, b) => a - b);

  const iterDistances: Array<{ iteration: number; distances: Record<string, number> }> = [];
  for (const iter of iterations) {
    const iterSteps = byIteration.get(iter)!;
    const last = iterSteps[iterSteps.length - 1];
    iterDistances.push({ iteration: iter, distances: last.distances });
  }

  const initialDist: Record<string, number> = {};
  for (const n of graph.nodes) {
    initialDist[n] = Infinity;
  }

  const updatedNode = currentStep?.updated ?? null;
  const currentIteration = currentStep?.iteration ?? -1;

  useEffect(() => {
    const row = tableRef.current?.querySelector(`[data-iter="${currentIteration}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIteration]);

  function fmt(v: number) {
    if (!isFinite(v)) return "\u221e";
    return v.toFixed(4);
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <Table2 className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold leading-none">Distance Table</h3>
          <p className="text-[11px] text-muted-foreground mt-1 font-mono tabular-nums">
            Iteration {currentIteration + 1} of {iterations.length}
          </p>
        </div>
      </div>
      <div ref={tableRef} className="overflow-auto max-h-[640px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-20">
            <tr className="border-b-2 border-border">
              <th className="px-5 py-3.5 text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wider w-20 sticky left-0 bg-card z-10">
                Pass
              </th>
              {graph.nodes.map((node) => (
                <th
                  key={node}
                  className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: CURRENCY_MAP[node]?.color ?? "#94a3b8" }}
                >
                  {node}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/40">
              <td className="px-5 py-3 text-muted-foreground/50 font-mono text-xs uppercase tracking-wider sticky left-0 bg-card z-10">
                init
              </td>
              {graph.nodes.map((node) => (
                <td key={node} className="px-4 py-3 text-right font-mono text-muted-foreground/40 tabular-nums">
                  {"\u221e"}
                </td>
              ))}
            </tr>
            {iterDistances.map(({ iteration, distances }, rowIdx) => {
              const isActive = iteration === currentIteration;
              const prevDist =
                iteration === 0
                  ? initialDist
                  : iterDistances[iteration - 1]?.distances ?? initialDist;

              return (
                <tr
                  key={iteration}
                  data-iter={iteration}
                  className={cn(
                    "border-b border-border/30 transition-all duration-200",
                    isActive && "bg-amber-500/10",
                    !isActive && rowIdx % 2 === 1 && "bg-muted/20"
                  )}
                >
                  <td className={cn(
                    "px-5 py-3 font-mono sticky left-0 z-10 transition-colors text-sm",
                    isActive ? "text-amber-400 font-bold bg-amber-500/10" : "text-muted-foreground bg-card"
                  )}>
                    {iteration + 1}
                  </td>
                  {graph.nodes.map((node) => {
                    const val = distances[node];
                    const prev = prevDist[node];
                    const changed = isFinite(val) && (!isFinite(prev) || Math.abs(val - prev) > 1e-10);
                    const isUpdated = isActive && node === updatedNode;

                    return (
                      <td
                        key={node}
                        className={cn(
                          "px-4 py-3 text-right font-mono transition-all duration-200 tabular-nums",
                          isUpdated && "text-green-400 font-bold text-base",
                          changed && !isUpdated && "text-foreground",
                          !changed && "text-muted-foreground/60"
                        )}
                      >
                        {isUpdated && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 align-middle" />}
                        {fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
