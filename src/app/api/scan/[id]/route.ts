import { runBellmanFord } from "@/lib/bellman-ford";
import { buildGraph, hashCyclePath } from "@/lib/graph";
import { buildRateMatrix } from "@/lib/rates";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const rates = await buildRateMatrix();
    const graph = buildGraph(rates);

    // Run instrumented BF from every source to find the cycle matching this id
    for (const source of graph.nodes) {
      const result = runBellmanFord(graph, source, { instrument: true });
      const cycle = result.cycles.find((c) => c.id === id);

      if (cycle) {
        // Return this cycle with the full BF steps for animation
        return NextResponse.json({
          cycle,
          steps: result.steps,
          graph,
          source,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if this might be an id from a rotated path — try hashCyclePath matching
    // by scanning all cycles
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load cycle", message: String(err) },
      { status: 503 }
    );
  }
}
