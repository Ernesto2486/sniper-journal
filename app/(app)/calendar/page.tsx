import Link from "next/link";
import { addMonths, format, subMonths } from "date-fns";
import { AccountFilter } from "@/components/account-filter";
import { CalendarGrid } from "@/components/calendar-grid";
import { applyTradeFilters, buildDashboardAnalytics, buildMonthCalendar } from "@/lib/analytics";
import { getDashboardData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

      <CalendarGrid days={days} weekdayLabels={weekdays} />

      <section className="panel p-6">
        <h2 className="text-xl font-semibold tracking-tight">Weekly summary</h2>
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
              <tr>
                <th className="px-4 py-4">Week</th>
                <th className="px-4 py-4">Trades</th>
                <th className="px-4 py-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-950/40">
              {analytics.weeklyPerformance.map((week) => (
                <tr key={week.label}>
                  <td className="px-4 py-4">{week.label}</td>
                  <td className="px-4 py-4">{week.trades}</td>
                  <td className={`px-4 py-4 font-semibold ${week.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatCurrency(week.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
