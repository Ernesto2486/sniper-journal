import { formatCurrency } from "@/lib/utils";

export function CalendarGrid({
  days,
  weekdayLabels
}: {
  days: Array<{
    date: string;
    dayNumber: string;
    isCurrentMonth: boolean;
    point: {
      pnl: number;
      trades: number;
    };
  }>;
  weekdayLabels: string[];
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-7 border-b border-white/10">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <div
            key={day.date}
            className={`min-h-28 border-b border-r border-white/[0.08] p-3 ${day.isCurrentMonth ? "bg-white/[0.03]" : "bg-slate-950/40 text-slate-500"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{day.dayNumber}</span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{day.point.trades}T</span>
            </div>
            <div
              className={`mt-6 rounded-2xl px-3 py-2 text-sm font-semibold ${
                day.point.pnl > 0 ? "bg-emerald-400/12 text-emerald-200" : day.point.pnl < 0 ? "bg-rose-400/12 text-rose-200" : "bg-white/5 text-slate-400"
              }`}
            >
              {formatCurrency(day.point.pnl)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
