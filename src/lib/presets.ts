import type { Graph } from "@/types/graph";
import { buildGraph } from "./graph";

// Classic 3-node triangle arbitrage with real currencies (USD / EUR / INR).
// Realistic-looking but mispriced quotes — the kind of spread an HFT bot would
// pounce on within milliseconds. Forward loop USD → EUR → INR → USD:
// 0.92 × 91.20 × 0.0125 ≈ 1.0488  →  +4.88% profit
// Reverse direction is unprofitable, so only the forward cycle is detected.
const triangleRates = {
  USD: { EUR: 0.92, INR: 83.5 },
  EUR: { USD: 1.085, INR: 91.2 },
  INR: { USD: 0.0125, EUR: 0.01085 },
};

// 4-node graph with a planted ~8% arbitrage cycle A→B→C→A
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
  triangle: {
    label: "Triangle Arbitrage",
    description: "USD → EUR → GBP → USD with a planted 2% arbitrage cycle",
    graph: buildGraph(triangleRates),
    rates: triangleRates,
  },
  textbook: {
    label: "Textbook (4 nodes)",
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
