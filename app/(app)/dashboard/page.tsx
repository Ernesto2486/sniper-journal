import Link from "next/link";
import { ChartCard } from "@/components/chart-card";
import { DistributionChart } from "@/components/distribution-chart";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { KpiCard, kpiValue } from "@/components/kpi-card";
import { PerformanceBarChart } from "@/components/performance-bar-chart";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const { analytics, trades } = await getDashboardData();
  const { summary } = analytics;

  return (
    <div className="space-y-6">
      <section className="panel grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Main dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Daily command center</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Review edge, discipline, and performance in one place. The dashboard combines outcome metrics with the behavioral data that created them.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Best setup</p>
            <p className="mt-3 text-2xl font-semibold">{summary.bestSetup}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Plan follow rate</p>
            <p className="mt-3 text-2xl font-semibold">{summary.planFollowRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Avg discipline</p>
            <p className="mt-3 text-2xl font-semibold">{summary.avgDiscipline.toFixed(1)}/10</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trades logged</p>
            <p className="mt-3 text-2xl font-semibold">{trades.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Trades" value={kpiValue("number", summary.totalTrades)} />
        <KpiCard label="Win Rate" value={kpiValue("percent", summary.winRate)} tone={summary.winRate >= 50 ? "profit" : "loss"} />
        <KpiCard label="Net P/L" value={kpiValue("currency", summary.netPnl)} tone={summary.netPnl >= 0 ? "profit" : "loss"} />
        <KpiCard label="Average Winner" value={kpiValue("currency", summary.averageWinner)} tone="profit" />
        <KpiCard label="Average Loser" value={kpiValue("currency", summary.averageLoser)} tone="loss" />
        <KpiCard label="Profit Factor" value={summary.profitFactor.toFixed(2)} tone={summary.profitFactor >= 1.5 ? "profit" : "neutral"} />
        <KpiCard label="Expectancy" value={kpiValue("currency", summary.expectancy)} tone={summary.expectancy >= 0 ? "profit" : "loss"} />
        <KpiCard label="Max Drawdown" value={kpiValue("currency", summary.maxDrawdown)} tone="loss" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartCard title="Equity curve" description="Cumulative P/L over time based on your recorded result for each trade.">
          <EquityCurveChart data={analytics.equityCurve} />
        </ChartCard>
        <ChartCard title="Win vs loss distribution" description="Trade count broken into winners and losers with gross amount context.">
          <DistributionChart data={analytics.winLossDistribution} />
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Performance by setup" description="See which setups are actually paying you, not just the ones you like taking.">
          <PerformanceBarChart data={analytics.performanceBySetup.slice(0, 6)} color="#38bdf8" />
        </ChartCard>
        <ChartCard title="Performance by day of week" description="Spot which sessions and weekdays deserve more or less risk.">
          <PerformanceBarChart data={analytics.performanceByDayOfWeek} color="#f59e0b" />
        </ChartCard>
      </section>

      <div className="flex justify-end">
        <Link href="/trades/new" className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950">
          Log new trade
        </Link>
      </div>
    </div>
  );
}
