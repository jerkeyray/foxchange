"use client";

import { useState } from "react";
import { Plus, Trash2, Download, Upload } from "lucide-react";
import type { Graph } from "@/types/graph";
import { buildGraph } from "@/lib/graph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  // Parse initialRates into flat row list
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

  // All unique nodes in current rows
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
    if (from === to) return setError("From and To must be different");
    if (!isFinite(rate) || rate <= 0) return setError("Rate must be a positive number");
    if (rows.some((r) => r.from === from && r.to === to))
      return setError(`Edge ${from}→${to} already exists`);

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
    const json = JSON.stringify(matrix, null, 2);
    navigator.clipboard.writeText(json);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Nodes</span>
          <Badge variant="outline" className="font-mono text-xs">
            {nodes.length}
          </Badge>
          <span className="text-sm font-medium">Edges</span>
          <Badge variant="outline" className="font-mono text-xs">
            {rows.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleExport} title="Copy JSON">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleImport} title="Import JSON">
            <Upload className="w-3.5 h-3.5" />
          </Button>
          <button
            onClick={() => setShowWeights((p) => !p)}
            className="px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {showWeights ? "Show rates" : "Show −log(w)"}
          </button>
        </div>
      </div>

      {/* Edge list */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No edges yet. Add one below.
          </p>
        )}
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="font-mono text-muted-foreground w-20 shrink-0">
              {row.from} → {row.to}
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
              className="w-24 text-right bg-muted rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 ml-auto text-muted-foreground hover:text-destructive"
              onClick={() => removeEdge(i)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      {/* Add edge form */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          Add Edge
        </p>
        <div className="flex gap-2">
          <input
            placeholder="From"
            value={newFrom}
            onChange={(e) => setNewFrom(e.target.value.toUpperCase())}
            className="flex-1 bg-muted rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring uppercase"
            maxLength={5}
          />
          <input
            placeholder="To"
            value={newTo}
            onChange={(e) => setNewTo(e.target.value.toUpperCase())}
            className="flex-1 bg-muted rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring uppercase"
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
            className="w-24 bg-muted rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button size="sm" onClick={addEdge} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
