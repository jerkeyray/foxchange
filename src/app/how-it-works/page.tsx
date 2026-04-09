import Link from "next/link";
import {
  ArrowRight,
  FlaskConical,
  BookOpen,
  Code,
  HelpCircle,
  Calculator,
  GitBranch,
  Check,
  X,
  Timer,
} from "lucide-react";
import { LogTransformDemo } from "@/components/LogTransformDemo";
import { PseudocodeBlock } from "@/components/PseudocodeBlock";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function SectionIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mr-3 shrink-0">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {title && (
        <div className="border-b border-border px-4 py-2 flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{title}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-foreground">
        {children}
      </pre>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Hero */}
      <section className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">How It Works</h1>
        </div>

        <div className="text-muted-foreground space-y-3 leading-relaxed">
          <p>
            Exchange rates form a directed graph — each currency is a node, each rate is a weighted edge.
            <strong className="text-foreground"> Arbitrage</strong> exists when converting through a chain of currencies yields more than you started with.
          </p>
          <p>
            For example: start with $1, buy EUR at 0.92, buy GBP at 0.86, sell GBP for USD at 1.27.
            You end with 0.92 × 0.86 × 1.27 = <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">$1.004</code>.
            That&apos;s a 0.4% profit from a round trip — a negative cycle in graph terms.
          </p>
        </div>
      </section>

      {/* Section 1: Log Transform */}
      <section className="space-y-6">
        <div className="flex items-center">
          <SectionIcon icon={Calculator} />
          <div>
            <h2 className="text-xl font-bold">Step 1: The Log Transform</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Turn multiplication into addition</p>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Bellman-Ford works with <em className="text-foreground">sums</em> of edge weights, but arbitrage is a <em className="text-foreground">product</em> of rates.
          The fix: apply <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">w = -log(rate)</code> to each edge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">Raw rates (product)</p>
            <p className="font-mono text-sm bg-muted/50 rounded-lg px-4 py-3 border border-border/50">
              rate<sub>1</sub> × rate<sub>2</sub> × rate<sub>3</sub> &gt; 1.0
            </p>
            <p className="text-xs text-muted-foreground">
              Shortest-path algorithms don&apos;t optimize products.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">Log-transformed (sum)</p>
            <p className="font-mono text-sm bg-muted/50 rounded-lg px-4 py-3 border border-border/50">
              -log(r<sub>1</sub>) + -log(r<sub>2</sub>) + -log(r<sub>3</sub>) &lt; 0
            </p>
            <p className="text-xs text-muted-foreground">
              Negative sum = negative cycle = arbitrage.
            </p>
          </div>
        </div>

        <CodeBlock title="src/lib/graph.ts — buildGraph()">
{`export function buildGraph(rates: RateMatrix): Graph {
  const nodes = Object.keys(rates);
  const edges: Edge[] = [];

  for (const from of nodes) {
    for (const [to, rate] of Object.entries(rates[from])) {
      if (from !== to && rate > 0) {
        edges.push({
          from,
          to,
          weight: -Math.log(rate),  // the key transform
          rawRate: rate,
        });
      }
    }
  }

  return { nodes, edges };
}`}
        </CodeBlock>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">Why does this equivalence hold?</p>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p>
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">log</code> converts multiplication into addition.
              Taking log of both sides of <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">r1 × r2 × r3 &gt; 1</code> gives <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">log(r1) + log(r2) + log(r3) &gt; 0</code>.
              Multiply by -1 and the inequality flips: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">-log(r1) + -log(r2) + -log(r3) &lt; 0</code> — a negative-weight cycle.
            </p>
          </div>
        </div>

        <LogTransformDemo />
      </section>

      {/* Section 2: Why BF */}
      <section className="space-y-6">
        <div className="flex items-center">
          <SectionIcon icon={GitBranch} />
          <div>
            <h2 className="text-xl font-bold">Step 2: Why Bellman-Ford?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Not all shortest-path algorithms handle negative weights</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-400" />
              <p className="text-sm font-semibold text-red-400">Dijkstra fails here</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>- Assumes non-negative edge weights</li>
              <li>- Greedy: settles each node once, can&apos;t backtrack</li>
              <li>- Produces wrong results with negative weights</li>
              <li>- No mechanism to detect negative cycles</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              <p className="text-sm font-semibold text-green-400">Bellman-Ford works</p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              <li>+ Handles negative edge weights correctly</li>
              <li>+ Relaxes all edges each pass — converges with negatives</li>
              <li>+ V-th pass detects negative cycles by design</li>
              <li>+ O(VE) — fast enough for currency graphs</li>
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Complexity for our 8-currency graph</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold font-mono">8</p>
              <p className="text-xs text-muted-foreground">nodes (V)</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">56</p>
              <p className="text-xs text-muted-foreground">edges (E)</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">448</p>
              <p className="text-xs text-muted-foreground">relaxations</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            We run BF from every node as source to find all cycles: 8 × 448 = 3,584 operations total.
          </p>
        </div>
      </section>

      {/* Section 3: Implementation */}
      <section className="space-y-6">
        <div className="flex items-center">
          <SectionIcon icon={Code} />
          <div>
            <h2 className="text-xl font-bold">Step 3: The Implementation</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Standard BF with one twist — trace the cycle instead of erroring</p>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          The algorithm has three phases: initialize distances, relax edges V-1 times, then check for negative cycles on the V-th pass.
          The only non-standard part is what happens when we <em className="text-foreground">find</em> a negative cycle — instead of throwing, we trace the predecessor chain to reconstruct the arbitrage loop.
        </p>

        <PseudocodeBlock />

        <CodeBlock title="src/lib/bellman-ford.ts — runBellmanFord()">
{`export function runBellmanFord(graph: Graph, source: string): BFResult {
  const { nodes, edges } = graph;
  const V = nodes.length;

  // Phase 1: Initialize
  const dist: Record<string, number> = {};
  const pred: Record<string, string | null> = {};
  for (const n of nodes) { dist[n] = Infinity; pred[n] = null; }
  dist[source] = 0;

  // Phase 2: V-1 relaxation passes
  for (let i = 0; i < V - 1; i++) {
    for (const { from, to, weight } of edges) {
      if (dist[from] !== Infinity && dist[from] + weight < dist[to]) {
        dist[to] = dist[from] + weight;
        pred[to] = from;
      }
    }
  }

  // Phase 3: V-th pass — detect negative cycles
  const cycleNodes = new Set<string>();
  for (const { from, to, weight } of edges) {
    if (dist[from] !== Infinity && dist[from] + weight < dist[to]) {
      cycleNodes.add(to);  // still relaxing → negative cycle!
    }
  }

  // Reconstruct each unique cycle from predecessor chain
  const cycles: CycleResult[] = [];
  for (const startNode of cycleNodes) {
    const cycle = traceCycle(pred, startNode, V);
    if (cycle) cycles.push(buildCycleResult(cycle, graph));
  }

  return { distances: dist, predecessors: pred, cycles };
}`}
        </CodeBlock>

        <CodeBlock title="src/lib/bellman-ford.ts — traceCycle()">
{`// Walk the predecessor chain to reconstruct the negative cycle.
// Returns e.g. ["USD", "EUR", "GBP", "USD"]
function traceCycle(
  pred: Record<string, string | null>,
  startNode: string,
  maxSteps: number
): string[] | null {
  // Walk back maxSteps to guarantee we're inside the cycle
  let current = startNode;
  for (let i = 0; i < maxSteps; i++) {
    const p = pred[current];
    if (p === null) return null;
    current = p;
  }

  // Now trace the cycle from this node
  const cycleStart = current;
  const path: string[] = [];
  let node: string | null = pred[cycleStart];
  let safety = 0;

  while (node !== null && node !== cycleStart && safety < maxSteps) {
    path.unshift(node);
    node = pred[node];
    safety++;
  }

  if (node !== cycleStart) return null;
  path.unshift(cycleStart);
  path.push(cycleStart);  // close the loop
  return path;
}`}
        </CodeBlock>

        <CodeBlock title="src/lib/bellman-ford.ts — findAllCycles()">
{`// Run BF from every node to discover all negative cycles.
// A single source may miss cycles in other components.
export function findAllCycles(graph: Graph): CycleResult[] {
  const seenIds = new Set<string>();
  const allCycles: CycleResult[] = [];

  for (const source of graph.nodes) {
    const { cycles } = runBellmanFord(graph, source);
    for (const cycle of cycles) {
      if (!seenIds.has(cycle.id)) {  // deduplicate by canonical hash
        seenIds.add(cycle.id);
        allCycles.push(cycle);
      }
    }
  }

  return allCycles.sort((a, b) => b.profitPct - a.profitPct);
}`}
        </CodeBlock>

        <CodeBlock title="src/lib/graph.ts — computeProfit() + hashCyclePath()">
{`// Net profit from a cycle: product of rates - 1
export function computeProfit(rates: number[]): number {
  return rates.reduce((product, r) => product * r, 1) - 1;
}

// Deterministic cycle ID via canonical rotation
// ["EUR","GBP","USD","EUR"] and ["USD","EUR","GBP","USD"]
// both hash to the same ID
export function hashCyclePath(path: string[]): string {
  const loop = path.slice(0, -1);
  const minIdx = loop.indexOf([...loop].sort()[0]);
  const rotated = [...loop.slice(minIdx), ...loop.slice(0, minIdx)];
  return rotated.join(">");
}`}
        </CodeBlock>
      </section>

      {/* Section 4: FAQ */}
      <section className="space-y-6">
        <div className="flex items-center">
          <SectionIcon icon={HelpCircle} />
          <h2 className="text-xl font-bold">FAQ</h2>
        </div>
        <Accordion className="space-y-2">
          <AccordionItem value="real" className="border border-border rounded-xl px-5 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-medium py-4">
              Can I actually make money with this?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              No. Real FX markets are extremely efficient — any theoretical arbitrage is erased
              within milliseconds by HFT bots. Actual execution requires accounting for bid-ask
              spreads (0.1-0.5%), transaction fees, and latency. This demonstrates the algorithm, not a trading strategy.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="why-negative" className="border border-border rounded-xl px-5 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-medium py-4">
              Why do some edges have negative weights?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              Any rate &gt; 1 produces a negative weight after <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded text-xs">-log(rate)</code>.
              For example, USD/JPY = 150 gives -log(150) ≈ -5.01. This is expected — it&apos;s what makes the detection work.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="no-arb" className="border border-border rounded-xl px-5 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-medium py-4">
              Why doesn&apos;t the scanner usually find arbitrage?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              The rates from frankfurter.app are mid-market (midpoint between buy/sell).
              Even tiny spreads (0.05%) eliminate most theoretical arbitrage.
              Use the <Link href="/sandbox" className="text-foreground underline underline-offset-2">Sandbox</Link> to plant a cycle manually.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="complexity" className="border border-border rounded-xl px-5 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-medium py-4">
              What is the time complexity?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              Single-source BF is O(V × E). We run from every node: O(V² × E).
              For 8 currencies that&apos;s 3,584 operations. Even 20 currencies (380 edges) would be under 150k operations.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="source" className="border border-border rounded-xl px-5 data-[state=open]:bg-card">
            <AccordionTrigger className="text-sm font-medium py-4">
              Does the source node matter?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              A single BF run only finds cycles reachable from its source. We run from every node
              and deduplicate via <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded text-xs">hashCyclePath()</code> which
              canonicalizes the rotation so the same cycle discovered from different sources gets the same ID.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <FlaskConical className="w-8 h-8 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-bold">Try it yourself</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Build a custom graph, plant a negative cycle, and step through the algorithm.
        </p>
        <Link href="/sandbox" className="inline-block">
          <Button className="gap-2">
            Open Sandbox <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
