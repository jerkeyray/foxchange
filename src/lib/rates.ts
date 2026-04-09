import type { RateMatrix } from "@/types/graph";
import { CURRENCY_CODES } from "./currencies";

const FRANKFURTER_BASE = "https://api.frankfurter.app";

interface FrankfurterResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Simple in-memory TTL cache to avoid hitting frankfurter for every request
let cachedMatrix: RateMatrix | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Build a full NxN rate matrix from frankfurter.app.
 * Fetches rates using USD as the base, then derives cross-rates.
 * Falls back to cached data if the API is down.
 */
export async function buildRateMatrix(
  currencies: string[] = CURRENCY_CODES,
  date?: string // "YYYY-MM-DD" for historical, omit for latest
): Promise<RateMatrix> {
  const now = Date.now();

  // Return cache if still fresh (only for live rates, not historical)
  if (!date && cachedMatrix && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedMatrix;
  }

  const endpoint = date ? `/${date}` : "/latest";
  const symbols = currencies.join(",");

  try {
    // Fetch from USD as base — cheapest way to get all pairs
    const res = await fetch(
      `${FRANKFURTER_BASE}${endpoint}?base=USD&symbols=${symbols}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) throw new Error(`frankfurter API error: ${res.status}`);

    const data: FrankfurterResponse = await res.json();

    // Build full NxN matrix by deriving cross-rates
    // rate(A→B) = rate(USD→B) / rate(USD→A)
    const usdRates: Record<string, number> = { USD: 1, ...data.rates };
    const matrix: RateMatrix = {};

    for (const from of currencies) {
      matrix[from] = {};
      for (const to of currencies) {
        if (from !== to) {
          const rateFromUSD = usdRates[from];
          const rateToUSD = usdRates[to];
          if (rateFromUSD && rateToUSD) {
            matrix[from][to] = rateToUSD / rateFromUSD;
          }
        }
      }
    }

    // Update cache for live rates
    if (!date) {
      cachedMatrix = matrix;
      cacheTimestamp = now;
    }

    return matrix;
  } catch (err) {
    // Fallback to stale cache if API fails
    if (cachedMatrix) {
      console.warn("frankfurter.app unavailable, using stale cache:", err);
      return cachedMatrix;
    }
    throw err;
  }
}
