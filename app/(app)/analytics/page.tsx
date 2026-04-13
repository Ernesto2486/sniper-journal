import { ChartCard } from "@/components/chart-card";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { PerformanceBarChart } from "@/components/performance-bar-chart";
import { getDashboardData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export default async function AnalyticsPage() {
  const { analytics, trades } = await getDashboardData();
  const { summary } = analytics;

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Analytics</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Performance depth, not just headline stats.</h1>
        <p className="mt-3 max-w-3xl text-slate-400">
          Expectancy is calculated as (WinRate x AvgWin) - (LossRate x AvgLoss). Setup rankings, weekday data, weekly performance, and psychology rates all pull from the same trade journal.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="panel p-5"><p className="label">Win rate</p><p className="text-3xl font-semibold">{summary.winRate.toFixed(2)}%</p></div>
        <div className="panel p-5"><p className="label">Avg winner / loser</p><p className="text-3xl font-semibold">{formatCurrency(summary.averageWinner)} / {formatCurrency(summary.averageLoser)}</p></div>
        <div className="panel p-5"><p className="label">Expectancy</p><p className={`text-3xl font-semibold ${summary.expectancy >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(summary.expectancy)}</p></div>
        <div className="panel p-5"><p className="label">Profit factor</p><p className="text-3xl font-semibold">{summary.profitFactor.toFixed(2)}</p></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Equity curve" description="Max drawdown is derived directly from this cumulative P/L series.">
          <EquityCurveChart data={analytics.equityCurve} />
        </ChartCard>
        <div className="panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Setup edge summary</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-emerald-300/15 bg-emerald-400/10 p-5">
              <p className="label text-emerald-200">Best setup</p>
              <p className="text-2xl font-semibold text-emerald-100">{summary.bestSetup}</p>
            </div>
            <div className="rounded-3xl border border-rose-300/15 bg-rose-400/10 p-5">
              <p className="label text-rose-200">Worst setup</p>
              <p className="text-2xl font-semibold text-rose-100">{summary.worstSetup}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="label">Max drawdown</p>
              <p className="text-2xl font-semibold">{formatCurrency(summary.maxDrawdown)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Performance by setup" description="Top six setups by total P/L.">
          <PerformanceBarChart data={analytics.performanceBySetup.slice(0, 6)} color="#2dd4bf" />
        </ChartCard>
        <ChartCard title="Daily performance" description="Day-by-day P/L reveals whether results are smooth or overly concentrated.">
          <PerformanceBarChart
            data={analytics.dailyPerformance.map((item) => ({ label: item.label, value: item.pnl, trades: item.trades }))}
            color="#60a5fa"
          />
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Psychology scorecard</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="label">Followed plan</p>
              <p className="text-2xl font-semibold">{summary.planFollowRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="label">Respected stop loss</p>
              <p className="text-2xl font-semibold">{summary.stopRespectRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="label">Average discipline</p>
              <p className="text-2xl font-semibold">{summary.avgDiscipline.toFixed(1)}/10</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="label">Behavior flags</p>
              <p className="text-2xl font-semibold">
                {trades.filter((trade) => trade.revengeTrade || trade.fomo || trade.overtrading).length}
              </p>
            </div>
          </div>
        </div>

        <div className="panel p-6">
          <h2 className="text-xl font-semibold tracking-tight">Weekly performance</h2>
          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-sm">
              <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">Week</th>
                  <th className="px-4 py-4">Trades</th>
                  <th className="px-4 py-4">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/40">
                {analytics.weeklyPerformance.map((week) => (
                  <tr key={week.label}>
                    <td className="px-4 py-4 font-medium">{week.label}</td>
                    <td className="px-4 py-4">{week.trades}</td>
                    <td className={`px-4 py-4 font-semibold ${week.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(week.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
