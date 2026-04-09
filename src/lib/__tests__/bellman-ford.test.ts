import { describe, expect, it } from "vitest";
import { findAllCycles, runBellmanFord } from "../bellman-ford";
import { buildGraph } from "../graph";

// Graph with a known 8% arbitrage: USD→EUR→GBP→USD
// 0.9 * 0.8 * 1.5 = 1.08
const arbitrageRates = {
  USD: { EUR: 0.9, GBP: 0.7 },
  EUR: { USD: 1.05, GBP: 0.8 },
  GBP: { USD: 1.5, EUR: 1.2 },
};

// Balanced graph — no arbitrage
const balancedRates = {
  A: { B: 2.0, C: 0.5 },
  B: { A: 0.5, C: 0.25 },
  C: { A: 2.0, B: 4.0 },
};

describe("runBellmanFord — arbitrage graph", () => {
  const graph = buildGraph(arbitrageRates);

  it("detects at least one negative cycle", () => {
    const result = runBellmanFord(graph, "USD");
    expect(result.cycles.length).toBeGreaterThan(0);
  });

  it("cycle profit is positive", () => {
    const result = runBellmanFord(graph, "USD");
    for (const cycle of result.cycles) {
      expect(cycle.profitPct).toBeGreaterThan(0);
    }
  });

  it("cycle path closes the loop", () => {
    const result = runBellmanFord(graph, "USD");
    for (const cycle of result.cycles) {
      const path = cycle.path;
      expect(path[0]).toBe(path[path.length - 1]);
    }
  });

  it("rates array length matches path hops", () => {
    const result = runBellmanFord(graph, "USD");
    for (const cycle of result.cycles) {
      // path has N+1 elements (closing node), rates has N elements
      expect(cycle.rates.length).toBe(cycle.path.length - 1);
    }
  });
});

describe("runBellmanFord — balanced graph", () => {
  it("returns no cycles for balanced rates", () => {
    const graph = buildGraph(balancedRates);
    const result = runBellmanFord(graph, "A");
    expect(result.cycles).toHaveLength(0);
  });
});

describe("runBellmanFord — instrumented mode", () => {
  it("populates steps array", () => {
    const graph = buildGraph(arbitrageRates);
    const result = runBellmanFord(graph, "USD", { instrument: true });
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it("each step has a valid distances snapshot", () => {
    const graph = buildGraph(arbitrageRates);
    const result = runBellmanFord(graph, "USD", { instrument: true });
    for (const step of result.steps) {
      expect(step.distances).toBeDefined();
      for (const node of graph.nodes) {
        expect(step.distances[node]).toBeDefined();
      }
    }
  });
});

describe("findAllCycles", () => {
  it("finds arbitrage cycles from all sources", () => {
    const graph = buildGraph(arbitrageRates);
    const cycles = findAllCycles(graph);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0].profitPct).toBeGreaterThan(0);
  });

  it("deduplicates rotated cycles", () => {
    const graph = buildGraph(arbitrageRates);
    const cycles = findAllCycles(graph);
    const ids = cycles.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("returns empty array for balanced graph", () => {
    const graph = buildGraph(balancedRates);
    const cycles = findAllCycles(graph);
    expect(cycles).toHaveLength(0);
  });

  it("sorts cycles by profit descending", () => {
    const graph = buildGraph(arbitrageRates);
    const cycles = findAllCycles(graph);
    for (let i = 1; i < cycles.length; i++) {
      expect(cycles[i - 1].profitPct).toBeGreaterThanOrEqual(cycles[i].profitPct);
    }
  });
});
