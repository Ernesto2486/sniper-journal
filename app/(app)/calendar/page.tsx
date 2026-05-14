import Link from "next/link";
import { addMonths, format, subMonths } from "date-fns";
import { AccountFilter } from "@/components/account-filter";
import { CalendarGrid } from "@/components/calendar-grid";
import { applyTradeFilters, buildDashboardAnalytics, buildMonthCalendar } from "@/lib/analytics";
import { getDashboardData } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";
import type { CalendarDayPoint, TradeRecord } from "@/lib/types";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarDay = {
  date: string;
  dayNumber: string;
  isCurrentMonth: boolean;
  point: CalendarDayPoint;
};

function buildWeeklySummaries(days: CalendarDay[], trades: TradeRecord[]) {
  const tradesByDate = new Map<string, TradeRecord[]>();
  for (const trade of trades) {
    const dayTrades = tradesByDate.get(trade.date) ?? [];
    dayTrades.push(trade);
    tradesByDate.set(trade.date, dayTrades);
  }

  const summaries = [];
  for (let index = 0; index < days.length; index += 7) {
    const weekDays = days.slice(index, index + 7);
    const weekTrades = weekDays.flatMap((day) => tradesByDate.get(day.date) ?? []);
    const weeklyPnl = weekTrades.reduce((sum, trade) => sum + trade.resultUsd, 0);
    const wins = weekTrades.filter((trade) => trade.resultUsd > 0).length;
    const daysWithTrades = weekDays.filter((day) => day.point.trades > 0);
    const rankedDays = [...daysWithTrades].sort((left, right) => right.point.pnl - left.point.pnl);

    summaries.push({
      label: `${format(new Date(`${weekDays[0].date}T00:00:00`), "MMM d")} - ${format(new Date(`${weekDays.at(-1)?.date}T00:00:00`), "MMM d")}`,
      pnl: weeklyPnl,
      trades: weekTrades.length,
      winRate: weekTrades.length ? (wins / weekTrades.length) * 100 : 0,
      averagePnl: weekTrades.length ? weeklyPnl / weekTrades.length : 0,
      bestDay: rankedDays[0] ?? null,
      worstDay: rankedDays.at(-1) ?? null
    });
  }

  return summaries;
}

function pnlTone(value: number) {
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-400";
}

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const params = await searchParams;
  const selectedAccount = params.account ?? "all";
  const { accounts, trades } = await getDashboardData();
  const filteredTrades = applyTradeFilters(trades, { account: selectedAccount });
  const analytics = buildDashboardAnalytics(filteredTrades);
  const month = params.month ? new Date(`${params.month}-01T00:00:00`) : new Date();
  const days = buildMonthCalendar(month, analytics.calendarPerformance);
  const weeklySummaries = buildWeeklySummaries(days, filteredTrades);
  const previous = format(subMonths(month, 1), "yyyy-MM");
  const next = format(addMonths(month, 1), "yyyy-MM");
  const accountQuery = selectedAccount !== "all" ? `&account=${selectedAccount}` : "";

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Calendar view</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{format(month, "MMMM yyyy")}</h1>
            <p className="mt-3 text-slate-400">Each day is color-coded by realized P/L for the selected account context.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <AccountFilter accounts={accounts} selectedAccount={selectedAccount} hidden={{ month: format(month, "yyyy-MM") }} compact />
            <Link href={`/calendar?month=${previous}${accountQuery}`} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">Previous</Link>
            <Link href={`/calendar?month=${next}${accountQuery}`} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">Next</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CalendarGrid days={days} weekdayLabels={weekdays} />

        <aside className="panel h-fit p-5">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Weekly summary</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Week-by-week read</h2>
          </div>
          <div className="space-y-3">
            {weeklySummaries.map((week) => (
              <div key={week.label} className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{week.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{week.trades} trades</p>
                  </div>
                  <p className={cn("text-lg font-semibold", pnlTone(week.pnl))}>{formatCurrency(week.pnl)}</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Win rate" value={`${week.winRate.toFixed(1)}%`} />
                  <Metric label="Avg P/L" value={formatCurrency(week.averagePnl)} tone={pnlTone(week.averagePnl)} />
                  <Metric label="Best day" value={week.bestDay ? `${format(new Date(`${week.bestDay.date}T00:00:00`), "EEE")} ${formatCurrency(week.bestDay.point.pnl)}` : "No trades"} tone={week.bestDay ? pnlTone(week.bestDay.point.pnl) : "text-slate-400"} />
                  <Metric label="Worst day" value={week.worstDay ? `${format(new Date(`${week.worstDay.date}T00:00:00`), "EEE")} ${formatCurrency(week.worstDay.point.pnl)}` : "No trades"} tone={week.worstDay ? pnlTone(week.worstDay.point.pnl) : "text-slate-400"} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, tone = "text-slate-200" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={cn("mt-2 font-semibold", tone)}>{value}</p>
    </div>
  );
}
