import type { Edge, Graph, RateMatrix } from "@/types/graph";

/**
 * Transform a rate matrix into a weighted directed graph.
 * Edge weight = -log(rate), so a negative cycle ↔ product of rates > 1.
 */
export function buildGraph(rates: RateMatrix): Graph {
  const nodes = Object.keys(rates);
  const edges: Edge[] = [];

  for (const from of nodes) {
    for (const [to, rate] of Object.entries(rates[from])) {
      if (from !== to && rate > 0) {
        edges.push({
          from,
          to,
          weight: -Math.log(rate),
          rawRate: rate,
        });
      }
    }
  }

  return { nodes, edges };
}

/** Inverse of the log transform */
export function rateFromWeight(w: number): number {
  return Math.exp(-w);
}

/**
 * Given an array of per-hop rates along a cycle,
 * returns the net profit as a fraction (0.01 = 1%).
 */
export function computeProfit(rates: number[]): number {
  return rates.reduce((product, r) => product * r, 1) - 1;
}

/**
 * Deterministic ID for a cycle — canonical rotation (smallest node first),
 * then join with ">".
 */
export function hashCyclePath(path: string[]): string {
  // path includes repeated start node at end: ["USD","EUR","JPY","USD"]
  const loop = path.slice(0, -1); // drop the closing duplicate
  const minIdx = loop.indexOf([...loop].sort()[0]);
  const rotated = [...loop.slice(minIdx), ...loop.slice(0, minIdx)];
  return rotated.join(">");
}
