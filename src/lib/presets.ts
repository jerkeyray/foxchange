import type { Graph } from "@/types/graph";
import { buildGraph } from "./graph";

// A 4-node graph with a planted 8% arbitrage cycle: A→B→C→A
// 0.9 * 0.8 * 1.5 = 1.08
const textbookRates = {
  A: { B: 0.9, C: 0.7, D: 1.1 },
  B: { A: 1.05, C: 0.8, D: 0.95 },
  C: { A: 1.5, B: 1.2, D: 0.88 },
  D: { A: 0.92, B: 1.04, C: 1.15 },
};

// Balanced graph — no arbitrage (all cycle products ≈ 1)
const balancedRates = {
  X: { Y: 1.3, Z: 0.75 },
  Y: { X: 0.77, Z: 1.72 },
  Z: { X: 1.33, Y: 0.58 },
};

export const PRESETS = {
  textbook: {
    label: "Textbook Example",
    description: "4-node graph with planted 8% arbitrage cycle A→B→C→A",
    graph: buildGraph(textbookRates),
    rates: textbookRates,
  },
  balanced: {
    label: "No Arbitrage",
    description: "Balanced rates — cycle products ≈ 1, no free lunch",
    graph: buildGraph(balancedRates),
    rates: balancedRates,
  },
} as const;

export type PresetKey = keyof typeof PRESETS;
