"use server";

import { revalidatePath } from "next/cache";
import { getAuthState } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DailyJournalRecord } from "@/lib/types";

type SaveJournalInput = Omit<DailyJournalRecord, "id" | "userId">;

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
