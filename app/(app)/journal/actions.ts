"use server";

import { revalidatePath } from "next/cache";
import { getAuthState } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DailyJournalRecord, WeeklyPlanRecord, WeeklyPlanWatchlistRow, WeeklyReviewRecord } from "@/lib/types";

type SaveJournalInput = Omit<DailyJournalRecord, "id" | "userId">;
type SaveWeeklyReviewInput = Omit<WeeklyReviewRecord, "id" | "userId">;
type SaveWeeklyPlanInput = Omit<WeeklyPlanRecord, "id" | "userId">;

function mapDailyJournal(row: Record<string, unknown>): DailyJournalRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    journalDate: String(row.journal_date),
    mood: String(row.mood ?? ""),
    sleepHours: row.sleep_hours === null || row.sleep_hours === undefined ? "" : String(row.sleep_hours),
    marketConditions: String(row.market_conditions ?? "Trending") as DailyJournalRecord["marketConditions"],
    notes: String(row.notes ?? ""),
    checklist: (row.checklist ?? {}) as DailyJournalRecord["checklist"],
    checklistScore: Number(row.checklist_score ?? 0),
    tradeStatus: String(row.trade_status ?? "NO TRADE") as DailyJournalRecord["tradeStatus"],
    attachments: Array.isArray(row.attachments) ? row.attachments as DailyJournalRecord["attachments"] : [],
    todaysFocus: Array.isArray(row.todays_focus) ? row.todays_focus.map(String) : [],
    playbooks: Array.isArray(row.playbooks) ? row.playbooks.map(String) : []
  };
}

export async function loadJournalAction(journalDate: string): Promise<DailyJournalRecord | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const auth = await getAuthState();
  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return null;
  }

  const { data } = await supabase
    .from("daily_journal")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("journal_date", journalDate)
    .maybeSingle();

  return data ? mapDailyJournal(data as Record<string, unknown>) : null;
}

export async function saveJournalAction(input: SaveJournalInput) {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Connect Supabase to save daily journal entries." };
  }

  const auth = await getAuthState();
  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return { ok: false, message: "Sign in to save daily journal entries." };
  }

  const payload = {
    user_id: auth.user.id,
    journal_date: input.journalDate,
    mood: input.mood,
    sleep_hours: input.sleepHours === "" ? null : Number(input.sleepHours),
    market_conditions: input.marketConditions,
    notes: input.notes,
    checklist: input.checklist,
    checklist_score: input.checklistScore,
    trade_status: input.tradeStatus,
    attachments: input.attachments,
    todays_focus: input.todaysFocus,
    playbooks: input.playbooks
  };

  const { error } = await supabase
    .from("daily_journal")
    .upsert(payload, { onConflict: "user_id,journal_date" });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/journal");
  return { ok: true, message: "Saved" };
}

function mapWeeklyReview(row: Record<string, unknown>): WeeklyReviewRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    accountId: row.account_id ? String(row.account_id) : null,
    weekStartDate: String(row.week_start_date),
    bestTrade: String(row.best_trade ?? ""),
    worstTrade: String(row.worst_trade ?? ""),
    bestSetup: String(row.best_setup ?? ""),
    worstMistake: String(row.worst_mistake ?? ""),
    emotionalState: String(row.emotional_state ?? ""),
    disciplineGrade: String(row.discipline_grade ?? ""),
    executionGrade: String(row.execution_grade ?? ""),
    whatWorked: String(row.what_worked ?? ""),
    whatFailed: String(row.what_failed ?? ""),
    needsImprovement: String(row.needs_improvement ?? ""),
    followedPlan: String(row.followed_plan ?? ""),
    forcedTrades: String(row.forced_trades ?? ""),
    improveNextWeek: String(row.improve_next_week ?? "")
  };
}

export async function loadWeeklyReviewAction(weekStartDate: string, accountId: string | null): Promise<WeeklyReviewRecord | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const auth = await getAuthState();
  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return null;
  }

  let query = supabase
    .from("weekly_reviews")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("week_start_date", weekStartDate);

  query = accountId ? query.eq("account_id", accountId) : query.is("account_id", null);
  const { data } = await query.maybeSingle();

  return data ? mapWeeklyReview(data as Record<string, unknown>) : null;
}

export async function saveWeeklyReviewAction(input: SaveWeeklyReviewInput) {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Connect Supabase to save weekly reviews." };
  }

  const auth = await getAuthState();
  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return { ok: false, message: "Sign in to save weekly reviews." };
  }

  const payload = {
    user_id: auth.user.id,
    account_id: input.accountId,
    week_start_date: input.weekStartDate,
    best_trade: input.bestTrade,
    worst_trade: input.worstTrade,
    best_setup: input.bestSetup,
    worst_mistake: input.worstMistake,
    emotional_state: input.emotionalState,
    discipline_grade: input.disciplineGrade,
    execution_grade: input.executionGrade,
    what_worked: input.whatWorked,
    what_failed: input.whatFailed,
    needs_improvement: input.needsImprovement,
    followed_plan: input.followedPlan,
    forced_trades: input.forcedTrades,
    improve_next_week: input.improveNextWeek
  };

  let existingQuery = supabase
    .from("weekly_reviews")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("week_start_date", input.weekStartDate);

  existingQuery = input.accountId ? existingQuery.eq("account_id", input.accountId) : existingQuery.is("account_id", null);
  const { data: existing } = await existingQuery.maybeSingle();

  const { error } = existing?.id
    ? await supabase.from("weekly_reviews").update(payload).eq("id", existing.id)
    : await supabase.from("weekly_reviews").insert(payload);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/journal");
  return { ok: true, message: "Saved" };
}
function normalizeWatchlistRow(row: unknown): WeeklyPlanWatchlistRow {
  const item = typeof row === "object" && row !== null ? row as Partial<WeeklyPlanWatchlistRow> : {};
  return {
    id: String(item.id || crypto.randomUUID()),
    symbol: String(item.symbol ?? ""),
    bias: item.bias === "Bullish" || item.bias === "Bearish" || item.bias === "Range" || item.bias === "Neutral" ? item.bias : "Neutral",
    keyLevels: String(item.keyLevels ?? ""),
    mainSetup: String(item.mainSetup ?? ""),
    riskPlan: String(item.riskPlan ?? ""),
    notes: String(item.notes ?? ""),
    chartLink: String(item.chartLink ?? ""),
    screenshotLink: String(item.screenshotLink ?? ""),
    tradeIdea: String(item.tradeIdea ?? ""),
    invalidationLevel: String(item.invalidationLevel ?? ""),
    triggerEntryPlan: String(item.triggerEntryPlan ?? "")
  };
}
function mapWeeklyPlan(row: Record<string, unknown>): WeeklyPlanRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    accountId: row.account_id ? String(row.account_id) : null,
    weekStartDate: String(row.week_start_date),
    mainGoal: String(row.main_goal ?? ""),
    maxWeeklyRisk: String(row.max_weekly_risk ?? ""),
    dailyMaxLoss: String(row.daily_max_loss ?? ""),
    psychologyFocus: String(row.psychology_focus ?? ""),
    rulesForWeek: String(row.rules_for_week ?? ""),
    allowedSetups: String(row.allowed_setups ?? ""),
    setupsToAvoid: String(row.setups_to_avoid ?? ""),
    stopTradingConditions: String(row.stop_trading_conditions ?? ""),
    watchlist: Array.isArray(row.watchlist) ? row.watchlist.map(normalizeWatchlistRow) : []
  };
}

export async function loadWeeklyPlanAction(weekStartDate: string, accountId: string | null): Promise<WeeklyPlanRecord | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const auth = await getAuthState();
  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return null;
  }

  let query = supabase
    .from("weekly_plans")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("week_start_date", weekStartDate);

  query = accountId ? query.eq("account_id", accountId) : query.is("account_id", null);
  const { data } = await query.maybeSingle();

  return data ? mapWeeklyPlan(data as Record<string, unknown>) : null;
}

export async function saveWeeklyPlanAction(input: SaveWeeklyPlanInput) {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Connect Supabase to save weekly plans." };
  }

  const auth = await getAuthState();
  const supabase = await createClient();

  if (!supabase || !auth.user) {
    return { ok: false, message: "Sign in to save weekly plans." };
  }

  const payload = {
    user_id: auth.user.id,
    account_id: input.accountId,
    week_start_date: input.weekStartDate,
    main_goal: input.mainGoal,
    max_weekly_risk: input.maxWeeklyRisk,
    daily_max_loss: input.dailyMaxLoss,
    psychology_focus: input.psychologyFocus,
    rules_for_week: input.rulesForWeek,
    allowed_setups: input.allowedSetups,
    setups_to_avoid: input.setupsToAvoid,
    stop_trading_conditions: input.stopTradingConditions,
    watchlist: input.watchlist
  };

  let existingQuery = supabase
    .from("weekly_plans")
    .select("id")
    .eq("user_id", auth.user.id)
    .eq("week_start_date", input.weekStartDate);

  existingQuery = input.accountId ? existingQuery.eq("account_id", input.accountId) : existingQuery.is("account_id", null);
  const { data: existing } = await existingQuery.maybeSingle();

  const { error } = existing?.id
    ? await supabase.from("weekly_plans").update(payload).eq("id", existing.id)
    : await supabase.from("weekly_plans").insert(payload);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/journal");
  return { ok: true, message: "Saved" };
}