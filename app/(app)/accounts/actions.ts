"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { toBoolean, toNumber, toOptionalString, toStringValue } from "@/lib/utils";

function accountPayload(formData: FormData) {
  return {
    account_name: toStringValue(formData.get("account_name")),
    broker: toOptionalString(formData.get("broker")),
    account_type: toOptionalString(formData.get("account_type")),
    starting_balance: toNumber(formData.get("starting_balance")),
    current_balance: toNumber(formData.get("current_balance")),
    is_active: toBoolean(formData.get("is_active"))
  };
}

function refreshAccountScreens() {
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/trades");
  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/journal");
}

export async function createAccountAction(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/accounts?error=Connect Supabase to create accounts");
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    redirect("/login");
  }

  const payload = accountPayload(formData);
  if (!payload.account_name) {
    redirect("/accounts?error=Account name is required");
  }

  const { error } = await supabase.from("trading_accounts").insert({
    user_id: auth.user.id,
    ...payload
  });

  if (error) {
    redirect(`/accounts?error=${encodeURIComponent(error.message)}`);
  }

  refreshAccountScreens();
  redirect("/accounts?message=Account created");
}

export async function updateAccountAction(id: string, formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/accounts?error=Connect Supabase to edit accounts");
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    redirect("/login");
  }

  const payload = accountPayload(formData);
  if (!payload.account_name) {
    redirect("/accounts?error=Account name is required");
  }

  const { error } = await supabase
    .from("trading_accounts")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    redirect(`/accounts?error=${encodeURIComponent(error.message)}`);
  }

  refreshAccountScreens();
  redirect("/accounts?message=Account updated");
}

export async function archiveAccountAction(id: string) {
  if (!hasSupabaseEnv()) {
    redirect("/accounts?error=Connect Supabase to archive accounts");
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("trading_accounts")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    redirect(`/accounts?error=${encodeURIComponent(error.message)}`);
  }

  refreshAccountScreens();
  redirect("/accounts?message=Account archived");
}
