import { describe, expect, it } from "vitest";
import { buildGraph, computeProfit, hashCyclePath, rateFromWeight } from "../graph";

describe("buildGraph", () => {
  it("applies -log transform to rates", () => {
    const rates = { USD: { EUR: 0.9 }, EUR: { USD: 1 / 0.9 } };
    const graph = buildGraph(rates);
    expect(graph.nodes).toContain("USD");
    expect(graph.nodes).toContain("EUR");
    const usdEur = graph.edges.find((e) => e.from === "USD" && e.to === "EUR");
    expect(usdEur).toBeDefined();
    expect(usdEur!.weight).toBeCloseTo(-Math.log(0.9), 10);
    expect(usdEur!.rawRate).toBe(0.9);
  });

  it("excludes self-edges", () => {
    const rates = { USD: { USD: 1, EUR: 0.9 }, EUR: { USD: 1.1 } };
    const graph = buildGraph(rates);
    expect(graph.edges.every((e) => e.from !== e.to)).toBe(true);
  });
});

describe("rateFromWeight", () => {
  it("is inverse of -log transform", () => {
    const rate = 0.85;
    const weight = -Math.log(rate);
    expect(rateFromWeight(weight)).toBeCloseTo(rate, 10);
  });
});

describe("computeProfit", () => {
  it("returns 0 for balanced rates", () => {
    expect(computeProfit([1, 1, 1])).toBeCloseTo(0);
  });

  it("returns positive profit for arbitrage cycle", () => {
    // 0.9 * 0.8 * 1.5 = 1.08 → 8% profit
    expect(computeProfit([0.9, 0.8, 1.5])).toBeCloseTo(0.08, 5);
  });
});

describe("hashCyclePath", () => {
  it("produces same hash for rotated paths", () => {
    const h1 = hashCyclePath(["USD", "EUR", "JPY", "USD"]);
    const h2 = hashCyclePath(["EUR", "JPY", "USD", "EUR"]);
    const h3 = hashCyclePath(["JPY", "USD", "EUR", "JPY"]);
    expect(h1).toBe(h2);
    expect(h2).toBe(h3);
  });

  it("produces different hashes for different cycles", () => {
    const h1 = hashCyclePath(["USD", "EUR", "JPY", "USD"]);
    const h2 = hashCyclePath(["USD", "GBP", "JPY", "USD"]);
    expect(h1).not.toBe(h2);
  });
});
