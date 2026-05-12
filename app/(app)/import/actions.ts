"use server";

import { revalidatePath } from "next/cache";
import { getAuthState } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Market, TradingAccount } from "@/lib/types";

const MARKETS = new Set(["Forex", "Futures", "Stocks", "Options", "Crypto"]);
const DIRECTIONS = new Set(["Long", "Short"]);

type ImportColumnKey =
  | "date"
  | "time"
  | "market"
  | "instrument"
  | "direction"
  | "entryPrice"
  | "exitPrice"
  | "stopLoss"
  | "takeProfit"
  | "size"
  | "fees"
  | "resultUsd"
  | "account"
  | "setup"
  | "notes";

type ImportTradeRow = Record<string, string>;

type ImportRequest = {
  rows: ImportTradeRow[];
  mapping: Partial<Record<ImportColumnKey, string>>;
  fallbackAccountId: string;
  createMissingAccounts: boolean;
};

type ImportFailure = {
  rowNumber: number;
  reason: string;
};

function cell(row: ImportTradeRow, key?: string) {
  return key ? String(row[key] ?? "").trim() : "";
}

function numberFrom(value: string) {
  const cleaned = value.replace(/[$,%\s,]/g, "").replace(/^\((.*)\)$/, "-$1");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "09:30";
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) {
    return trimmed.length === 5 ? trimmed : "09:30";
  }

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function normalizeMarket(value: string): Market {
  const lower = value.toLowerCase();
  if (lower.includes("future")) return "Futures";
  if (lower.includes("forex") || lower.includes("fx")) return "Forex";
  if (lower.includes("option")) return "Options";
  if (lower.includes("crypto")) return "Crypto";
  if (lower.includes("stock") || lower.includes("equity")) return "Stocks";
  return MARKETS.has(value) ? value as Market : "Stocks";
}

function normalizeDirection(value: string, resultUsd: number, entryPrice: number, exitPrice: number) {
  const lower = value.toLowerCase();
  if (["short", "sell", "sold", "s"].includes(lower)) return "Short";
  if (["long", "buy", "bought", "l"].includes(lower)) return "Long";
  if (DIRECTIONS.has(value)) return value;

  if (Number.isFinite(resultUsd) && Number.isFinite(entryPrice) && Number.isFinite(exitPrice) && entryPrice !== exitPrice) {
    const longPnlMatches = Math.sign(exitPrice - entryPrice) === Math.sign(resultUsd);
    return longPnlMatches ? "Long" : "Short";
  }

  return "Long";
}

function optionalNumber(value: string, fallback: number) {
  if (!value.trim()) {
    return fallback;
  }

  const parsed = numberFrom(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function duplicateKey(values: {
  date: string;
  time: string;
  instrument: string;
  direction: string;
  size: number;
  entryPrice: number;
  exitPrice: number;
  resultUsd: number;
}) {
  return [
    values.date,
    values.time.slice(0, 5),
    values.instrument.trim().toUpperCase(),
    values.direction,
    values.size.toFixed(4),
    values.entryPrice.toFixed(4),
    values.exitPrice.toFixed(4),
    values.resultUsd.toFixed(2)
  ].join("|");
}

function mapAccount(row: Record<string, unknown>): TradingAccount {
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

export async function importTradesAction(request: ImportRequest) {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Connect Supabase to import trades.", totalRows: request.rows.length, importedRows: 0, skippedDuplicates: 0, failedRows: request.rows.length, failures: [] as ImportFailure[] };
  }

  const auth = await getAuthState();
  const supabase = await createClient();
  if (!supabase || !auth.user) {
    return { ok: false, message: "Sign in to import trades.", totalRows: request.rows.length, importedRows: 0, skippedDuplicates: 0, failedRows: request.rows.length, failures: [] as ImportFailure[] };
  }

  const { data: accountRows } = await supabase
    .from("trading_accounts")
    .select("*")
    .eq("user_id", auth.user.id);

  const accounts = new Map<string, TradingAccount>();
  const accountsByName = new Map<string, TradingAccount>();
  for (const row of accountRows ?? []) {
    const account = mapAccount(row as Record<string, unknown>);
    accounts.set(account.id, account);
    accountsByName.set(account.accountName.trim().toLowerCase(), account);
  }

  let fallbackAccount = accounts.get(request.fallbackAccountId) ?? [...accounts.values()].find((account) => account.isActive) ?? [...accounts.values()][0];
  if (!fallbackAccount) {
    const { data: created } = await supabase
      .from("trading_accounts")
      .insert({ user_id: auth.user.id, account_name: "Main Account", is_active: true })
      .select("*")
      .single();

    if (created) {
      fallbackAccount = mapAccount(created as Record<string, unknown>);
      accounts.set(fallbackAccount.id, fallbackAccount);
      accountsByName.set(fallbackAccount.accountName.toLowerCase(), fallbackAccount);
    }
  }

  const { data: existingRows } = await supabase
    .from("trades")
    .select("date,time,instrument,direction,size,entry_price,exit_price,result_usd")
    .eq("user_id", auth.user.id);

  const existingKeys = new Set(
    (existingRows ?? []).map((row: Record<string, unknown>) => duplicateKey({
      date: String(row.date),
      time: String(row.time),
      instrument: String(row.instrument),
      direction: String(row.direction),
      size: Number(row.size),
      entryPrice: Number(row.entry_price),
      exitPrice: Number(row.exit_price),
      resultUsd: Number(row.result_usd)
    }))
  );

  const failures: ImportFailure[] = [];
  const inserts: Array<Record<string, unknown>> = [];
  let skippedDuplicates = 0;

  for (const [index, row] of request.rows.entries()) {
    const rowNumber = index + 2;
    const date = normalizeDate(cell(row, request.mapping.date));
    const time = normalizeTime(cell(row, request.mapping.time));
    const instrument = cell(row, request.mapping.instrument).toUpperCase();
    const market = normalizeMarket(cell(row, request.mapping.market));
    const entryPrice = numberFrom(cell(row, request.mapping.entryPrice));
    const exitPrice = numberFrom(cell(row, request.mapping.exitPrice));
    const size = numberFrom(cell(row, request.mapping.size));
    const fees = optionalNumber(cell(row, request.mapping.fees), 0);
    const resultUsd = numberFrom(cell(row, request.mapping.resultUsd));
    const direction = normalizeDirection(cell(row, request.mapping.direction), resultUsd, entryPrice, exitPrice);
    const stopLoss = optionalNumber(cell(row, request.mapping.stopLoss), entryPrice);
    const takeProfit = optionalNumber(cell(row, request.mapping.takeProfit), exitPrice);
    const setup = cell(row, request.mapping.setup) || "Imported";
    const notes = cell(row, request.mapping.notes);

    if (!date || !time || !instrument || !Number.isFinite(entryPrice) || !Number.isFinite(exitPrice) || !Number.isFinite(size) || !Number.isFinite(resultUsd)) {
      failures.push({ rowNumber, reason: "Missing or invalid required trade fields." });
      continue;
    }

    const key = duplicateKey({ date, time, instrument, direction, size, entryPrice, exitPrice, resultUsd });
    if (existingKeys.has(key)) {
      skippedDuplicates += 1;
      continue;
    }

    let accountId = fallbackAccount?.id ?? null;
    const accountName = cell(row, request.mapping.account);
    if (accountName) {
      const normalizedName = accountName.toLowerCase();
      const existingAccount = accountsByName.get(normalizedName);
      if (existingAccount) {
        accountId = existingAccount.id;
      } else if (request.createMissingAccounts) {
        const { data: created, error } = await supabase
          .from("trading_accounts")
          .insert({ user_id: auth.user.id, account_name: accountName, is_active: true })
          .select("*")
          .single();

        if (error || !created) {
          failures.push({ rowNumber, reason: `Could not create account ${accountName}.` });
          continue;
        }

        const createdAccount = mapAccount(created as Record<string, unknown>);
        accounts.set(createdAccount.id, createdAccount);
        accountsByName.set(normalizedName, createdAccount);
        accountId = createdAccount.id;
      }
    }

    const resultPercent = entryPrice && size ? (resultUsd / Math.abs(entryPrice * size)) * 100 : 0;
    inserts.push({
      user_id: auth.user.id,
      trading_account_id: accountId,
      date,
      time,
      market,
      instrument,
      setup,
      direction,
      entry_price: entryPrice,
      exit_price: exitPrice,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      size,
      fees,
      result_usd: resultUsd,
      result_percent: resultPercent,
      notes,
      followed_plan: true,
      revenge_trade: false,
      fomo: false,
      overtrading: false,
      respect_stop_loss: true,
      pre_emotion: "",
      during_emotion: "",
      post_emotion: "",
      mistake: "",
      lesson: "",
      discipline_score: 7,
      setup_tags: ["imported"],
      screenshot_url: null
    });
    existingKeys.add(key);
  }

  if (inserts.length) {
    const { error } = await supabase.from("trades").insert(inserts);
    if (error) {
      return { ok: false, message: error.message, totalRows: request.rows.length, importedRows: 0, skippedDuplicates, failedRows: request.rows.length - skippedDuplicates, failures };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/trades");
  revalidatePath("/analytics");
  revalidatePath("/calendar");
  revalidatePath("/journal");
  revalidatePath("/accounts");
  revalidatePath("/import");

  return {
    ok: true,
    message: "Import complete",
    totalRows: request.rows.length,
    importedRows: inserts.length,
    skippedDuplicates,
    failedRows: failures.length,
    failures
  };
}

