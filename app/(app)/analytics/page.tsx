import { AccountFilter } from "@/components/account-filter";
import { ChartCard } from "@/components/chart-card";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { PerformanceBarChart } from "@/components/performance-bar-chart";
import { applyTradeFilters, buildDashboardAnalytics } from "@/lib/analytics";
import { getDashboardData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const params = await searchParams;
  const selectedAccount = params.account ?? "all";
  const { accounts, trades } = await getDashboardData();
  const filteredTrades = applyTradeFilters(trades, { account: selectedAccount });
  const analytics = buildDashboardAnalytics(filteredTrades);
  const { summary } = analytics;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Analytics</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Performance depth, not just headline stats.</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              Account rankings, expectancy, setup rankings, weekday data, weekly performance, and psychology rates all pull from the same trade journal.
            </p>
          </div>
          <AccountFilter accounts={accounts} selectedAccount={selectedAccount} compact />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="panel p-5"><p className="label">PnL</p><p className={`text-3xl font-semibold ${summary.netPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(summary.netPnl)}</p></div>
        <div className="panel p-5"><p className="label">Win rate</p><p className="text-3xl font-semibold">{summary.winRate.toFixed(2)}%</p></div>
        <div className="panel p-5"><p className="label">Total trades</p><p className="text-3xl font-semibold">{summary.totalTrades}</p></div>
        <div className="panel p-5"><p className="label">Average RR</p><p className="text-3xl font-semibold">{summary.averageRr.toFixed(2)}R</p></div>
        <div className="panel p-5"><p className="label">Profit factor</p><p className="text-3xl font-semibold">{summary.profitFactor.toFixed(2)}</p></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Equity curve" description="Max drawdown is derived directly from this cumulative P/L series.">
          <EquityCurveChart data={analytics.equityCurve} />
        </ChartCard>
        <div className="panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Account edge summary</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-5">
              <p className="label text-emerald-200">Best account</p>
              <p className="text-2xl font-semibold text-emerald-100">{summary.bestAccount}</p>
            </div>
            <div className="rounded-3xl border border-rose-300/15 bg-rose-400/10 p-5">
              <p className="label text-rose-200">Worst account</p>
              <p className="text-2xl font-semibold text-rose-100">{summary.worstAccount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="label">Max drawdown</p>
              <p className="text-2xl font-semibold">{formatCurrency(summary.maxDrawdown)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Performance by account" description="Account P/L, trade count, and win-rate context.">
          <PerformanceBarChart data={analytics.performanceByAccount.map((item) => ({ label: item.label, value: item.pnl, trades: item.trades, winRate: item.winRate }))} color="#2dd4bf" />
        </ChartCard>
        <ChartCard title="Daily performance" description="Day-by-day P/L reveals whether results are smooth or overly concentrated.">
          <PerformanceBarChart data={analytics.dailyPerformance.map((item) => ({ label: item.label, value: item.pnl, trades: item.trades }))} color="#60a5fa" />
        </ChartCard>
      </section>

      <section className="panel p-6">
        <h2 className="text-xl font-semibold tracking-tight">Account stats</h2>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
              <tr>
                <th className="px-4 py-4">Account</th>
                <th className="px-4 py-4">Trades</th>
                <th className="px-4 py-4">Win rate</th>
                <th className="px-4 py-4">Average RR</th>
                <th className="px-4 py-4">P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/40">
              {analytics.performanceByAccount.map((account) => (
                <tr key={account.accountId ?? "unassigned"}>
                  <td className="px-4 py-4 font-medium">{account.label}</td>
                  <td className="px-4 py-4">{account.trades}</td>
                  <td className="px-4 py-4">{account.winRate.toFixed(2)}%</td>
                  <td className="px-4 py-4">{account.averageRr.toFixed(2)}R</td>
                  <td className={`px-4 py-4 font-semibold ${account.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(account.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
