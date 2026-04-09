"use client";

import { useState, useCallback } from "react";
import type { Graph } from "@/types/graph";
import { runBellmanFord, findAllCycles } from "@/lib/bellman-ford";
import { SandboxEditor } from "@/components/SandboxEditor";
import { CurrencyGraph } from "@/components/CurrencyGraph";
import { CycleCard } from "@/components/CycleCard";
import { IterationTable } from "@/components/IterationTable";
import { ConvergencePlot } from "@/components/ConvergencePlot";
import { GraphControls } from "@/components/GraphControls";
import { useAnimationPlayer } from "@/hooks/useAnimationPlayer";
import { PRESETS, type PresetKey } from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, FlaskConical, Sparkles, Download, PenTool, Target, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SandboxPage() {
  const [graph, setGraph] = useState<Graph>(PRESETS.textbook.graph);
  const [activePreset, setActivePreset] = useState<PresetKey>("textbook");
  const [source, setSource] = useState<string>(PRESETS.textbook.graph.nodes[0] ?? "A");
  const [steps, setSteps] = useState(
    runBellmanFord(PRESETS.textbook.graph, "A", { instrument: true }).steps
  );
  const [cycles, setCycles] = useState(findAllCycles(PRESETS.textbook.graph));
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(
    findAllCycles(PRESETS.textbook.graph)[0]?.id ?? null
  );
  const [hasRun, setHasRun] = useState(true);

  const player = useAnimationPlayer(steps);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Graph Sandbox</h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
              Build a custom currency graph, set exchange rates, and run Bellman-Ford to find arbitrage cycles. Start from a preset or create your own.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <button
              key={key}
              onClick={() => loadPreset(key)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border",
                activePreset === key
                  ? "bg-muted border-border text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border"
              )}
            >
              <Sparkles className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              {PRESETS[key].label}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={loadLiveRates} className="gap-1.5 rounded-xl">
            <Download className="w-3.5 h-3.5" />
            Live FX Rates
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* Left: Editor + Controls */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <PenTool className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
                Graph Editor
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
              Add currencies as nodes and exchange rates as directed edges.
              To plant an arbitrage cycle, make the product of rates along a loop greater than 1.0.
            </p>
            <SandboxEditor
              key={activePreset}
              onGraphChange={handleGraphChange}
              initialRates={
                (activePreset && PRESETS[activePreset as PresetKey]?.rates) || {}
              }
            />
          </div>

          {/* BF source + run */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Choose a source node and run Bellman-Ford. Runs from every node internally to find all cycles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Source node</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="ml-auto bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/50"
              >
                {graph.nodes.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={runBF}
              className="w-full gap-2 rounded-xl h-10"
              disabled={graph.nodes.length === 0}
            >
              <Play className="w-4 h-4" /> Run Bellman-Ford
            </Button>
          </div>

          {/* Cycle results */}
          {hasRun && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5" />
                  Detected Cycles
                </span>
                <Badge
                  variant={cycles.length > 0 ? "default" : "outline"}
                  className={cycles.length > 0 ? "bg-green-500/15 text-green-400 border-green-500/25" : ""}
                >
                  {cycles.length}
                </Badge>
              </div>
              {cycles.length === 0 && (
                <p className="text-sm text-muted-foreground py-3 text-center">
                  No arbitrage found in this graph.
                </p>
              )}
              <div className="space-y-2">
                {cycles.map((c) => (
                  <CycleCard
                    key={c.id}
                    cycle={c}
                    variant="compact"
                    isSelected={selectedCycleId === c.id}
                    onClick={() => setSelectedCycleId(c.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Graph + Animation */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border overflow-hidden graph-container dot-grid min-h-[460px] relative">
            <CurrencyGraph
              graph={graph}
              cycles={cycles}
              highlightCycleId={selectedCycleId}
              onNodeClick={setSource}
              width={700}
              height={460}
            />
          </div>

          {hasRun && steps.length > 0 && (
            <div className="animate-fade-in space-y-4">
              <div className="rounded-xl bg-muted/30 border border-border/60 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Step-through playback:</span>{" "}
                Use the controls below to watch Bellman-Ford process each edge one at a time.
                The iteration table shows distance updates, and the convergence plot tracks how distances evolve.
                Press <kbd className="font-mono bg-muted border border-border rounded px-1 py-0.5 text-[10px]">Space</kbd> to play/pause,
                arrow keys to step.
              </div>
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <IterationTable
                  graph={graph}
                  steps={steps}
                  currentIndex={player.currentIndex}
                />
                <ConvergencePlot
                  graph={graph}
                  steps={steps}
                  currentIndex={player.currentIndex}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
