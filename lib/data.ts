import { cache } from "react";
import { redirect } from "next/navigation";
import { buildDashboardAnalytics, sortTrades } from "@/lib/analytics";
import { demoAccounts, demoTrades } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AuthViewState, DashboardAnalytics, TradeRecord, TradingAccount } from "@/lib/types";

function mapTradingAccount(row: Record<string, unknown>): TradingAccount {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    accountName: String(row.account_name),
    broker: String(row.broker ?? ""),
    accountType: String(row.account_type ?? ""),
    startingBalance: Number(row.starting_balance ?? 0),
    currentBalance: Number(row.current_balance ?? 0),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at)
  };
}

function mapTrade(row: Record<string, unknown>, accounts: TradingAccount[] = []): TradeRecord {
  const tradingAccountId = row.trading_account_id ? String(row.trading_account_id) : null;
  const accountName = accounts.find((account) => account.id === tradingAccountId)?.accountName ?? "Unassigned";

  return {
    id: String(row.id),
    userId: String(row.user_id),
    tradingAccountId,
    tradingAccountName: accountName,
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

export const getTradingAccounts = cache(async (): Promise<TradingAccount[]> => {
  const auth = await getAuthState();

  if (auth.isDemo) {
    return demoAccounts;
  }

  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return [];
  }

  const { data, error } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  if (data?.length) {
    return data.map((row) => mapTradingAccount(row as Record<string, unknown>));
  }

  const { data: created, error: createError } = await supabase
    .from("trading_accounts")
    .insert({
      user_id: auth.user.id,
      account_name: "Main Account",
      account_type: "Default",
      starting_balance: 0,
      current_balance: 0,
      is_active: true
    })
    .select("*")
    .single();

  if (createError || !created) {
    return [];
  }

  return [mapTradingAccount(created as Record<string, unknown>)];
});

export async function getDefaultTradingAccount() {
  const accounts = await getTradingAccounts();
  return accounts.find((account) => account.isActive) ?? accounts[0] ?? null;
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

  const accounts = await getTradingAccounts();

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("is_pro")
    .eq("email", auth.user.email)
    .maybeSingle();

  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  if (error || !data) {
    return [];
  }

  const tradesData = sortTrades(
    data.map((row) => mapTrade(row as Record<string, unknown>, accounts))
  );

  if (!subscription || !subscription.is_pro) {
    return tradesData.slice(0, 5);
  }

  return tradesData;
});

export async function getTradeById(id: string) {
  const trades = await getTrades();
  return trades.find((trade) => trade.id === id) ?? null;
}

export async function getDashboardData(): Promise<{
  trades: TradeRecord[];
  accounts: TradingAccount[];
  analytics: DashboardAnalytics;
  auth: AuthViewState;
  subscription: {
    is_pro: boolean | null;
    subscription_status: string | null;
  } | null;
}> {
  const auth = await requireUser();
  const [trades, accounts] = await Promise.all([getTrades(), getTradingAccounts()]);
  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return {
      trades,
      accounts,
      analytics: buildDashboardAnalytics(trades),
      auth,
      subscription: null,
    };
  }

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("is_pro, subscription_status")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return {
    trades,
    accounts,
    analytics: buildDashboardAnalytics(trades),
    auth,
    subscription,
  };
}
