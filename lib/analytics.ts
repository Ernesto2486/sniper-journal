import {
  eachDayOfInterval,
  endOfWeek,
  format,
  getDay,
  parseISO,
  startOfWeek
} from "date-fns";
import type {
  CalendarDayPoint,
  DashboardAnalytics,
  DashboardSummary,
  PerformancePoint,
  PeriodPerformancePoint,
  TradeFilters,
  TradeRecord
} from "@/lib/types";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function tradeDateTime(trade: TradeRecord) {
  return new Date(`${trade.date}T${trade.time || "00:00"}:00`);
}

export function sortTrades(trades: TradeRecord[]) {
  return [...trades].sort((left, right) => tradeDateTime(left).getTime() - tradeDateTime(right).getTime());
}

export function applyTradeFilters(trades: TradeRecord[], filters: TradeFilters) {
  return trades.filter((trade) => {
    if (filters.from && trade.date < filters.from) return false;
    if (filters.to && trade.date > filters.to) return false;
    if (filters.market && filters.market !== "all" && trade.market !== filters.market) return false;
    if (filters.setup && filters.setup !== "all" && trade.setup !== filters.setup) return false;
    if (filters.result === "win" && trade.resultUsd <= 0) return false;
    if (filters.result === "loss" && trade.resultUsd >= 0) return false;
    return true;
  });
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function groupedCalendarPoints(trades: TradeRecord[]): CalendarDayPoint[] {
  const map = new Map<string, CalendarDayPoint>();

  for (const trade of trades) {
    const current = map.get(trade.date) ?? { date: trade.date, pnl: 0, trades: 0 };
    current.pnl += trade.resultUsd;
    current.trades += 1;
    map.set(trade.date, current);
  }

  return [...map.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function buildSummary(trades: TradeRecord[]): DashboardSummary {
  const wins = trades.filter((trade) => trade.resultUsd > 0);
  const losses = trades.filter((trade) => trade.resultUsd < 0);
  const grossProfit = wins.reduce((sum, trade) => sum + trade.resultUsd, 0);
  const grossLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.resultUsd, 0));
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const avgWin = average(wins.map((trade) => trade.resultUsd));
  const avgLoss = Math.abs(average(losses.map((trade) => trade.resultUsd)));
  const lossRate = 1 - winRate / 100;
  const expectancy = (winRate / 100) * avgWin - lossRate * avgLoss;

  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const trade of trades) {
    cumulative += trade.resultUsd;
    peak = Math.max(peak, cumulative);
    maxDrawdown = Math.max(maxDrawdown, peak - cumulative);
  }

  const setupPerformance = new Map<string, { total: number; trades: number }>();
  for (const trade of trades) {
    const current = setupPerformance.get(trade.setup) ?? { total: 0, trades: 0 };
    current.total += trade.resultUsd;
    current.trades += 1;
    setupPerformance.set(trade.setup, current);
  }

  const rankedSetups = [...setupPerformance.entries()].sort((left, right) => right[1].total - left[1].total);

  return {
    totalTrades: trades.length,
    winRate,
    netPnl: trades.reduce((sum, trade) => sum + trade.resultUsd, 0),
    averageWinner: avgWin,
    averageLoser: avgLoss,
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? grossProfit : 0) : grossProfit / grossLoss,
    expectancy,
    maxDrawdown,
    bestSetup: rankedSetups[0]?.[0] ?? "No data",
    worstSetup: rankedSetups.at(-1)?.[0] ?? "No data",
    avgDiscipline: average(trades.map((trade) => trade.disciplineScore)),
    planFollowRate: trades.length ? (trades.filter((trade) => trade.followedPlan).length / trades.length) * 100 : 0,
    stopRespectRate: trades.length ? (trades.filter((trade) => trade.respectStopLoss).length / trades.length) * 100 : 0
  };
}

function buildPerformanceBySetup(trades: TradeRecord[]): PerformancePoint[] {
  const grouped = new Map<string, { pnl: number; wins: number; trades: number }>();

  for (const trade of trades) {
    const current = grouped.get(trade.setup) ?? { pnl: 0, wins: 0, trades: 0 };
    current.pnl += trade.resultUsd;
    current.trades += 1;
    current.wins += trade.resultUsd > 0 ? 1 : 0;
    grouped.set(trade.setup, current);
  }

  return [...grouped.entries()]
    .map(([label, data]) => ({
      label,
      value: data.pnl,
      trades: data.trades,
      winRate: data.trades ? (data.wins / data.trades) * 100 : 0
    }))
    .sort((left, right) => right.value - left.value);
}

function buildPerformanceByDayOfWeek(trades: TradeRecord[]): PerformancePoint[] {
  const base = weekdayLabels.map((label) => ({ label, value: 0, trades: 0, wins: 0 }));

  for (const trade of trades) {
    const index = getDay(parseISO(trade.date));
    base[index].value += trade.resultUsd;
    base[index].trades += 1;
    base[index].wins += trade.resultUsd > 0 ? 1 : 0;
  }

  return base.map((item) => ({
    label: item.label,
    value: item.value,
    trades: item.trades,
    winRate: item.trades ? (item.wins / item.trades) * 100 : 0
  }));
}

function buildDailyPerformance(trades: TradeRecord[]): PeriodPerformancePoint[] {
  return groupedCalendarPoints(trades).map((point) => ({
    label: format(parseISO(point.date), "MMM d"),
    pnl: point.pnl,
    trades: point.trades
  }));
}

function buildWeeklyPerformance(trades: TradeRecord[]): PeriodPerformancePoint[] {
  const grouped = new Map<string, PeriodPerformancePoint>();

  for (const trade of trades) {
    const weekStart = startOfWeek(parseISO(trade.date), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(parseISO(trade.date), { weekStartsOn: 1 });
    const label = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`;
    const current = grouped.get(label) ?? { label, pnl: 0, trades: 0 };
    current.pnl += trade.resultUsd;
    current.trades += 1;
    grouped.set(label, current);
  }

  return [...grouped.values()];
}

export function buildDashboardAnalytics(trades: TradeRecord[]): DashboardAnalytics {
  const orderedTrades = sortTrades(trades);
  let running = 0;

  const equityCurve = orderedTrades.map((trade) => {
    running += trade.resultUsd;
    return {
      label: `${format(parseISO(trade.date), "MMM d")} ${trade.instrument}`,
      cumulativePnl: running,
      tradePnl: trade.resultUsd
    };
  });

  const wins = orderedTrades.filter((trade) => trade.resultUsd > 0);
  const losses = orderedTrades.filter((trade) => trade.resultUsd < 0);

  return {
    summary: buildSummary(orderedTrades),
    equityCurve,
    winLossDistribution: [
      { name: "Wins", value: wins.length, amount: wins.reduce((sum, trade) => sum + trade.resultUsd, 0) },
      { name: "Losses", value: losses.length, amount: Math.abs(losses.reduce((sum, trade) => sum + trade.resultUsd, 0)) }
    ],
    performanceBySetup: buildPerformanceBySetup(orderedTrades),
    performanceByDayOfWeek: buildPerformanceByDayOfWeek(orderedTrades),
    dailyPerformance: buildDailyPerformance(orderedTrades),
    weeklyPerformance: buildWeeklyPerformance(orderedTrades),
    calendarPerformance: groupedCalendarPoints(orderedTrades)
  };
}

export function buildMonthCalendar(month: Date, dayPoints: CalendarDayPoint[]) {
  const start = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(month.getFullYear(), month.getMonth() + 1, 0), { weekStartsOn: 1 });
  const pointMap = new Map(dayPoints.map((point) => [point.date, point]));

  return eachDayOfInterval({ start, end }).map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return {
      date: key,
      dayNumber: format(day, "d"),
      isCurrentMonth: day.getMonth() === month.getMonth(),
      point: pointMap.get(key) ?? { date: key, pnl: 0, trades: 0 }
    };
  });
}
