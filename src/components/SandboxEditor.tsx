"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, Upload } from "lucide-react";
import type { Graph } from "@/types/graph";
import { buildGraph } from "@/lib/graph";
import { Button } from "@/components/ui/button";

interface RateRow {
  from: string;
  to: string;
  rate: number;
}

interface Props {
  onGraphChange: (graph: Graph) => void;
  initialRates?: Record<string, Record<string, number>>;
}

export function SandboxEditor({ onGraphChange, initialRates = {} }: Props) {
  const initRows: RateRow[] = [];
  for (const [from, targets] of Object.entries(initialRates)) {
    for (const [to, rate] of Object.entries(targets)) {
      initRows.push({ from, to, rate });
    }
  }

  const [rows, setRows] = useState<RateRow[]>(initRows);
  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newRate, setNewRate] = useState("");
  const [showWeights, setShowWeights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nodes = [...new Set(rows.flatMap((r) => [r.from, r.to]))].sort();

  function rebuildGraph(updatedRows: RateRow[]) {
    const matrix: Record<string, Record<string, number>> = {};
    for (const row of updatedRows) {
      if (!matrix[row.from]) matrix[row.from] = {};
      matrix[row.from][row.to] = row.rate;
    }
    onGraphChange(buildGraph(matrix));
  }

  function addEdge() {
    setError(null);
    const from = newFrom.trim().toUpperCase();
    const to = newTo.trim().toUpperCase();
    const rate = parseFloat(newRate);

    if (!from || !to) return setError("Enter both currencies");
    if (from === to) return setError("From and To must differ");
    if (!isFinite(rate) || rate <= 0) return setError("Rate must be positive");
    if (rows.some((r) => r.from === from && r.to === to))
      return setError(`${from}→${to} already exists`);

    const updated = [...rows, { from, to, rate }];
    setRows(updated);
    rebuildGraph(updated);
    setNewFrom("");
    setNewTo("");
    setNewRate("");
  }

  function removeEdge(i: number) {
    const updated = rows.filter((_, idx) => idx !== i);
    setRows(updated);
    rebuildGraph(updated);
  }

  function updateRate(i: number, rate: number) {
    const updated = rows.map((r, idx) => (idx === i ? { ...r, rate } : r));
    setRows(updated);
    rebuildGraph(updated);
  }

  function handleExport() {
    const matrix: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      if (!matrix[row.from]) matrix[row.from] = {};
      matrix[row.from][row.to] = row.rate;
    }
    navigator.clipboard.writeText(JSON.stringify(matrix, null, 2));
  }

  function handleImport() {
    const text = prompt("Paste JSON rate matrix:");
    if (!text) return;
    try {
      const matrix = JSON.parse(text) as Record<string, Record<string, number>>;
      const imported: RateRow[] = [];
      for (const [from, targets] of Object.entries(matrix)) {
        for (const [to, rate] of Object.entries(targets)) {
          imported.push({ from, to, rate: Number(rate) });
        }
      }
      setRows(imported);
      rebuildGraph(imported);
    } catch {
      setError("Invalid JSON");
    }
  }

  return (
    <div className="space-y-3 min-w-0">
      {/* Stats + actions */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
          <span>{nodes.length} nodes</span>
          <span>{rows.length} edges</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => setShowWeights((p) => !p)}
            className="px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-mono"
            title={showWeights ? "Showing -log(rate). Click for raw rates." : "Showing raw rates. Click for -log(rate)."}
          >
            {showWeights ? "-log(w)" : "rate"}
          </button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleExport} title="Copy as JSON">
            <Copy className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleImport} title="Import JSON">
            <Upload className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Edge list */}
      <div className="rounded-lg border border-border/60 bg-muted/20 max-h-64 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">
            No edges yet. Add one below.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((row, i) => (
              <li key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-2.5 py-1.5 group">
                <span className="font-mono text-xs text-foreground/80 truncate min-w-0">
                  {row.from}<span className="text-muted-foreground/60 mx-0.5">→</span>{row.to}
                </span>
                <input
                  type="number"
                  min={0.001}
                  step={0.001}
                  value={showWeights ? parseFloat((-Math.log(row.rate)).toFixed(6)) : row.rate}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isFinite(v) || v <= 0) return;
                    updateRate(i, showWeights ? Math.exp(-v) : v);
                  }}
                  className="w-[84px] text-right bg-background border border-border/60 focus:border-ring rounded px-2 py-0.5 text-xs font-mono focus:outline-none tabular-nums"
                />
                <button
                  className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  onClick={() => removeEdge(i)}
                  title="Remove edge"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add edge */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_1fr_84px_auto] gap-1.5 items-center">
          <input
            placeholder="From"
            value={newFrom}
            onChange={(e) => setNewFrom(e.target.value.toUpperCase())}
            className="bg-muted/60 border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring/50 uppercase placeholder:text-muted-foreground/40 min-w-0"
            maxLength={5}
          />
          <input
            placeholder="To"
            value={newTo}
            onChange={(e) => setNewTo(e.target.value.toUpperCase())}
            className="bg-muted/60 border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring/50 uppercase placeholder:text-muted-foreground/40 min-w-0"
            maxLength={5}
          />
          <input
            placeholder="Rate"
            type="number"
            step={0.01}
            min={0.001}
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEdge()}
            className="bg-muted/60 border border-border rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring/50 placeholder:text-muted-foreground/40 min-w-0"
          />
          <Button size="icon" onClick={addEdge} className="h-[30px] w-[30px] shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    </div>
  );
}
