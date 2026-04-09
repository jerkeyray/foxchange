"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { CycleResult, Graph } from "@/types/graph";
import { CURRENCY_MAP } from "@/lib/currencies";

interface Props {
  graph: Graph;
  cycles?: CycleResult[];
  highlightCycleId?: string | null;
  onNodeClick?: (node: string) => void;
  width?: number;
  height?: number;
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
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const pad = 60;

    const highlightedCycle = highlightCycleId
      ? cycles.find((c) => c.id === highlightCycleId)
      : null;

    const highlightedEdgeSet = new Set<string>();
    if (highlightedCycle) {
      const path = highlightedCycle.path;
      for (let i = 0; i < path.length - 1; i++) {
        highlightedEdgeSet.add(`${path[i]}>${path[i + 1]}`);
      }
    }

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

    // Arrow markers
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
        .attr("opacity", 0.8);
    };
    makeMarker("arrow-default", "#475569");
    makeMarker("arrow-highlight", "#f59e0b");

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

    // Use curved paths instead of straight lines
    const linkGroup = svg.append("g");

    const link = linkGroup
      .selectAll<SVGPathElement, D3Link>("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d) => {
        const key = `${d.from}>${d.to}`;
        return highlightedEdgeSet.has(key) ? "#f59e0b" : "oklch(0.45 0.02 260)";
      })
      .attr("stroke-width", (d) => {
        const key = `${d.from}>${d.to}`;
        return highlightedEdgeSet.has(key) ? 2.5 : 1;
      })
      .attr("stroke-opacity", (d) => {
        if (highlightedEdgeSet.size === 0) return 0.4;
        const key = `${d.from}>${d.to}`;
        return highlightedEdgeSet.has(key) ? 1 : 0.1;
      })
      .attr("marker-end", (d) => {
        const key = `${d.from}>${d.to}`;
        return highlightedEdgeSet.has(key) ? "url(#arrow-highlight)" : "url(#arrow-default)";
      })
      .attr("filter", (d) => {
        const key = `${d.from}>${d.to}`;
        return highlightedEdgeSet.has(key) ? "url(#glow)" : "";
      })
      .attr("class", (d) => {
        const key = `${d.from}>${d.to}`;
        return highlightedEdgeSet.has(key) ? "cycle-edge-pulse" : "";
      });

    // Edge rate labels — only for highlighted edges when highlighting, or all edges when not
    const labelLinks = links.filter((d) => {
      const key = `${d.from}>${d.to}`;
      return highlightedEdgeSet.size === 0 || highlightedEdgeSet.has(key);
    });

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
      .attr("fill-opacity", 0.9);

    edgeLabel
      .append("text")
      .attr("font-size", "10px")
      .attr("font-family", "var(--font-mono, monospace)")
      .attr("fill", (d) => {
        const key = `${d.from}>${d.to}`;
        return highlightedEdgeSet.has(key) ? "#fbbf24" : "oklch(0.55 0.02 260)";
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text((d) => d.rawRate.toFixed(4));

    // Nodes
    const nodeGroup = svg.append("g");
    const node = nodeGroup
      .selectAll<SVGGElement, D3Node>("g")
      .data(nodes)
      .join("g")
      .style("cursor", onNodeClick ? "pointer" : "default")
      .on("click", (_, d) => onNodeClick?.(d.id));

    // Node outer glow for highlighted cycle
    node
      .append("circle")
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

    // Node circle
    node
      .append("circle")
      .attr("r", 32)
      .attr("fill", (d) => CURRENCY_MAP[d.id]?.color ?? "#475569")
      .attr("fill-opacity", 0.9)
      .attr("stroke", (d) => {
        if (!highlightedCycle) return `${CURRENCY_MAP[d.id]?.color ?? "#475569"}40`;
        return highlightedCycle.path.includes(d.id)
          ? "#f59e0b"
          : `${CURRENCY_MAP[d.id]?.color ?? "#475569"}20`;
      })
      .attr("stroke-width", (d) => {
        if (!highlightedCycle) return 2;
        return highlightedCycle.path.includes(d.id) ? 2.5 : 1;
      });

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

    // Flag below node
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", 48)
      .attr("font-size", "20px")
      .style("pointer-events", "none")
      .text((d) => CURRENCY_MAP[d.id]?.flag ?? "");

    // Legend in top-left
    const legend = svg.append("g").attr("transform", "translate(12, 12)");
    legend.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", 200).attr("height", 72)
      .attr("rx", 8)
      .attr("fill", "var(--background, #0f172a)")
      .attr("fill-opacity", 0.8)
      .attr("stroke", "oklch(0.3 0.02 260)")
      .attr("stroke-opacity", 0.4);

    // Legend: node
    legend.append("circle").attr("cx", 18).attr("cy", 16).attr("r", 6).attr("fill", "#3b82f6").attr("fill-opacity", 0.9);
    legend.append("text").attr("x", 32).attr("y", 16).attr("font-size", "10px").attr("fill", "oklch(0.6 0.02 260)").attr("dominant-baseline", "central").text("Currency (click to set source)");

    // Legend: edge
    legend.append("line").attr("x1", 12).attr("y1", 36).attr("x2", 24).attr("y2", 36).attr("stroke", "oklch(0.45 0.02 260)").attr("stroke-width", 1.5);
    legend.append("text").attr("x", 32).attr("y", 36).attr("font-size", "10px").attr("fill", "oklch(0.6 0.02 260)").attr("dominant-baseline", "central").text("Exchange rate (directed)");

    // Legend: cycle
    legend.append("line").attr("x1", 12).attr("y1", 56).attr("x2", 24).attr("y2", 56).attr("stroke", "#f59e0b").attr("stroke-width", 2.5);
    legend.append("text").attr("x", 32).attr("y", 56).attr("font-size", "10px").attr("fill", "#fbbf24").attr("dominant-baseline", "central").text("Arbitrage cycle (negative)");

    // Drag behavior
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

    // Tick — curved edges via quadratic bezier + boundary clamping
    simulation.on("tick", () => {
      // Clamp nodes within padded bounds
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
        // Offset label toward the arc
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        const dx = tx - sx;
        const dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ox = (-dy / len) * 20;
        const oy = (dx / len) * 20;
        return `translate(${mx + ox},${my + oy})`;
      });

      // Size background rects to text
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

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { simulation.stop(); };
  }, [graph, cycles, highlightCycleId, onNodeClick, width, height]);

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
