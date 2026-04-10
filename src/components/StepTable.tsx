"use client";

import { useEffect, useRef } from "react";
import type { BFStep, Graph } from "@/types/graph";
import { CURRENCY_MAP } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { ListOrdered, Check } from "lucide-react";

interface Props {
  graph: Graph;
  steps: BFStep[];
  currentIndex: number;
  source?: string;
}

function CurrencyTag({ code }: { code: string }) {
  const c = CURRENCY_MAP[code];
  return (
    <span
      className="font-mono font-semibold"
      style={{ color: c?.color ?? "#94a3b8" }}
    >
      {code}
    </span>
  );
}

function fmtDist(v: number) {
  if (!isFinite(v)) return "\u221e";
  return (v >= 0 ? "+" : "") + v.toFixed(4);
}

function fmtWeight(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(4);
}

export function StepTable({ graph, steps, currentIndex, source }: Props) {
  const tableRef = useRef<HTMLDivElement>(null);
  const numNodes = graph.nodes.length;

  const inferredSource =
    source ??
    (steps[0]
      ? Object.entries(steps[0].distances).find(([, v]) => v === 0)?.[0]
      : undefined) ??
    graph.nodes[0];

  // Initial distances: source = 0, everyone else = Infinity
  const initialDist: Record<string, number> = {};
  for (const n of graph.nodes) initialDist[n] = Infinity;
  initialDist[inferredSource] = 0;

  useEffect(() => {
    const row = tableRef.current?.querySelector(`[data-step="${currentIndex}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentIndex]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <ListOrdered className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold leading-none">Step Trace</h3>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Every edge relaxation Bellman-Ford performs. The <span className="font-mono">Operation</span> column shows the actual comparison: <span className="font-mono">d[u] + w(u,v) &lt; d[v]</span>?
          </p>
        </div>
      </div>
      <div ref={tableRef} className="overflow-auto max-h-[640px]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-20">
            <tr className="border-b-2 border-border">
              <th className="px-4 py-3 text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wider w-14">
                #
              </th>
              <th className="px-3 py-3 text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wider w-16">
                Pass
              </th>
              <th className="px-4 py-3 text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                Edge
              </th>
              <th className="px-4 py-3 text-right text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                Rate
              </th>
              <th className="px-4 py-3 text-right text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                −log(rate)
              </th>
              <th className="px-4 py-3 text-left text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                Operation
              </th>
              <th className="px-4 py-3 text-center text-[11px] text-muted-foreground font-semibold uppercase tracking-wider w-20">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, i) => {
              const isCurrent = i === currentIndex;
              const isPast = i < currentIndex;
              const isDetectionPass = step.iteration === numNodes - 1;

              // Distances entering this step are those AFTER the previous step
              const prevDist = i === 0 ? initialDist : steps[i - 1].distances;
              const distFrom = prevDist[step.edge.from];
              const distTo = prevDist[step.edge.to];
              const sum = distFrom + step.edge.weight;
              const sumDisplay = isFinite(distFrom) ? fmtDist(sum) : "\u221e";

              return (
                <tr
                  key={i}
                  data-step={i}
                  className={cn(
                    "border-b border-border/30 transition-colors",
                    isCurrent && "bg-amber-500/10",
                    !isCurrent && i % 2 === 1 && "bg-muted/20",
                    !isCurrent && !isPast && "opacity-50"
                  )}
                >
                  <td
                    className={cn(
                      "px-4 py-2.5 font-mono tabular-nums text-xs",
                      isCurrent ? "text-amber-400 font-bold" : "text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums text-xs">
                    <span
                      className={cn(
                        isDetectionPass
                          ? "text-amber-400 font-semibold"
                          : "text-muted-foreground"
                      )}
                    >
                      {isDetectionPass ? "V" : step.iteration + 1}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <CurrencyTag code={step.edge.from} />
                      <span className="text-muted-foreground/60">→</span>
                      <CurrencyTag code={step.edge.to} />
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-mono tabular-nums",
                      isCurrent ? "text-foreground font-semibold" : "text-foreground/80"
                    )}
                  >
                    {step.edge.rawRate >= 100
                      ? step.edge.rawRate.toFixed(2)
                      : step.edge.rawRate >= 0.01
                      ? step.edge.rawRate.toFixed(4)
                      : step.edge.rawRate.toExponential(2)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-mono tabular-nums",
                      step.edge.weight < 0 ? "text-green-400" : "text-red-400/80"
                    )}
                  >
                    {fmtWeight(step.edge.weight)}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-xs whitespace-nowrap">
                    <span className="text-muted-foreground">d[</span>
                    <CurrencyTag code={step.edge.from} />
                    <span className="text-muted-foreground">]</span>
                    <span className="text-foreground/80 mx-1">{fmtDist(distFrom)}</span>
                    <span className="text-muted-foreground/60">+</span>
                    <span
                      className={cn(
                        "mx-1",
                        step.edge.weight < 0 ? "text-green-400" : "text-red-400/80"
                      )}
                    >
                      {fmtWeight(step.edge.weight)}
                    </span>
                    <span className="text-muted-foreground/60">=</span>
                    <span className="text-foreground mx-1 font-semibold">{sumDisplay}</span>
                    <span
                      className={cn(
                        "mx-1",
                        step.relaxed ? "text-green-400" : "text-muted-foreground/60"
                      )}
                    >
                      {step.relaxed ? "<" : "\u2265"}
                    </span>
                    <span className="text-muted-foreground">d[</span>
                    <CurrencyTag code={step.edge.to} />
                    <span className="text-muted-foreground">]</span>
                    <span className="text-foreground/80 ml-1">{fmtDist(distTo)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {step.relaxed ? (
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-5 h-5 rounded-md",
                          isDetectionPass
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-green-500/15 text-green-400"
                        )}
                        title={isDetectionPass ? "Relaxed on detection pass — cycle!" : "Relaxed"}
                      >
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
