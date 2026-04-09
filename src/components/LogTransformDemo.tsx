"use client";

import { useState } from "react";
import { Beaker } from "lucide-react";

const INITIAL = [
  { from: "USD", to: "EUR", rate: 0.92 },
  { from: "EUR", to: "GBP", rate: 0.86 },
  { from: "GBP", to: "USD", rate: 1.27 },
];

export function LogTransformDemo() {
  const [rows, setRows] = useState(INITIAL);

  function update(i: number, rate: number) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, rate } : r)));
  }

  const product = rows.reduce((p, r) => p * r.rate, 1);
  const weightSum = rows.reduce((s, r) => s + -Math.log(r.rate), 0);
  const isArbitrage = product > 1;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Beaker className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Interactive Demo</p>
          <p className="text-[11px] text-muted-foreground mt-1">Edit rates and watch the weights transform</p>
        </div>
      </div>

      <div className="overflow-x-auto p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-muted-foreground uppercase tracking-widest">
              <th className="pb-3 text-left font-medium">Pair</th>
              <th className="pb-3 text-right font-medium">Rate</th>
              <th className="pb-3 text-right font-medium pr-1">-log(rate)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border/40">
                <td className="py-3 font-mono text-muted-foreground text-xs">
                  {row.from} → {row.to}
                </td>
                <td className="py-3 text-right">
                  <input
                    type="number"
                    min={0.001}
                    step={0.01}
                    value={row.rate}
                    onChange={(e) => update(i, parseFloat(e.target.value) || 0.001)}
                    className="w-24 text-right bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/50 transition-all"
                  />
                </td>
                <td
                  className={`py-3 text-right pr-1 font-mono text-sm tabular-nums ${
                    -Math.log(row.rate) < 0 ? "text-amber-400 font-medium" : "text-muted-foreground"
                  }`}
                >
                  {(-Math.log(row.rate)).toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td className="pt-3.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                Product / Sum
              </td>
              <td
                className={`pt-3.5 text-right font-mono font-bold text-sm tabular-nums ${
                  isArbitrage ? "text-green-400" : "text-foreground"
                }`}
              >
                x{product.toFixed(6)}
              </td>
              <td
                className={`pt-3.5 text-right pr-1 font-mono font-bold text-sm tabular-nums ${
                  weightSum < 0 ? "text-amber-400" : "text-foreground"
                }`}
              >
                {weightSum.toFixed(6)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        className={`mx-5 mb-5 rounded-xl px-5 py-4 text-sm leading-relaxed transition-all duration-300 ${
          isArbitrage
            ? "bg-green-500/8 border border-green-500/20 text-green-300"
            : "bg-muted/30 border border-border text-muted-foreground"
        }`}
      >
        {isArbitrage ? (
          <>
            <span className="font-bold text-green-400">Arbitrage detected!</span>{" "}
            Product = {product.toFixed(6)} &gt; 1.0, Weight sum ={" "}
            {weightSum.toFixed(6)} &lt; 0.
            A negative cycle in the graph means free profit.
          </>
        ) : (
          <>
            No arbitrage. Product = {product.toFixed(6)} ≤ 1.0, Weight sum ={" "}
            {weightSum.toFixed(6)} ≥ 0. Try increasing the last rate above{" "}
            <span className="font-mono text-foreground">
              {(1 / (rows[0].rate * rows[1].rate)).toFixed(4)}
            </span>
            .
          </>
        )}
      </div>
    </div>
  );
}
