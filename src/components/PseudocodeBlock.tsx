"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pseudocode = [
  { line: "function BellmanFord(G, source):", note: "" },
  { line: "  // Initialize distances", note: "" },
  { line: "  for each node v in G:", note: "" },
  { line: "    dist[v] = ∞", note: "All nodes unreachable at start" },
  { line: "  dist[source] = 0", note: "Source costs nothing to reach" },
  { line: "", note: "" },
  { line: "  // |V|−1 relaxation passes", note: "" },
  { line: "  for i = 1 to |V|−1:", note: "Shortest path has at most |V|−1 edges" },
  { line: "    for each edge (u, v, w) in G:", note: "" },
  { line: "      if dist[u] + w < dist[v]:", note: "Can we improve v's distance via u?" },
  { line: "        dist[v] = dist[u] + w", note: "Relax the edge" },
  { line: "        pred[v] = u", note: "Record the predecessor" },
  { line: "", note: "" },
  { line: "  // |V|-th pass: negative cycle detection ← THE TWIST", note: "Standard BF stops here. We don't." },
  { line: "  for each edge (u, v, w) in G:", note: "" },
  { line: "    if dist[u] + w < dist[v]:", note: "Still relaxing? Must be a negative cycle!" },
  { line: "      cycleNode = v", note: "" },
  { line: "      return traceCycle(pred, cycleNode)", note: "Reconstruct the arbitrage loop" },
  { line: "", note: "" },
  { line: "  return null  // no arbitrage found", note: "" },
];

const typescript = `// The core twist: instead of returning an error on negative cycle,
// we trace the predecessor array to reconstruct the loop.

function runBellmanFord(graph: Graph, source: string): BFResult {
  const dist: Record<string, number> = {};
  const pred: Record<string, string | null> = {};

  // Initialize
  for (const n of graph.nodes) { dist[n] = Infinity; pred[n] = null; }
  dist[source] = 0;

  // V-1 relaxation passes
  for (let i = 0; i < graph.nodes.length - 1; i++) {
    for (const { from, to, weight } of graph.edges) {
      if (dist[from] + weight < dist[to]) {
        dist[to] = dist[from] + weight;
        pred[to] = from;
      }
    }
  }

  // V-th pass: detect & trace negative cycles
  const cycles: CycleResult[] = [];
  for (const { from, to, weight } of graph.edges) {
    if (dist[from] + weight < dist[to]) {
      const cycle = traceCycle(pred, to, graph.nodes.length);
      if (cycle) cycles.push(buildCycleResult(cycle, graph));
    }
  }

  return { distances: dist, predecessors: pred, cycles };
}

// w(u → v) = −log(rate(u, v))
// Negative cycle sum < 0  ⟺  product of rates > 1.0  ⟺  free profit`;

export function PseudocodeBlock() {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const twistedLines = new Set([13, 14, 15, 16, 17]);

  return (
    <Tabs defaultValue="pseudocode">
      <TabsList className="mb-3">
        <TabsTrigger value="pseudocode">Pseudocode</TabsTrigger>
        <TabsTrigger value="typescript">TypeScript</TabsTrigger>
      </TabsList>

      <TabsContent value="pseudocode">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                {pseudocode.map((row, i) => (
                  <tr
                    key={i}
                    onMouseEnter={() => setHoveredLine(i)}
                    onMouseLeave={() => setHoveredLine(null)}
                    className={`${
                      twistedLines.has(i)
                        ? "bg-amber-500/10 hover:bg-amber-500/15"
                        : hoveredLine === i
                        ? "bg-muted/40"
                        : ""
                    } transition-colors`}
                  >
                    <td className="pl-4 pr-3 py-0.5 text-muted-foreground/40 w-8 select-none font-mono text-right">
                      {i + 1}
                    </td>
                    <td
                      className={`pl-0 pr-4 py-0.5 font-mono whitespace-pre ${
                        twistedLines.has(i) ? "text-amber-300" : "text-foreground"
                      }`}
                    >
                      {row.line}
                    </td>
                    <td className="pr-4 py-0.5 text-muted-foreground italic text-right hidden md:table-cell">
                      {row.note && `// ${row.note}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-sm bg-amber-500/30 inline-block" />
            Highlighted lines = the arbitrage twist (not in standard BF)
          </div>
        </div>
      </TabsContent>

      <TabsContent value="typescript">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <pre className="overflow-x-auto p-5 text-xs font-mono leading-relaxed text-foreground">
            {typescript}
          </pre>
        </div>
      </TabsContent>
    </Tabs>
  );
}
