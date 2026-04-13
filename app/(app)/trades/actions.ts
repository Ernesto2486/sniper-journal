"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getAuthState } from "@/lib/data";
import { toBoolean, toNumber, toOptionalString, toStringValue } from "@/lib/utils";

function buildTradePayload(formData: FormData) {
  return {
    date: toStringValue(formData.get("date")),
    time: toStringValue(formData.get("time")),
    market: toStringValue(formData.get("market")),
    instrument: toStringValue(formData.get("instrument")),
    setup: toStringValue(formData.get("setup")),
    direction: toStringValue(formData.get("direction")),
    entry_price: toNumber(formData.get("entry_price")),
    exit_price: toNumber(formData.get("exit_price")),
    stop_loss: toNumber(formData.get("stop_loss")),
    take_profit: toNumber(formData.get("take_profit")),
    size: toNumber(formData.get("size")),
    fees: toNumber(formData.get("fees")),
    result_usd: toNumber(formData.get("result_usd")),
    result_percent: toNumber(formData.get("result_percent")),
    notes: toStringValue(formData.get("notes")),
    followed_plan: toBoolean(formData.get("followed_plan")),
    revenge_trade: toBoolean(formData.get("revenge_trade")),
    fomo: toBoolean(formData.get("fomo")),
    overtrading: toBoolean(formData.get("overtrading")),
    respect_stop_loss: toBoolean(formData.get("respect_stop_loss")),
    pre_emotion: toStringValue(formData.get("pre_emotion")),
    during_emotion: toStringValue(formData.get("during_emotion")),
    post_emotion: toStringValue(formData.get("post_emotion")),
    mistake: toStringValue(formData.get("mistake")),
    lesson: toStringValue(formData.get("lesson")),
    discipline_score: Math.min(10, Math.max(1, toNumber(formData.get("discipline_score"), 7))),
    setup_tags: toStringValue(formData.get("setup_tags"))
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    screenshot_url: toOptionalString(formData.get("screenshot_url"))
  };
}

function refreshScreens() {
  revalidatePath("/dashboard");
  revalidatePath("/trades");
  revalidatePath("/analytics");
  revalidatePath("/calendar");
}

export async function createTradeAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/trades?error=Connect Supabase to save trades");
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    redirect("/login");
  }

  const payload = buildTradePayload(formData);
  const { error } = await supabase.from("trades").insert({
    user_id: auth.user.id,
    ...payload
  });

  if (error) {
    redirect(`/trades/new?error=${encodeURIComponent(error.message)}`);
  }

  refreshScreens();
  redirect("/trades?message=Trade created");
}

export async function updateTradeAction(id: string, formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/trades?error=Connect Supabase to edit trades");
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    redirect("/login");
  }

  const payload = buildTradePayload(formData);
  const { error } = await supabase.from("trades").update(payload).eq("id", id).eq("user_id", auth.user.id);

  if (error) {
    redirect(`/trades/${id}?error=${encodeURIComponent(error.message)}`);
  }

  refreshScreens();
  redirect(`/trades/${id}?message=Trade updated`);
}

export async function deleteTradeAction(id: string) {
  if (!hasSupabaseEnv()) {
    redirect("/trades?error=Connect Supabase to delete trades");
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    redirect("/login");
  }

  await supabase.from("trades").delete().eq("id", id).eq("user_id", auth.user.id);
  refreshScreens();
  redirect("/trades?message=Trade deleted");
}

export async function signOutAction() {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login");
}
