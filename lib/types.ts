export const MARKETS = ["Forex", "Futures", "Stocks", "Options", "Crypto"] as const;
export const DIRECTIONS = ["Long", "Short"] as const;

export type Market = (typeof MARKETS)[number];
export type Direction = (typeof DIRECTIONS)[number];

export interface TradingAccount {
  id: string;
  userId: string;
  accountName: string;
  broker: string;
  accountType: string;
  startingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRecord {
  id: string;
  userId: string;
  tradingAccountId: string | null;
  tradingAccountName: string;
  date: string;
  time: string;
  market: Market;
  instrument: string;
  setup: string;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  size: number;
  fees: number;
  resultUsd: number;
  resultPercent: number;
  notes: string;
  followedPlan: boolean;
  revengeTrade: boolean;
  fomo: boolean;
  overtrading: boolean;
  respectStopLoss: boolean;
  preEmotion: string;
  duringEmotion: string;
  postEmotion: string;
  mistake: string;
  lesson: string;
  disciplineScore: number;
  setupTags: string[];
  screenshotUrl: string | null;
  createdAt: string;
}

export type JournalChecklistKey =
  | "biasClear"
  | "inZone"
  | "liquiditySweep"
  | "weakPullback"
  | "volumeConfirms"
  | "aPlusSetup"
  | "rrMinimum";

export type DailyJournalAttachment = {
  id: string;
  type: "tradingview" | "image";
  label: string;
  url: string;
};

export interface DailyJournalRecord {
  id: string;
  userId: string;
  journalDate: string;
  mood: string;
  sleepHours: string;
  marketConditions: "Trending" | "Range" | "Volatile" | "News Day";
  notes: string;
  checklist: Record<JournalChecklistKey, boolean>;
  checklistScore: number;
  tradeStatus: "NO TRADE" | "A+ TRADE READY";
  attachments: DailyJournalAttachment[];
  todaysFocus: string[];
  playbooks: string[];
}

export interface DashboardSummary {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  averageWinner: number;
  averageLoser: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  averageRr: number;
  bestSetup: string;
  worstSetup: string;
  bestAccount: string;
  worstAccount: string;
  avgDiscipline: number;
  planFollowRate: number;
  stopRespectRate: number;
}

export interface EquityPoint {
  label: string;
  cumulativePnl: number;
  tradePnl: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
  amount: number;
}

export interface PerformancePoint {
  label: string;
  value: number;
  trades: number;
  winRate?: number;
}

export interface AccountPerformancePoint {
  accountId: string | null;
  label: string;
  pnl: number;
  trades: number;
  winRate: number;
  averageRr: number;
}

export interface PeriodPerformancePoint {
  label: string;
  pnl: number;
  trades: number;
}

export interface CalendarDayPoint {
  date: string;
  pnl: number;
  trades: number;
}

export interface TradeFilters {
  from?: string;
  to?: string;
  market?: string;
  setup?: string;
  account?: string;
  result?: "win" | "loss" | "all";
}

export interface DashboardAnalytics {
  summary: DashboardSummary;
  equityCurve: EquityPoint[];
  winLossDistribution: DistributionPoint[];
  performanceBySetup: PerformancePoint[];
  performanceByDayOfWeek: PerformancePoint[];
  performanceByAccount: AccountPerformancePoint[];
  dailyPerformance: PeriodPerformancePoint[];
  weeklyPerformance: PeriodPerformancePoint[];
  calendarPerformance: CalendarDayPoint[];
}

export interface AuthViewState {
  user: {
    id: string;
    email: string;
  } | null;
  isDemo: boolean;
}
