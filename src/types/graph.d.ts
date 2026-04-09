export interface Currency {
  code: string;
  label: string;
  flag: string;
  color: string;
}

export interface Edge {
  from: string;
  to: string;
  weight: number; // -log(rawRate)
  rawRate: number;
}

export interface Graph {
  nodes: string[];
  edges: Edge[];
}

export interface CycleResult {
  id: string; // deterministic hash of sorted path
  path: string[]; // e.g. ["USD", "EUR", "JPY", "USD"]
  profitPct: number; // e.g. 0.87 = 0.87%
  rates: number[]; // per-hop raw rates
  edgeWeights: number[]; // per-hop -log weights
}

export interface BFStep {
  iteration: number; // 0-indexed BF pass
  edgeIndex: number; // index into graph.edges
  edge: Edge;
  relaxed: boolean; // did this relaxation update a distance?
  distances: Record<string, number>; // snapshot after this step
  updated?: string; // which node was updated (if relaxed)
}

export interface BFResult {
  distances: Record<string, number>;
  predecessors: Record<string, string | null>;
  cycles: CycleResult[];
  steps: BFStep[]; // populated only in instrumented mode
}

export type RateMatrix = Record<string, Record<string, number>>;

export interface ScanResponse {
  cycles: CycleResult[];
  graph: Graph;
  timestamp: string;
}
