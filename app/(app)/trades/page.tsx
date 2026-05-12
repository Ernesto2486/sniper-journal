import Link from "next/link";
import { Download } from "lucide-react";
import { applyTradeFilters, buildDashboardAnalytics } from "@/lib/analytics";
import { getDashboardData } from "@/lib/data";
import { TradeTable } from "@/components/trade-table";

export default async function TradesPage({
  searchParams
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    market?: string;
    setup?: string;
    account?: string;
    result?: "win" | "loss" | "all";
    error?: string;
    message?: string;
  }>;
}) {
  const params = await searchParams;
  const { trades, accounts } = await getDashboardData();
  const filtered = applyTradeFilters(trades, params);
  const analytics = buildDashboardAnalytics(filtered);
  const setups = [...new Set(trades.map((trade) => trade.setup))];
  const markets = [...new Set(trades.map((trade) => trade.market))];

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Trade history</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Every trade, fully reviewable.</h1>
            <p className="mt-3 text-slate-400">Filter by account, date, market, setup, or outcome, then jump straight into edit mode.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/trades/export" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
              <Download className="h-4 w-4" />
              Export CSV
            </Link>
            <Link href="/trades/new" className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">
              Log trade
            </Link>
          </div>
        </div>

        {params.error ? <div className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{params.error}</div> : null}
        {params.message ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{params.message}</div> : null}

        <form className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div><label className="label">From</label><input className="field" type="date" name="from" defaultValue={params.from} /></div>
          <div><label className="label">To</label><input className="field" type="date" name="to" defaultValue={params.to} /></div>
          <div>
            <label className="label">Account</label>
            <select className="field" name="account" defaultValue={params.account ?? "all"}>
              <option value="all">All Accounts</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.accountName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Market</label>
            <select className="field" name="market" defaultValue={params.market ?? "all"}>
              <option value="all">All markets</option>
              {markets.map((market) => <option key={market}>{market}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Setup</label>
            <select className="field" name="setup" defaultValue={params.setup ?? "all"}>
              <option value="all">All setups</option>
              {setups.map((setup) => <option key={setup}>{setup}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Result</label>
            <select className="field" name="result" defaultValue={params.result ?? "all"}>
              <option value="all">All trades</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
            </select>
          </div>
          <div className="xl:col-span-6 flex flex-wrap gap-3">
            <button className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">Apply filters</button>
            <Link href="/trades" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">Reset</Link>
          </div>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="panel p-5"><p className="label">Filtered Trades</p><p className="text-3xl font-semibold">{filtered.length}</p></div>
        <div className="panel p-5"><p className="label">Filtered Win Rate</p><p className="text-3xl font-semibold">{analytics.summary.winRate.toFixed(2)}%</p></div>
        <div className="panel p-5"><p className="label">Filtered Net P/L</p><p className={`text-3xl font-semibold ${analytics.summary.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{analytics.summary.netPnl.toFixed(2)} USD</p></div>
        <div className="panel p-5"><p className="label">Average RR</p><p className="text-3xl font-semibold">{analytics.summary.averageRr.toFixed(2)}R</p></div>
      </section>

      <section className="panel p-0">
        <TradeTable trades={filtered} />
      </section>
    </div>
  );
}
