"use client";

import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CycleResult, Graph } from "@/types/graph";
import { CurrencyGraph } from "./CurrencyGraph";
import { CycleCard } from "./CycleCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  AlertTriangle,
  ScanLine,
  Activity,
  Zap,
  Clock,
} from "lucide-react";

interface ScanResult {
  cycles: CycleResult[];
  graph: Graph;
  timestamp: string;
}

export function Dashboard() {
  const router = useRouter();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [source, setSource] = useState<string>("USD");

  const deferredThreshold = useDeferredValue(threshold);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan?threshold=0`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ScanResult = await res.json();
      setResult(data);
      setSelectedCycleId(data.cycles[0]?.id ?? null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  const filteredCycles =
    result?.cycles.filter((c) => c.profitPct >= deferredThreshold) ?? [];

  const containerRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ w: 600, h: 500 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setGraphSize({
          w: Math.round(entry.contentRect.width),
          h: Math.max(500, Math.round(entry.contentRect.width * 0.65)),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bestProfit = filteredCycles[0]?.profitPct ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero header */}
      <div className="animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Currency Arbitrage Scanner
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Live exchange rates are modeled as a directed graph. Each edge weight is{" "}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">-log(rate)</code>
              — if a cycle of edges sums to a negative number, that&apos;s arbitrage.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {result && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5">
                <Clock className="w-3 h-3" />
                {new Date(result.timestamp).toLocaleTimeString()}
              </div>
            )}
            <Button
              onClick={scan}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ScanLine className="w-4 h-4" />
              )}
              {loading ? "Scanning..." : "Scan for Arbitrage"}
            </Button>
          </div>
        </div>

        {/* Live stats bar */}
        {result && (
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-muted-foreground">Currencies</span>
              <span className="text-sm font-semibold font-mono">{result.graph.nodes.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-muted-foreground">Edges</span>
              <span className="text-sm font-semibold font-mono">{result.graph.edges.length}</span>
            </div>
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border ${
              filteredCycles.length > 0
                ? "bg-green-500/10 border-green-500/20"
                : "bg-card border-border"
            }`}>
              <div className={`w-2 h-2 rounded-full ${filteredCycles.length > 0 ? "bg-green-400" : "bg-muted-foreground/30"}`} />
              <span className="text-xs text-muted-foreground">Arbitrage</span>
              <span className="text-sm font-semibold font-mono">
                {filteredCycles.length > 0 ? `${filteredCycles.length} found` : "None"}
              </span>
              {bestProfit > 0 && (
                <Badge className="bg-green-500/15 text-green-400 border-green-500/25 text-xs font-mono ml-1">
                  +{bestProfit.toFixed(3)}%
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 animate-scale-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={scan}>
            Retry
          </Button>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Graph */}
        <div
          ref={containerRef}
          className="rounded-2xl border border-border overflow-hidden graph-container dot-grid min-h-[500px] relative group"
        >
          {result ? (
            <CurrencyGraph
              graph={result.graph}
              cycles={filteredCycles}
              highlightCycleId={selectedCycleId}
              onNodeClick={setSource}
              width={graphSize.w}
              height={graphSize.h}
            />
          ) : (
            <div className="h-[500px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
              {loading ? (
                <>
                  <div className="w-10 h-10 rounded-full border-2 border-muted border-t-amber-500 animate-spin" />
                  <span className="text-sm">Fetching exchange rates...</span>
                </>
              ) : (
                <span className="text-sm">Graph will appear here</span>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Threshold slider */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-medium">Profit Threshold</span>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Minimum net gain to flag
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono tabular-nums">
                  {threshold.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground ml-0.5">%</span>
              </div>
            </div>
            <Slider
              min={0}
              max={5}
              step={0.1}
              value={[threshold]}
              onValueChange={(vals) => setThreshold(Array.isArray(vals) ? vals[0] : vals)}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Accounts for real-world FX spreads and transaction costs.
            </p>
          </div>

          {/* Cycle list */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Detected Cycles</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed -mt-1">
              Each cycle is a loop of currencies where converting through the chain yields more than you started with. Click a cycle to see the step-by-step Bellman-Ford analysis.
            </p>
            <div className="flex items-center justify-between">
              <Badge
                variant={filteredCycles.length > 0 ? "default" : "outline"}
                className={filteredCycles.length > 0 ? "bg-amber-500/15 text-amber-400 border-amber-500/25" : ""}
              >
                {filteredCycles.length}
              </Badge>
            </div>

            {loading && (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted/50 rounded-xl shimmer" />
                ))}
              </div>
            )}

            {!loading && filteredCycles.length === 0 && (
              <div className="py-8 text-center animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <ScanLine className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  No cycles above {threshold.toFixed(1)}%
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground/70 leading-relaxed max-w-[240px] mx-auto">
                  Real FX markets rarely show arbitrage. Try the{" "}
                  <a href="/sandbox" className="text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2">
                    sandbox
                  </a>{" "}
                  to plant a cycle manually.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {filteredCycles.map((cycle, i) => (
                <div key={cycle.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <CycleCard
                    cycle={cycle}
                    variant="compact"
                    isSelected={selectedCycleId === cycle.id}
                    onClick={() => {
                      setSelectedCycleId(cycle.id);
                      router.push(`/scan/${encodeURIComponent(cycle.id)}`);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
