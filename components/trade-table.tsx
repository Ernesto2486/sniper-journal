import Link from "next/link";
import type { TradeRecord } from "@/lib/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

export function TradeTable({ trades }: { trades: TradeRecord[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
            <tr>
              <th className="px-4 py-4">Trade</th>
              <th className="px-4 py-4">Setup</th>
              <th className="px-4 py-4">Result</th>
              <th className="px-4 py-4">Psychology</th>
              <th className="px-4 py-4">Discipline</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-slate-950/40">
            {trades.map((trade) => (
              <tr key={trade.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-4">
                  <p className="font-semibold text-slate-100">{trade.instrument}</p>
                  <p className="mt-1 text-slate-400">
                    {trade.date} at {trade.time} | {trade.market} | {trade.direction}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p>{trade.setup}</p>
                  <p className="mt-1 text-slate-400">{trade.setupTags.join(", ") || "No tags"}</p>
                </td>
                <td className="px-4 py-4">
                  <p className={cn("font-semibold", trade.resultUsd >= 0 ? "text-emerald-300" : "text-rose-300")}>
                    {formatCurrency(trade.resultUsd)}
                  </p>
                  <p className="mt-1 text-slate-400">{formatPercent(trade.resultPercent)}</p>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {trade.followedPlan ? <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Plan</span> : null}
                    {trade.revengeTrade ? <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">Revenge</span> : null}
                    {trade.fomo ? <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">FOMO</span> : null}
                    {trade.overtrading ? <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">Overtrade</span> : null}
                  </div>
                </td>
                <td className="px-4 py-4">{trade.disciplineScore}/10</td>
                <td className="px-4 py-4 text-right">
                  <Link href={`/trades/${trade.id}`} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-emerald-400/40 hover:text-white">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
