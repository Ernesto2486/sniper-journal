"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { toBoolean, toOptionalString, toStringValue } from "@/lib/utils";

function setupPayload(formData: FormData) {
  return {
    setup_name: toStringValue(formData.get("setup_name")),
    category: toStringValue(formData.get("category")),
    preferred_timeframe: toStringValue(formData.get("preferred_timeframe")),
    description: toStringValue(formData.get("description")),
    entry_rules: toStringValue(formData.get("entry_rules")),
    risk_rules: toStringValue(formData.get("risk_rules")),
    confirmation_rules: toStringValue(formData.get("confirmation_rules")),
    avoid_conditions: toStringValue(formData.get("avoid_conditions")),
    screenshot_url: toOptionalString(formData.get("screenshot_url")),
    notes: toStringValue(formData.get("notes")),
    is_favorite: toBoolean(formData.get("is_favorite")),
    updated_at: new Date().toISOString()
  };
}

async function setupClient() {
  if (!hasSupabaseEnv()) {
    redirect("/setups?error=Connect Supabase to manage setups");
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    redirect("/login");
  }

  return { supabase, userId: auth.user.id };
}

function refreshSetups() {
  revalidatePath("/setups");
  revalidatePath("/trades/new");
  revalidatePath("/trades");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
}

export async function createSetupAction(formData: FormData) {
  const { supabase, userId } = await setupClient();
  const { error } = await supabase.from("setups").insert({
    user_id: userId,
    ...setupPayload(formData)
  });

  if (error) {
    redirect(`/setups?error=${encodeURIComponent(error.message)}`);
  }

  refreshSetups();
  redirect("/setups?message=Setup created");
}

export async function updateSetupAction(id: string, formData: FormData) {
  const { supabase, userId } = await setupClient();
  const { error } = await supabase
    .from("setups")
    .update(setupPayload(formData))
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/setups?error=${encodeURIComponent(error.message)}`);
  }

  refreshSetups();
  redirect("/setups?message=Setup updated");
}

export async function deleteSetupAction(id: string) {
  const { supabase, userId } = await setupClient();
  const { error } = await supabase.from("setups").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    redirect(`/setups?error=${encodeURIComponent(error.message)}`);
  }

  refreshSetups();
  redirect("/setups?message=Setup deleted");
}

export async function toggleFavoriteSetupAction(id: string, isFavorite: boolean) {
  const { supabase, userId } = await setupClient();
  const { error } = await supabase
    .from("setups")
    .update({ is_favorite: !isFavorite, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    redirect(`/setups?error=${encodeURIComponent(error.message)}`);
  }

  refreshSetups();
  redirect("/setups?message=Setup updated");
}
