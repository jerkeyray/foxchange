import { buildRateMatrix } from "@/lib/rates";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? undefined;

  try {
    const rates = await buildRateMatrix(undefined, date);
    return NextResponse.json({
      rates,
      timestamp: new Date().toISOString(),
      stale: false,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch rates", message: String(err) },
      { status: 503 }
    );
  }
}
