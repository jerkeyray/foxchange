"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Graph } from "@/types/graph";
import { runBellmanFord, findAllCycles } from "@/lib/bellman-ford";
import { SandboxEditor } from "@/components/SandboxEditor";
import { CurrencyGraph } from "@/components/CurrencyGraph";
import { CycleCard } from "@/components/CycleCard";
import { IterationTable } from "@/components/IterationTable";
import { StepTable } from "@/components/StepTable";
import { GraphControls } from "@/components/GraphControls";
import { StepNarrator } from "@/components/StepNarrator";
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer";
import { PRESETS, type PresetKey } from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, FlaskConical, Download, CircleDot, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PRESET: PresetKey = "triangle";
const DEFAULT_GRAPH = PRESETS[DEFAULT_PRESET].graph;
const DEFAULT_SOURCE = DEFAULT_GRAPH.nodes[0] ?? "USD";

export default function SandboxPage() {
  const [graph, setGraph] = useState<Graph>(DEFAULT_GRAPH);
  const [activePreset, setActivePreset] = useState<PresetKey>(DEFAULT_PRESET);
  const [source, setSource] = useState<string>(DEFAULT_SOURCE);
  const [steps, setSteps] = useState(
    runBellmanFord(DEFAULT_GRAPH, DEFAULT_SOURCE, { instrument: true }).steps
  );
  const [cycles, setCycles] = useState(findAllCycles(DEFAULT_GRAPH));
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(
    findAllCycles(DEFAULT_GRAPH)[0]?.id ?? null
  );
  const [hasRun, setHasRun] = useState(true);

  const player = useAnimationPlayer(steps);

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphSize, setGraphSize] = useState({ w: 700, h: 460 });

  useEffect(() => {
    const el = graphContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        setGraphSize({
          w,
          h: Math.max(440, Math.round(w * 0.62)),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function loadPreset(key: PresetKey) {
    const p = PRESETS[key];
    setGraph(p.graph);
    setActivePreset(key);
    const firstNode = p.graph.nodes[0] ?? "A";
    setSource(firstNode);
    const result = runBellmanFord(p.graph, firstNode, { instrument: true });
    setSteps(result.steps);
    const all = findAllCycles(p.graph);
    setCycles(all);
    setSelectedCycleId(all[0]?.id ?? null);
    setHasRun(true);
  }

  async function loadLiveRates() {
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      const g = await import("@/lib/graph").then((m) => m.buildGraph(data.rates));
      setGraph(g);
      setActivePreset("textbook");
      const firstNode = g.nodes[0];
      setSource(firstNode);
      setHasRun(false);
      setCycles([]);
      setSteps([]);
    } catch (e) {
      console.error("Failed to load live rates:", e);
    }
  }

  function runBF() {
    const result = runBellmanFord(graph, source, { instrument: true });
    setSteps(result.steps);
    const all = findAllCycles(graph);
    setCycles(all);
    setSelectedCycleId(all[0]?.id ?? null);
    setHasRun(true);
  }

  const handleGraphChange = useCallback((newGraph: Graph) => {
    setGraph(newGraph);
    setHasRun(false);
    setCycles([]);
    setSteps([]);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-foreground" />
              <h1 className="text-xl font-bold tracking-tight">Sandbox</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Build a custom currency graph, then run Bellman-Ford to detect arbitrage cycles.
            </p>
          </div>
        </div>

        {/* Presets row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Start with:</span>
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                activePreset === key
                  ? "bg-muted border-border text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {PRESETS[key].label}
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={loadLiveRates} className="gap-1.5 h-7 text-xs">
            <Download className="w-3 h-3" />
            Live Rates
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-5">
        {/* Left column: Editor + Run + Results */}
        <div className="space-y-4 min-w-0">
          {/* Step 1: Edit */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-muted text-[10px] font-mono flex items-center justify-center text-muted-foreground">1</span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold">Edit graph</h2>
            </div>
            <div className="p-4">
              <SandboxEditor
                key={activePreset}
                onGraphChange={handleGraphChange}
                initialRates={
                  (activePreset && PRESETS[activePreset as PresetKey]?.rates) || {}
                }
              />
            </div>
          </div>

          {/* Step 2: Run */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-muted text-[10px] font-mono flex items-center justify-center text-muted-foreground">2</span>
              <Play className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="text-xs font-semibold">Run algorithm</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="ml-auto bg-muted border border-border rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring/50"
                >
                  {graph.nodes.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <Button
                onClick={runBF}
                className="w-full gap-2 h-9 text-sm"
                disabled={graph.nodes.length === 0}
              >
                <Play className="w-3.5 h-3.5" /> Run Bellman-Ford
              </Button>
              {!hasRun && graph.nodes.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Graph changed — run again to detect cycles.
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Results */}
          {hasRun && (
            <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
              <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-muted text-[10px] font-mono flex items-center justify-center text-muted-foreground">3</span>
                <CircleDot className="w-3.5 h-3.5 text-muted-foreground" />
                <h2 className="text-xs font-semibold">Cycles found</h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-auto h-5 text-[10px] px-1.5",
                    cycles.length > 0 && "bg-green-500/15 text-green-400 border-green-500/25"
                  )}
                >
                  {cycles.length}
                </Badge>
              </div>
              <div className="p-4 space-y-2">
                {cycles.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No arbitrage in this graph.
                  </p>
                )}
                {cycles.map((c) => (
                  <CycleCard
                    key={c.id}
                    cycle={c}
                    variant="compact"
                    isSelected={selectedCycleId === c.id}
                    onClick={() => setSelectedCycleId(c.id)}
                  />
                ))}
                {cycles.length > 0 && (
                  <p className="text-[11px] text-muted-foreground/80 pt-1 leading-relaxed">
                    Try editing a rate above and re-running — small changes can erase the cycle.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Graph + Animation */}
        <div className="space-y-4 min-w-0">
          <div
            ref={graphContainerRef}
            className="rounded-xl border border-border overflow-hidden graph-container dot-grid min-h-[440px]"
          >
            <CurrencyGraph
              graph={graph}
              cycles={cycles}
              highlightCycleId={selectedCycleId}
              onNodeClick={setSource}
              width={graphSize.w}
              height={graphSize.h}
              currentStep={hasRun && steps.length > 0 ? steps[player.currentIndex] ?? null : null}
            />
          </div>

          {hasRun && steps.length > 0 && (
            <div className="animate-fade-in min-w-0 space-y-3">
              <StepNarrator
                step={steps[player.currentIndex] ?? null}
                currentIndex={player.currentIndex}
                totalSteps={player.totalSteps}
                source={source}
                cycles={cycles}
                numNodes={graph.nodes.length}
              />
              <GraphControls
                currentIndex={player.currentIndex}
                totalSteps={player.totalSteps}
                isPlaying={player.isPlaying}
                speed={player.speed}
                isAtStart={player.isAtStart}
                isAtEnd={player.isAtEnd}
                onPlay={player.play}
                onPause={player.pause}
                onStepForward={player.stepForward}
                onStepBack={player.stepBack}
                onReset={player.reset}
                onSetSpeed={player.setSpeed}
              />
            </div>
          )}
        </div>
      </div>

      {/* Full-width: distance table stacked over convergence plot */}
      {hasRun && steps.length > 0 && (
        <div className="space-y-5 animate-fade-in">
          <IterationTable
            graph={graph}
            steps={steps}
            currentIndex={player.currentIndex}
            source={source}
          />
          <StepTable
            graph={graph}
            steps={steps}
            currentIndex={player.currentIndex}
            source={source}
          />
        </div>
      )}
    </div>
  );
}
