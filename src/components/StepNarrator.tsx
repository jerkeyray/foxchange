"use client";

import type { BFStep, CycleResult } from "@/types/graph";
import { CURRENCY_MAP } from "@/lib/currencies";
import { ArrowRight, Check, Search, TriangleAlert, Trophy } from "lucide-react";

interface Props {
  step: BFStep | null;
  currentIndex: number;
  totalSteps: number;
  source: string;
  cycles?: CycleResult[];
  numNodes: number;
}

function fmtRate(v: number) {
  if (!isFinite(v)) return "\u221e";
  if (v === 0) return "1.0000";
  const r = Math.exp(-v);
  if (r >= 100) return r.toFixed(2);
  if (r >= 0.01) return r.toFixed(4);
  return r.toExponential(2);
}

function CurrencyChip({ code }: { code: string }) {
  const c = CURRENCY_MAP[code];
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/60 border border-border/40 font-mono text-[11px]">
      {c?.flag && <span>{c.flag}</span>}
      <span style={{ color: c?.color ?? "#94a3b8" }} className="font-semibold">{code}</span>
    </span>
  );
}

export function StepNarrator({ step, currentIndex, totalSteps, source, cycles = [], numNodes }: Props) {
  const atEnd = currentIndex >= totalSteps - 1;

  if (!step) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-3.5 flex items-center gap-3 text-sm text-muted-foreground">
        <Search className="w-4 h-4" />
        Press play to step through Bellman-Ford.
      </div>
    );
  }

  // Detection pass = the V-th pass (iteration index = numNodes - 1)
  const isDetectionPass = step.iteration === numNodes - 1;
  const hasCycles = cycles.length > 0;

  // End state: show cycle summary if we found one, otherwise convergence message
  if (atEnd) {
    if (hasCycles) {
      const best = cycles[0];
      return (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 px-5 py-3.5 flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-amber-400/80 font-semibold">
              Arbitrage detected
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-sm">
              {best.path.slice(0, -1).map((code, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CurrencyChip code={code} />
                  <ArrowRight className="w-3 h-3 text-amber-500/70" />
                </span>
              ))}
              <CurrencyChip code={best.path[0]} />
              <span className="ml-2 font-mono text-sm text-green-400 font-bold">
                +{best.profitPct.toFixed(3)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-green-400/80 font-semibold">
            Converged
          </div>
          <div className="text-sm text-muted-foreground">
            All distances stable. No negative cycles — no arbitrage in this graph.
          </div>
        </div>
      </div>
    );
  }

  // Mid-playback narration
  const { edge, relaxed, distances, updated } = step;
  const newDist = updated ? distances[updated] : null;

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-3.5 flex items-center gap-4 flex-wrap">
      {/* Pass + status icon */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDetectionPass && relaxed
              ? "bg-amber-500/15"
              : relaxed
              ? "bg-green-500/15"
              : "bg-muted"
          }`}
        >
          {isDetectionPass && relaxed ? (
            <TriangleAlert className="w-4 h-4 text-amber-400" />
          ) : relaxed ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {isDetectionPass ? "Detection pass" : `Pass ${step.iteration + 1} / ${numNodes - 1}`}
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono tabular-nums">
            step {currentIndex + 1} / {totalSteps}
          </span>
        </div>
      </div>

      <div className="w-px h-8 bg-border/60 shrink-0 hidden sm:block" />

      {/* Edge being checked */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
          {relaxed ? "Relaxed" : "Checking"}
        </span>
        <CurrencyChip code={edge.from} />
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
        <CurrencyChip code={edge.to} />
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          @ {edge.rawRate.toFixed(4)}
        </span>
      </div>

      {/* Result */}
      {relaxed && updated && newDist != null && (
        <>
          <div className="w-px h-8 bg-border/60 shrink-0 hidden sm:block" />
          <div className="flex items-center gap-2 text-sm">
            {isDetectionPass ? (
              <span className="text-amber-400 font-medium">
                Still relaxing on pass V — negative cycle through{" "}
                <CurrencyChip code={updated} />
              </span>
            ) : (
              <span className="text-foreground/90">
                <span className="text-muted-foreground">1</span>{" "}
                <CurrencyChip code={source} />{" "}
                <ArrowRight className="w-3 h-3 inline text-muted-foreground/60" />{" "}
                <CurrencyChip code={updated} />
                <span className="font-mono text-green-400 font-bold ml-1.5 tabular-nums">
                  = {fmtRate(newDist)}
                </span>
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
