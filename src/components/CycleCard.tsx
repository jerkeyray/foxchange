"use client";

import { ArrowRight, Copy, Check, TrendingUp } from "lucide-react";
import { useState } from "react";
import type { CycleResult } from "@/types/graph";
import { CURRENCY_MAP } from "@/lib/currencies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  cycle: CycleResult;
  variant?: "compact" | "expanded";
  isSelected?: boolean;
  onClick?: () => void;
}

export function CycleCard({ cycle, variant = "compact", isSelected, onClick }: Props) {
  const [copied, setCopied] = useState(false);
  const { path, profitPct, rates } = cycle;
  const loop = path.slice(0, -1);

  function handleCopy() {
    const text = `${path.join(" -> ")} | +${profitPct.toFixed(3)}%`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left p-3.5 rounded-xl border transition-all duration-200 group",
          isSelected
            ? "border-amber-500/50 bg-amber-500/8"
            : "border-border hover:border-amber-500/25 hover:bg-muted/30 hover:shadow-sm"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap text-sm">
            {loop.map((code, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 font-medium">
                  <span className="text-xs">{CURRENCY_MAP[code]?.flag}</span>
                  <span style={{ color: CURRENCY_MAP[code]?.color ?? "#94a3b8" }}>{code}</span>
                </span>
                {i < loop.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                )}
              </span>
            ))}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 font-mono text-xs transition-colors",
              profitPct > 0
                ? "text-green-400 border-green-500/25 bg-green-500/8"
                : "text-muted-foreground"
            )}
          >
            +{profitPct.toFixed(3)}%
          </Badge>
        </div>
      </button>
    );
  }

  // Expanded variant
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5 animate-scale-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <h3 className="font-bold text-lg">Arbitrage Cycle</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/15 text-green-400 border-green-500/25 font-mono">
            +{profitPct.toFixed(4)}%
          </Badge>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground" onClick={handleCopy}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Path chain */}
      <div className="flex items-center gap-2 flex-wrap">
        {loop.map((code, i) => {
          const currency = CURRENCY_MAP[code];
          return (
            <span key={i} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm">
                <span className="text-base">{currency?.flag}</span>
                <span style={{ color: currency?.color ?? "#94a3b8" }}>{code}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-amber-500/70" />
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 bg-card border border-border/50 rounded-xl px-3 py-1.5 text-sm font-medium opacity-50">
          <span className="text-base">{CURRENCY_MAP[loop[0]]?.flag}</span>
          <span style={{ color: CURRENCY_MAP[loop[0]]?.color ?? "#94a3b8" }}>{loop[0]}</span>
        </span>
      </div>

      {/* Per-hop breakdown */}
      <div className="space-y-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
          Hop-by-hop breakdown
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          {loop.map((from, i) => {
            const to = loop[(i + 1) % loop.length];
            const rate = rates[i];
            const cumulative = rates.slice(0, i + 1).reduce((p, r) => p * r, 1);
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm",
                  i < loop.length - 1 && "border-b border-border/50"
                )}
              >
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="text-xs">{CURRENCY_MAP[from]?.flag}</span>
                  {from}
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-xs">{CURRENCY_MAP[to]?.flag}</span>
                  {to}
                </span>
                <div className="flex items-center gap-6 font-mono text-xs">
                  <span className="text-foreground">{rate?.toFixed(6)}</span>
                  <span className="text-muted-foreground w-20 text-right tabular-nums">
                    x{cumulative.toFixed(6)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Net multiplier */}
      <div className="rounded-xl bg-green-500/8 border border-green-500/15 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Net multiplier</span>
        <span className="font-mono font-bold text-green-400 text-lg tabular-nums">
          x{(1 + profitPct / 100).toFixed(6)}
        </span>
      </div>
    </div>
  );
}
