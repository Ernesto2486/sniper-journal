import Link from "next/link";
import { AccountFilter } from "@/components/account-filter";
import { ChartCard } from "@/components/chart-card";
import { DistributionChart } from "@/components/distribution-chart";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { KpiCard, kpiValue } from "@/components/kpi-card";
import { PerformanceBarChart } from "@/components/performance-bar-chart";
import UpgradeButton from "@/components/upgrade-button";
import { applyTradeFilters, buildDashboardAnalytics } from "@/lib/analytics";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const params = await searchParams;
  const selectedAccount = params.account ?? "all";
  const { accounts, trades, subscription } = await getDashboardData();
  const filteredTrades = applyTradeFilters(trades, { account: selectedAccount });
  const analytics = buildDashboardAnalytics(filteredTrades);
  const { summary } = analytics;

  return (
    <div className="space-y-6">
      {subscription?.is_pro ? (
        <div className="flex justify-end">
          <div className="font-semibold text-green-400">Pro Active</div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div>
            <p className="font-semibold">Free Plan: Limited to 5 trades</p>
            <p className="text-sm text-gray-400">Upgrade to unlock unlimited trades and full analytics</p>
          </div>
          <UpgradeButton />
        </div>
      )}

      <section className="panel grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Main dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Daily command center</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Review edge, discipline, and performance in one place. The dashboard combines outcome metrics with account context.
          </p>
          <div className="mt-5 max-w-xl">
            <AccountFilter accounts={accounts} selectedAccount={selectedAccount} compact />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Best account</p>
            <p className="mt-3 text-2xl font-semibold">{summary.bestAccount}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Average RR</p>
            <p className="mt-3 text-2xl font-semibold">{summary.averageRr.toFixed(2)}R</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Plan follow rate</p>
            <p className="mt-3 text-2xl font-semibold">{summary.planFollowRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trades logged</p>
            <p className="mt-3 text-2xl font-semibold">{filteredTrades.length}</p>
          </div>
        </div>
      </section>

      {subscription?.is_pro ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total Trades" value={kpiValue("number", summary.totalTrades)} />
          <KpiCard label="Win Rate" value={kpiValue("percent", summary.winRate)} tone={summary.winRate >= 50 ? "profit" : "loss"} />
          <KpiCard label="Net P/L" value={kpiValue("currency", summary.netPnl)} tone={summary.netPnl >= 0 ? "profit" : "loss"} />
          <KpiCard label="Average RR" value={`${summary.averageRr.toFixed(2)}R`} tone={summary.averageRr >= 2 ? "profit" : "neutral"} />
          <KpiCard label="Average Winner" value={kpiValue("currency", summary.averageWinner)} tone="profit" />
          <KpiCard label="Average Loser" value={kpiValue("currency", summary.averageLoser)} tone="loss" />
          <KpiCard label="Profit Factor" value={kpiValue("number", summary.profitFactor)} tone={summary.profitFactor >= 1.5 ? "profit" : "neutral"} />
          <KpiCard label="Max Drawdown" value={kpiValue("currency", summary.maxDrawdown)} tone="loss" />
        </section>
      ) : (
        <div className="relative">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 blur-sm pointer-events-none">
            <KpiCard label="Total Trades" value={kpiValue("number", summary.totalTrades)} />
            <KpiCard label="Win Rate" value={kpiValue("percent", summary.winRate)} tone={summary.winRate >= 50 ? "profit" : "loss"} />
            <KpiCard label="Net P/L" value={kpiValue("currency", summary.netPnl)} tone={summary.netPnl >= 0 ? "profit" : "loss"} />
            <KpiCard label="Average RR" value={`${summary.averageRr.toFixed(2)}R`} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-yellow-500/30 bg-slate-950/80 p-6 text-center shadow-xl">
              <p className="text-lg font-semibold text-white">Upgrade to Pro to unlock full analytics</p>
              <p className="mt-2 text-sm text-slate-300">See advanced account performance metrics and unlock the full journal experience.</p>
              <div className="mt-4"><UpgradeButton /></div>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <ChartCard title="Equity curve" description="Cumulative P/L over time based on the selected account filter.">
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
        <ChartCard title="Performance by account" description="Compare account P/L and trade frequency.">
          <PerformanceBarChart data={analytics.performanceByAccount.map((account) => ({ label: account.label, value: account.pnl, trades: account.trades, winRate: account.winRate }))} color="#2dd4bf" />
        </ChartCard>
      </section>

      <div className="flex justify-end">
        <Link href={`/trades/new${selectedAccount !== "all" ? `?account=${selectedAccount}` : ""}`} className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950">
          Log new trade
        </Link>
      </div>
    </div>
  );
}
