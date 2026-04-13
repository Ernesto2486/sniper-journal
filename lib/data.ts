import { cache } from "react";
import { redirect } from "next/navigation";
import { buildDashboardAnalytics, sortTrades } from "@/lib/analytics";
import { demoTrades } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AuthViewState, DashboardAnalytics, TradeRecord } from "@/lib/types";

function mapTrade(row: Record<string, unknown>): TradeRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.date),
    time: String(row.time),
    market: String(row.market) as TradeRecord["market"],
    instrument: String(row.instrument),
    setup: String(row.setup),
    direction: String(row.direction) as TradeRecord["direction"],
    entryPrice: Number(row.entry_price),
    exitPrice: Number(row.exit_price),
    stopLoss: Number(row.stop_loss),
    takeProfit: Number(row.take_profit),
    size: Number(row.size),
    fees: Number(row.fees),
    resultUsd: Number(row.result_usd),
    resultPercent: Number(row.result_percent),
    notes: String(row.notes ?? ""),
    followedPlan: Boolean(row.followed_plan),
    revengeTrade: Boolean(row.revenge_trade),
    fomo: Boolean(row.fomo),
    overtrading: Boolean(row.overtrading),
    respectStopLoss: Boolean(row.respect_stop_loss),
    preEmotion: String(row.pre_emotion ?? ""),
    duringEmotion: String(row.during_emotion ?? ""),
    postEmotion: String(row.post_emotion ?? ""),
    mistake: String(row.mistake ?? ""),
    lesson: String(row.lesson ?? ""),
    disciplineScore: Number(row.discipline_score),
    setupTags: Array.isArray(row.setup_tags) ? row.setup_tags.map(String) : [],
    screenshotUrl: row.screenshot_url ? String(row.screenshot_url) : null,
    createdAt: String(row.created_at)
  };
}

export const getAuthState = cache(async (): Promise<AuthViewState> => {
  if (!hasSupabaseEnv()) {
    return { user: null, isDemo: true };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { user: null, isDemo: true };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return {
    user: user ? { id: user.id, email: user.email ?? "" } : null,
    isDemo: false
  };
});

export async function requireUser() {
  const auth = await getAuthState();

  if (!auth.isDemo && !auth.user) {
    redirect("/login");
  }

  return auth;
}

export const getTrades = cache(async (): Promise<TradeRecord[]> => {
  const auth = await getAuthState();
  if (auth.isDemo) {
    return sortTrades(demoTrades);
  }

  const supabase = await createClient();
  if (!supabase || !auth.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error || !data) {
    return [];
  }

  return sortTrades(data.map((row) => mapTrade(row as Record<string, unknown>)));
});

export async function getTradeById(id: string) {
  const trades = await getTrades();
  return trades.find((trade) => trade.id === id) ?? null;
}

export async function getDashboardData(): Promise<{
  trades: TradeRecord[];
  analytics: DashboardAnalytics;
  auth: AuthViewState;
}> {
  const auth = await requireUser();
  const trades = await getTrades();

  return {
    trades,
    analytics: buildDashboardAnalytics(trades),
    auth
  };
}
