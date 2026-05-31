import Link from "next/link";
import { format, startOfMonth, startOfQuarter, startOfYear, subDays, subMonths } from "date-fns";
import { AccountFilter } from "@/components/account-filter";
import { ChartCard } from "@/components/chart-card";
import { DistributionChart } from "@/components/distribution-chart";
import { EquityCurveChart } from "@/components/equity-curve-chart";
import { KpiCard, kpiValue } from "@/components/kpi-card";
import { PerformanceBarChart } from "@/components/performance-bar-chart";
import { ShareTodaysPnlButton } from "@/components/share-todays-pnl-button";
import UpgradeButton from "@/components/upgrade-button";
import { applyTradeFilters, buildDashboardAnalytics } from "@/lib/analytics";
import { getDashboardData } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";

type DateRangeKey = "all" | "30d" | "90d" | "mtd" | "qtd" | "ytd" | "12mo" | "custom";

type DashboardSearchParams = {
  account?: string;
  range?: string;
  from?: string;
  to?: string;
};

const dateRangeOptions: { value: DateRangeKey; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30d", label: "Last 30d" },
  { value: "90d", label: "Last 90d" },
  { value: "mtd", label: "MTD" },
  { value: "qtd", label: "QTD" },
  { value: "ytd", label: "YTD" },
  { value: "12mo", label: "Last 12mo" },
  { value: "custom", label: "Custom" }
];

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function displayName(email?: string) {
  if (!email) return "";
  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return name ? name.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
}

function normalizeRange(value?: string): DateRangeKey {
  return dateRangeOptions.some((option) => option.value === value) ? (value as DateRangeKey) : "all";
}

function formatDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function resolveDateRange(range: DateRangeKey, from: string | undefined, to: string | undefined, now: Date) {
  const today = formatDateInput(now);

  if (range === "custom") {
    return { from: from || undefined, to: to || undefined };
  }

  if (range === "30d") return { from: formatDateInput(subDays(now, 29)), to: today };
  if (range === "90d") return { from: formatDateInput(subDays(now, 89)), to: today };
  if (range === "mtd") return { from: formatDateInput(startOfMonth(now)), to: today };
  if (range === "qtd") return { from: formatDateInput(startOfQuarter(now)), to: today };
  if (range === "ytd") return { from: formatDateInput(startOfYear(now)), to: today };
  if (range === "12mo") return { from: formatDateInput(subMonths(now, 12)), to: today };

  return { from: undefined, to: undefined };
}

function dashboardHref(params: DashboardSearchParams, updates: Partial<DashboardSearchParams>) {
  const next = { ...params, ...updates };
  const query = new URLSearchParams();

  if (next.account && next.account !== "all") query.set("account", next.account);
  if (next.range && next.range !== "all") query.set("range", next.range);
  if (next.range === "custom") {
    if (next.from) query.set("from", next.from);
    if (next.to) query.set("to", next.to);
  }

  const search = query.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
}

function DateRangeFilterBar({
  params,
  activeRange,
  fromValue,
  toValue
}: {
  params: DashboardSearchParams;
  activeRange: DateRangeKey;
  fromValue?: string;
  toValue?: string;
}) {
  return (
    <section className="panel p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Date range</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {dateRangeOptions.map((option) => {
              const isActive = option.value === activeRange;
              return (
                <Link
                  key={option.value}
                  href={dashboardHref(params, { range: option.value, from: option.value === "custom" ? params.from : undefined, to: option.value === "custom" ? params.to : undefined })}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    isActive
                      ? "border-emerald-300 bg-emerald-400 text-slate-950"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-100"
                  )}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <form className="grid gap-3 sm:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto] xl:min-w-[520px]" action="/dashboard">
          {params.account && params.account !== "all" ? <input type="hidden" name="account" value={params.account} /> : null}
          <input type="hidden" name="range" value="custom" />
          <div>
            <label className="label">From date</label>
            <input className="field" type="date" name="from" defaultValue={fromValue ?? ""} />
          </div>
          <div>
            <label className="label">To date</label>
            <input className="field" type="date" name="to" defaultValue={toValue ?? ""} />
          </div>
          <button className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 sm:self-end">
            Apply
          </button>
        </form>
      </div>
    </section>
  );
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const params = await searchParams;
  const selectedAccount = params.account ?? "all";
  const selectedRange = normalizeRange(params.range);
  const now = new Date();
  const resolvedRange = resolveDateRange(selectedRange, params.from, params.to, now);
  const { accounts, trades, subscription, auth } = await getDashboardData();
  const filteredTrades = applyTradeFilters(trades, {
    account: selectedAccount,
    from: resolvedRange.from,
    to: resolvedRange.to
  });
  const accountFilteredTrades = applyTradeFilters(trades, { account: selectedAccount });
  const analytics = buildDashboardAnalytics(filteredTrades);
  const { summary } = analytics;
  const today = formatDateInput(now);
  const todaysPnl = accountFilteredTrades
    .filter((trade) => trade.date === today)
    .reduce((sum, trade) => sum + trade.resultUsd, 0);
  const name = displayName(auth.user?.email);
  const greeting = `${greetingFor(now)}${name ? `, ${name}` : ""}`;
  const filterParams = {
    account: selectedAccount,
    range: selectedRange,
    from: params.from,
    to: params.to
  };
  const accountHiddenParams = {
    range: selectedRange !== "all" ? selectedRange : undefined,
    from: selectedRange === "custom" ? params.from : undefined,
    to: selectedRange === "custom" ? params.to : undefined
  };
  const customFromValue = selectedRange === "custom" ? params.from : resolvedRange.from;
  const customToValue = selectedRange === "custom" ? params.to : resolvedRange.to;

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

      <section className="panel p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{greeting}</h1>
            <p className="mt-3 text-slate-400">Stay consistent and trust your process.</p>
            <div className="mt-6 max-w-xl">
              <AccountFilter accounts={accounts} selectedAccount={selectedAccount} hidden={accountHiddenParams} compact />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Today&apos;s P&amp;L</p>
              <p className={cn("mt-3 text-3xl font-semibold", todaysPnl > 0 ? "text-emerald-300" : todaysPnl < 0 ? "text-rose-300" : "text-slate-200")}>{formatCurrency(todaysPnl)}</p>
              <p className="mt-2 text-sm text-slate-500">Based on today and the selected account filter.</p>
            </div>
            <ShareTodaysPnlButton todaysPnl={todaysPnl} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <DateRangeFilterBar params={filterParams} activeRange={selectedRange} fromValue={customFromValue} toValue={customToValue} />

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
        <ChartCard title="Equity curve" description="Cumulative P/L over time based on the selected account and date range filters.">
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
        <ChartCard title="Performance by account" description="Compare account P/L and trade frequency for the selected date range.">
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
