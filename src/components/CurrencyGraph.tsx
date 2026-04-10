"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { BFStep, CycleResult, Graph } from "@/types/graph";
import { CURRENCY_MAP } from "@/lib/currencies";

interface Props {
  graph: Graph;
  cycles?: CycleResult[];
  highlightCycleId?: string | null;
  onNodeClick?: (node: string) => void;
  width?: number;
  height?: number;
  currentStep?: BFStep | null;
}

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  from: string;
  to: string;
  rawRate: number;
  weight: number;
}

export function CurrencyGraph({
  graph,
  cycles = [],
  highlightCycleId = null,
  onNodeClick,
  width = 600,
  height = 500,
  currentStep = null,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const linkRef = useRef<d3.Selection<SVGPathElement, D3Link, SVGGElement, unknown> | null>(null);
  const nodeRef = useRef<d3.Selection<SVGGElement, D3Node, SVGGElement, unknown> | null>(null);
  const highlightedEdgeSetRef = useRef<Set<string>>(new Set());
  const cyclePathSetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const pad = 60;

    const highlightedCycle = highlightCycleId
      ? cycles.find((c) => c.id === highlightCycleId)
      : null;

    const highlightedEdgeSet = new Set<string>();
    const cyclePathSet = new Set<string>();
    if (highlightedCycle) {
      const path = highlightedCycle.path;
      for (let i = 0; i < path.length - 1; i++) {
        highlightedEdgeSet.add(`${path[i]}>${path[i + 1]}`);
      }
      for (const node of path) cyclePathSet.add(node);
    }
    highlightedEdgeSetRef.current = highlightedEdgeSet;
    cyclePathSetRef.current = cyclePathSet;

    const nodes: D3Node[] = graph.nodes.map((id) => ({ id }));
    const links: D3Link[] = graph.edges.map((e) => ({
      source: e.from,
      target: e.to,
      from: e.from,
      to: e.to,
      rawRate: e.rawRate,
      weight: e.weight,
    }));

    const defs = svg.append("defs");

    // Glow filter for highlighted edges
    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    const glowMerge = glowFilter.append("feMerge");
    glowMerge.append("feMergeNode").attr("in", "blur");
    glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Node glow filter
    const nodeGlow = defs.append("filter").attr("id", "node-glow");
    nodeGlow
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    const nodeGlowMerge = nodeGlow.append("feMerge");
    nodeGlowMerge.append("feMergeNode").attr("in", "blur");
    nodeGlowMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow markers — simple V shape that sits naturally on the line end
    const makeMarker = (id: string, color: string) => {
      const m = defs
        .append("marker")
        .attr("id", id)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 38)
        .attr("refY", 0)
        .attr("markerWidth", 8)
        .attr("markerHeight", 8)
        .attr("orient", "auto");
      m.append("path")
        .attr("d", "M0,-4L8,0L0,4")
        .attr("fill", color)
        .attr("opacity", 0.95);
    };
    makeMarker("arrow-default", "oklch(0.55 0.03 260)");
    makeMarker("arrow-gain", "#10b981");
    makeMarker("arrow-loss", "#ef4444");
    makeMarker("arrow-highlight", "#f59e0b");
    makeMarker("arrow-active", "#3b82f6");
    makeMarker("arrow-relaxed", "#22c55e");

    // Scale forces based on node count for better spacing
    const n = nodes.length;
    const linkDist = Math.max(200, Math.min(300, width / (n * 0.5)));

    const simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(linkDist)
      )
      .force("charge", d3.forceManyBody().strength(-1200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(80))
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05));

    const linkGroup = svg.append("g");

    const link = linkGroup
      .selectAll<SVGPathElement, D3Link>("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("data-key", (d) => `${d.from}>${d.to}`);

    applyEdgeBaseStyle(link, highlightedEdgeSet);
    linkRef.current = link;

    // Edge rate labels — show all when no cycle highlighted, only cycle edges otherwise
    const labelLinks = highlightedEdgeSet.size === 0
      ? links
      : links.filter((d) => highlightedEdgeSet.has(`${d.from}>${d.to}`));

    const edgeLabelGroup = svg.append("g");
    const edgeLabel = edgeLabelGroup
      .selectAll<SVGGElement, D3Link>("g")
      .data(labelLinks)
      .join("g");

    edgeLabel
      .append("rect")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", "var(--background, #0f172a)")
      .attr("fill-opacity", 0.92)
      .attr("stroke", (d) => {
        const key = `${d.from}>${d.to}`;
        if (highlightedEdgeSet.has(key)) return "#f59e0b";
        return strokeFromRate(d.rawRate, 0.4);
      })
      .attr("stroke-width", 1);

    edgeLabel
      .append("text")
      .attr("font-size", "11px")
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("font-weight", 600)
      .attr("fill", (d) => {
        const key = `${d.from}>${d.to}`;
        if (highlightedEdgeSet.has(key)) return "#fbbf24";
        return textFromRate(d.rawRate);
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text((d) => formatRateLabel(d.rawRate));

    // Nodes
    const nodeGroup = svg.append("g");
    const node = nodeGroup
      .selectAll<SVGGElement, D3Node>("g")
      .data(nodes)
      .join("g")
      .style("cursor", onNodeClick ? "pointer" : "default")
      .on("click", (_, d) => onNodeClick?.(d.id));

    // Outer glow ring for highlighted cycle / active step
    node
      .append("circle")
      .attr("class", "node-outer")
      .attr("r", 42)
      .attr("fill", (d) => {
        if (!highlightedCycle) return "transparent";
        return highlightedCycle.path.includes(d.id)
          ? `${CURRENCY_MAP[d.id]?.color ?? "#f59e0b"}20`
          : "transparent";
      })
      .attr("filter", (d) => {
        if (!highlightedCycle) return "";
        return highlightedCycle.path.includes(d.id) ? "url(#node-glow)" : "";
      });

    // Main node circle
    node
      .append("circle")
      .attr("class", "node-main")
      .attr("r", 32)
      .attr("fill", (d) => CURRENCY_MAP[d.id]?.color ?? "#475569")
      .attr("fill-opacity", 0.9);
    applyNodeBaseStroke(node, highlightedCycle);

    // Currency code
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "14px")
      .attr("font-weight", "700")
      .attr("letter-spacing", "0.05em")
      .attr("fill", "white")
      .style("pointer-events", "none")
      .text((d) => d.id);

    // Flag below
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 48)
      .attr("font-size", "20px")
      .style("pointer-events", "none")
      .text((d) => CURRENCY_MAP[d.id]?.flag ?? "");

    // Distance label above (initially empty — populated by step effect)
    node
      .append("rect")
      .attr("class", "dist-bg")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "var(--background, #0f172a)")
      .attr("fill-opacity", 0)
      .attr("stroke", "oklch(0.5 0.05 70)")
      .attr("stroke-opacity", 0)
      .style("pointer-events", "none");

    node
      .append("text")
      .attr("class", "dist-label")
      .attr("text-anchor", "middle")
      .attr("y", -42)
      .attr("font-size", "11px")
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("font-weight", "600")
      .attr("fill", "oklch(0.85 0.08 70)")
      .attr("fill-opacity", 0)
      .style("pointer-events", "none")
      .text("");

    nodeRef.current = node;

    // Legend
    const legend = svg.append("g").attr("transform", "translate(12, 12)");
    legend.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", 200).attr("height", 72)
      .attr("rx", 8)
      .attr("fill", "var(--background, #0f172a)")
      .attr("fill-opacity", 0.8)
      .attr("stroke", "oklch(0.3 0.02 260)")
      .attr("stroke-opacity", 0.4);

    legend.append("circle").attr("cx", 18).attr("cy", 16).attr("r", 6).attr("fill", "#3b82f6").attr("fill-opacity", 0.9);
    legend.append("text").attr("x", 32).attr("y", 16).attr("font-size", "10px").attr("fill", "oklch(0.6 0.02 260)").attr("dominant-baseline", "central").text("Currency (click to set source)");

    legend.append("line").attr("x1", 12).attr("y1", 36).attr("x2", 24).attr("y2", 36).attr("stroke", "oklch(0.45 0.02 260)").attr("stroke-width", 1.5);
    legend.append("text").attr("x", 32).attr("y", 36).attr("font-size", "10px").attr("fill", "oklch(0.6 0.02 260)").attr("dominant-baseline", "central").text("Exchange rate (directed)");

    legend.append("line").attr("x1", 12).attr("y1", 56).attr("x2", 24).attr("y2", 56).attr("stroke", "#f59e0b").attr("stroke-width", 2.5);
    legend.append("text").attr("x", 32).attr("y", 56).attr("font-size", "10px").attr("fill", "#fbbf24").attr("dominant-baseline", "central").text("Arbitrage cycle (negative)");

    // Drag
    node.call(
      d3
        .drag<SVGGElement, D3Node>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    // Tick
    simulation.on("tick", () => {
      nodes.forEach((d) => {
        d.x = Math.max(pad, Math.min(width - pad, d.x ?? width / 2));
        d.y = Math.max(pad, Math.min(height - pad, d.y ?? height / 2));
      });

      link.attr("d", (d) => {
        const sx = (d.source as D3Node).x ?? 0;
        const sy = (d.source as D3Node).y ?? 0;
        const tx = (d.target as D3Node).x ?? 0;
        const ty = (d.target as D3Node).y ?? 0;
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.5;
        return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
      });

      edgeLabel.attr("transform", (d) => {
        const sx = (d.source as D3Node).x ?? 0;
        const sy = (d.source as D3Node).y ?? 0;
        const tx = (d.target as D3Node).x ?? 0;
        const ty = (d.target as D3Node).y ?? 0;
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        const dx = tx - sx;
        const dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ox = (-dy / len) * 20;
        const oy = (dx / len) * 20;
        return `translate(${mx + ox},${my + oy})`;
      });

      edgeLabel.each(function () {
        const g = d3.select(this);
        const text = g.select("text");
        const rect = g.select("rect");
        const bbox = (text.node() as SVGTextElement)?.getBBox();
        if (bbox) {
          rect
            .attr("x", bbox.x - 4)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 4);
        }
      });

      // Size distance label backgrounds
      node.each(function () {
        const g = d3.select(this);
        const text = g.select<SVGTextElement>("text.dist-label");
        const rect = g.select("rect.dist-bg");
        const t = text.node();
        if (t && text.text()) {
          const bbox = t.getBBox();
          rect
            .attr("x", bbox.x - 4)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 4);
        }
      });

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
      linkRef.current = null;
      nodeRef.current = null;
    };
  }, [graph, cycles, highlightCycleId, onNodeClick, width, height]);

  // Effect: animate based on currentStep
  useEffect(() => {
    const link = linkRef.current;
    const node = nodeRef.current;
    if (!link || !node) return;

    const highlightedEdgeSet = highlightedEdgeSetRef.current;
    const activeKey = currentStep ? `${currentStep.edge.from}>${currentStep.edge.to}` : null;
    const updatedNode = currentStep?.updated ?? null;

    // Reset all edges to base style first
    applyEdgeBaseStyle(link, highlightedEdgeSet);

    // Overlay active edge style
    if (activeKey) {
      link.filter(function () {
        return d3.select(this).attr("data-key") === activeKey;
      }).each(function () {
        const sel = d3.select(this);
        const relaxed = currentStep!.relaxed;
        sel
          .attr("stroke", relaxed ? "#22c55e" : "#3b82f6")
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 3.5)
          .attr("marker-end", relaxed ? "url(#arrow-relaxed)" : "url(#arrow-active)")
          .attr("filter", "url(#glow)")
          .attr("class", "");
      });
    }

    // Update distance labels
    if (currentStep) {
      node.select<SVGTextElement>("text.dist-label")
        .attr("fill-opacity", 1)
        .attr("fill", (d) => {
          const dn = d as D3Node;
          if (updatedNode === dn.id) return "#22c55e";
          return "oklch(0.85 0.08 70)";
        })
        .text((d) => {
          const dn = d as D3Node;
          const v = currentStep.distances[dn.id];
          if (v == null || !isFinite(v)) return "\u221e";
          return v.toFixed(2);
        });
      node.select("rect.dist-bg")
        .attr("fill-opacity", 0.85)
        .attr("stroke-opacity", (d) => {
          const dn = d as D3Node;
          return updatedNode === dn.id ? 0.8 : 0.3;
        })
        .attr("stroke", (d) => {
          const dn = d as D3Node;
          return updatedNode === dn.id ? "#22c55e" : "oklch(0.5 0.05 70)";
        });

      // Trigger tick to size the new label backgrounds
      node.each(function () {
        const g = d3.select(this);
        const text = g.select<SVGTextElement>("text.dist-label");
        const rect = g.select("rect.dist-bg");
        const t = text.node();
        if (t && text.text()) {
          const bbox = t.getBBox();
          rect
            .attr("x", bbox.x - 4)
            .attr("y", bbox.y - 2)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 4);
        }
      });
    } else {
      node.select("text.dist-label").attr("fill-opacity", 0).text("");
      node.select("rect.dist-bg").attr("fill-opacity", 0).attr("stroke-opacity", 0);
    }
  }, [currentStep]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="w-full h-full"
      viewBox={`0 0 ${width} ${height}`}
    />
  );
}

function applyEdgeBaseStyle(
  link: d3.Selection<SVGPathElement, D3Link, SVGGElement, unknown>,
  highlightedEdgeSet: Set<string>
) {
  link
    .attr("stroke", (d) => {
      const key = `${d.from}>${d.to}`;
      if (highlightedEdgeSet.has(key)) return "#f59e0b";
      return strokeFromRate(d.rawRate, 1);
    })
    .attr("stroke-width", (d) => {
      const key = `${d.from}>${d.to}`;
      return highlightedEdgeSet.has(key) ? 3 : 1.5;
    })
    .attr("stroke-opacity", (d) => {
      if (highlightedEdgeSet.size === 0) return 0.55;
      const key = `${d.from}>${d.to}`;
      return highlightedEdgeSet.has(key) ? 1 : 0.12;
    })
    .attr("marker-end", (d) => {
      const key = `${d.from}>${d.to}`;
      if (highlightedEdgeSet.has(key)) return "url(#arrow-highlight)";
      return markerFromRate(d.rawRate);
    })
    .attr("filter", (d) => {
      const key = `${d.from}>${d.to}`;
      return highlightedEdgeSet.has(key) ? "url(#glow)" : "";
    })
    .attr("class", (d) => {
      const key = `${d.from}>${d.to}`;
      return highlightedEdgeSet.has(key) ? "cycle-edge-pulse" : "";
    });
}

// Rates near parity (0.5 to 2) get green/red gain/loss styling.
// Cross-currency rates (like USD↔INR) get neutral styling because per-edge
// "gain/loss" is meaningless when one currency is denominated very differently.
const NEAR_PARITY_MIN = 0.5;
const NEAR_PARITY_MAX = 2;

function isNearParity(rate: number) {
  return rate >= NEAR_PARITY_MIN && rate <= NEAR_PARITY_MAX;
}

function strokeFromRate(rate: number, alpha: number) {
  if (!isNearParity(rate)) {
    return alpha === 1 ? "oklch(0.5 0.02 260)" : `oklch(0.5 0.02 260 / ${alpha})`;
  }
  if (rate >= 1) return alpha === 1 ? "#10b981" : `#10b981${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
  return alpha === 1 ? "#ef4444" : `#ef4444${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
}

function markerFromRate(rate: number) {
  if (!isNearParity(rate)) return "url(#arrow-default)";
  return rate >= 1 ? "url(#arrow-gain)" : "url(#arrow-loss)";
}

function textFromRate(rate: number) {
  if (!isNearParity(rate)) return "oklch(0.7 0.02 260)";
  return rate >= 1 ? "#34d399" : "#f87171";
}

function formatRateLabel(rate: number) {
  if (!isNearParity(rate)) {
    // Cross-currency: just show the rate, no meaningless percentage
    return rate < 0.01 ? rate.toFixed(5) : rate.toFixed(rate < 1 ? 4 : 2);
  }
  const sign = rate >= 1 ? "+" : "";
  const pct = ((rate - 1) * 100).toFixed(2);
  return `${rate.toFixed(4)}  ${sign}${pct}%`;
}

function applyNodeBaseStroke(
  node: d3.Selection<SVGGElement, D3Node, SVGGElement, unknown>,
  highlightedCycle: CycleResult | null | undefined
) {
  node.select("circle.node-main")
    .attr("stroke", (d) => {
      const dn = d as D3Node;
      if (!highlightedCycle) return `${CURRENCY_MAP[dn.id]?.color ?? "#475569"}40`;
      return highlightedCycle.path.includes(dn.id)
        ? "#f59e0b"
        : `${CURRENCY_MAP[dn.id]?.color ?? "#475569"}20`;
    })
    .attr("stroke-width", (d) => {
      const dn = d as D3Node;
      if (!highlightedCycle) return 2;
      return highlightedCycle.path.includes(dn.id) ? 2.5 : 1;
    });
}
