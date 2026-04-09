import { findAllCycles } from "@/lib/bellman-ford";
import { buildGraph } from "@/lib/graph";
import { buildRateMatrix } from "@/lib/rates";
import type { ScanResponse } from "@/types/graph";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threshold = parseFloat(searchParams.get("threshold") ?? "0");
  const date = searchParams.get("date") ?? undefined;

  try {
    const rates = await buildRateMatrix(undefined, date);
    const graph = buildGraph(rates);
    const allCycles = findAllCycles(graph);
    const cycles = allCycles.filter((c) => c.profitPct >= threshold);

    const response: ScanResponse = {
      cycles,
      graph,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: "Scan failed", message: String(err) },
      { status: 503 }
    );
  }
}
