# FoxChange

Currency arbitrage detector powered by the Bellman-Ford algorithm. Visualize exchange rate graphs, detect negative cycles, and step through the algorithm in real time.

## What is this?

Currency exchange rates form a directed graph — each currency is a node, each rate is a weighted edge. **Arbitrage** exists when converting through a chain of currencies yields more than you started with (product of rates > 1.0).

By transforming edge weights with `w = -log(rate)`, the problem becomes: **find a negative-weight cycle** — exactly what Bellman-Ford's V-th relaxation pass detects.

## Features

- **Dashboard** — Live exchange rates from [frankfurter.app](https://frankfurter.app), rendered as a D3 force-directed graph. Scans for arbitrage cycles in real time.
- **How It Works** — Interactive explainer covering the log transform, why Bellman-Ford (not Dijkstra), annotated pseudocode, and FAQ.
- **Sandbox** — Build custom graphs, set rates, plant arbitrage cycles, and step through the BF algorithm with playback controls, an iteration table, and a convergence plot.

## Tech Stack

- **Next.js 16** (App Router, React 19)
- **TypeScript**
- **Tailwind CSS v4** + shadcn/ui
- **D3.js** — force-directed graph visualization
- **Recharts** — convergence plot
- **Vitest** — unit tests for algorithm correctness

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Run tests
bun test

# Production build
bun run build
```

Open [http://localhost:3000](http://localhost:3000).

## How the Algorithm Works

1. **Build graph**: 8 currencies x 8 = 56 directed edges with weights `w = -log(rate)`
2. **Bellman-Ford**: Relax all edges V-1 times to find shortest paths
3. **Detect**: On the V-th pass, any edge that still relaxes reveals a negative cycle
4. **Trace**: Follow the predecessor chain to reconstruct the arbitrage loop
5. **Report**: Calculate profit as `(product of rates - 1) x 100%`

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── how-it-works/         # Explainer page
│   ├── sandbox/              # Graph sandbox
│   ├── scan/[id]/            # Cycle detail view
│   └── api/
│       ├── rates/            # Exchange rate API
│       └── scan/             # Arbitrage scan API
├── lib/
│   ├── bellman-ford.ts       # Core algorithm
│   ├── graph.ts              # Graph construction + log transform
│   ├── currencies.ts         # Currency config (8 defaults)
│   ├── rates.ts              # Frankfurter API client
│   └── presets.ts            # Sandbox presets
├── components/
│   ├── CurrencyGraph.tsx     # D3 force-directed graph
│   ├── Dashboard.tsx         # Main dashboard
│   ├── CycleCard.tsx         # Cycle display (compact/expanded)
│   ├── IterationTable.tsx    # BF distance table
│   ├── ConvergencePlot.tsx   # Recharts convergence chart
│   ├── GraphControls.tsx     # Animation playback controls
│   ├── LogTransformDemo.tsx  # Interactive rate → weight demo
│   └── SandboxEditor.tsx     # Graph editor UI
└── hooks/
    └── useAnimationPlayer.ts # Animation state machine
```

## Tests

```bash
bun test
```

18 tests covering:
- Bellman-Ford: planted arbitrage detection, cycle path correctness, balanced graphs, instrumented mode, deduplication
- Graph utils: log transform round-trip, profit calculation, cycle hash rotation invariance
