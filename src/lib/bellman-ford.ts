import type { BFResult, BFStep, CycleResult, Graph } from "@/types/graph";
import { computeProfit, hashCyclePath } from "./graph";

const INF = Infinity;

interface BFOptions {
  /** Record every edge relaxation attempt for animation playback */
  instrument?: boolean;
}

/**
 * Run Bellman-Ford from a source node.
 *
 * The twist: on the V-th pass (standard error condition),
 * we trace back through the predecessor array to reconstruct
 * every negative cycle reachable from the source.
 */
export function runBellmanFord(
  graph: Graph,
  source: string,
  options: BFOptions = {}
): BFResult {
  const { nodes, edges } = graph;
  const V = nodes.length;

  const dist: Record<string, number> = {};
  const pred: Record<string, string | null> = {};

  for (const n of nodes) {
    dist[n] = INF;
    pred[n] = null;
  }
  dist[source] = 0;

  const steps: BFStep[] = [];

  // V-1 relaxation passes
  for (let i = 0; i < V - 1; i++) {
    for (let ei = 0; ei < edges.length; ei++) {
      const edge = edges[ei];
      const { from, to, weight } = edge;
      if (dist[from] === INF) {
        if (options.instrument) {
          steps.push({
            iteration: i,
            edgeIndex: ei,
            edge,
            relaxed: false,
            distances: { ...dist },
          });
        }
        continue;
      }
      const newDist = dist[from] + weight;
      const relaxed = newDist < dist[to];
      if (relaxed) {
        dist[to] = newDist;
        pred[to] = from;
      }
      if (options.instrument) {
        steps.push({
          iteration: i,
          edgeIndex: ei,
          edge,
          relaxed,
          distances: { ...dist },
          updated: relaxed ? to : undefined,
        });
      }
    }
  }

  // V-th pass: detect negative cycles
  const cycleNodes = new Set<string>();
  for (const edge of edges) {
    const { from, to, weight } = edge;
    if (dist[from] !== INF && dist[from] + weight < dist[to]) {
      cycleNodes.add(to);
    }
  }

  // Reconstruct each unique cycle
  const seenIds = new Set<string>();
  const cycles: CycleResult[] = [];

  for (const startNode of cycleNodes) {
    const cycle = traceCycle(pred, startNode, V);
    if (!cycle) continue;

    const id = hashCyclePath(cycle);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Collect per-hop rates
    const rates: number[] = [];
    const edgeWeights: number[] = [];
    const loop = cycle.slice(0, -1); // without closing duplicate
    for (let i = 0; i < loop.length; i++) {
      const from = loop[i];
      const to = loop[(i + 1) % loop.length];
      const e = graph.edges.find((e) => e.from === from && e.to === to);
      if (e) {
        rates.push(e.rawRate);
        edgeWeights.push(e.weight);
      }
    }

    const profitPct = computeProfit(rates) * 100;

    cycles.push({ id, path: cycle, profitPct, rates, edgeWeights });
  }

  return {
    distances: dist,
    predecessors: pred,
    cycles,
    steps,
  };
}

/**
 * Walk the predecessor chain back from `startNode` to find the cycle.
 * Returns path with the cycle start node appended at the end to close it,
 * e.g. ["USD", "EUR", "JPY", "USD"].
 */
function traceCycle(
  pred: Record<string, string | null>,
  startNode: string,
  maxSteps: number
): string[] | null {
  // Walk back `maxSteps` times to ensure we're inside the cycle
  let current = startNode;
  for (let i = 0; i < maxSteps; i++) {
    const p = pred[current];
    if (p === null) return null;
    current = p;
  }

  // Now trace the cycle itself.
  // Following pred[v] goes BACKWARD (pred[v]=u means edge u→v).
  // We collect the backward chain and then wrap with cycleStart to get
  // the forward cycle: [cycleStart, ..., cycleStart].
  const cycleStart = current;
  const path: string[] = [];
  let node: string | null = pred[cycleStart];

  let safety = 0;
  while (node !== null && node !== cycleStart && safety < maxSteps) {
    path.unshift(node);
    node = pred[node];
    safety++;
  }

  if (node !== cycleStart) return null; // failed to close the loop

  // Wrap: prepend cycleStart as the start, append as the closing node
  path.unshift(cycleStart);
  path.push(cycleStart);
  return path;
}

/**
 * Run BF from every node as source to discover all negative cycles
 * in the graph (a single-source run may miss cycles in disconnected components).
 */
export function findAllCycles(graph: Graph): CycleResult[] {
  const seenIds = new Set<string>();
  const allCycles: CycleResult[] = [];

  for (const source of graph.nodes) {
    const { cycles } = runBellmanFord(graph, source);
    for (const cycle of cycles) {
      if (!seenIds.has(cycle.id)) {
        seenIds.add(cycle.id);
        allCycles.push(cycle);
      }
    }
  }

  return allCycles.sort((a, b) => b.profitPct - a.profitPct);
}
