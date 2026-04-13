"use client";

import { useState } from "react";
import { DIRECTIONS, MARKETS, type TradeRecord } from "@/lib/types";

type TradeAction = (formData: FormData) => void | Promise<void>;

function initialFromTrade(trade?: TradeRecord | null) {
  return {
    date: trade?.date ?? new Date().toISOString().slice(0, 10),
    time: trade?.time ?? "09:30",
    market: trade?.market ?? "Stocks",
    instrument: trade?.instrument ?? "",
    setup: trade?.setup ?? "",
    direction: trade?.direction ?? "Long",
    entryPrice: String(trade?.entryPrice ?? ""),
    exitPrice: String(trade?.exitPrice ?? ""),
    stopLoss: String(trade?.stopLoss ?? ""),
    takeProfit: String(trade?.takeProfit ?? ""),
    size: String(trade?.size ?? ""),
    fees: String(trade?.fees ?? 0),
    resultUsd: String(trade?.resultUsd ?? ""),
    resultPercent: String(trade?.resultPercent ?? ""),
    notes: trade?.notes ?? "",
    followedPlan: trade?.followedPlan ?? true,
    revengeTrade: trade?.revengeTrade ?? false,
    fomo: trade?.fomo ?? false,
    overtrading: trade?.overtrading ?? false,
    respectStopLoss: trade?.respectStopLoss ?? true,
    preEmotion: trade?.preEmotion ?? "",
    duringEmotion: trade?.duringEmotion ?? "",
    postEmotion: trade?.postEmotion ?? "",
    mistake: trade?.mistake ?? "",
    lesson: trade?.lesson ?? "",
    disciplineScore: String(trade?.disciplineScore ?? 7),
    setupTags: trade?.setupTags.join(", ") ?? "",
    screenshotUrl: trade?.screenshotUrl ?? ""
  };
}

function numberFromInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function TradeForm({
  trade,
  action,
  isDemo
}: {
  trade?: TradeRecord | null;
  action: TradeAction;
  isDemo: boolean;
}) {
  const [values, setValues] = useState(initialFromTrade(trade));

  const entry = numberFromInput(values.entryPrice);
  const exit = numberFromInput(values.exitPrice);
  const size = numberFromInput(values.size);
  const fees = numberFromInput(values.fees);
  const estimatedPnl = values.direction === "Long" ? (exit - entry) * size - fees : (entry - exit) * size - fees;
  const estimatedPercent = entry ? (estimatedPnl / Math.abs(entry * size || 1)) * 100 : 0;

  return (
    <form action={action} className="space-y-8">
      {isDemo ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Demo mode is read-only. Connect Supabase to save trades.
        </div>
      ) : null}

      <section className="panel p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{trade ? "Edit trade" : "Log a new trade"}</h2>
            <p className="mt-2 text-sm text-slate-400">Capture execution details, market context, and behavior on the same record.</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Estimated: {estimatedPnl.toFixed(2)} USD | {estimatedPercent.toFixed(2)}%
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="Date">
            <input className="field" type="date" name="date" value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} required />
          </FormField>
          <FormField label="Time">
            <input className="field" type="time" name="time" value={values.time} onChange={(event) => setValues({ ...values, time: event.target.value })} required />
          </FormField>
          <FormField label="Market">
            <select className="field" name="market" value={values.market} onChange={(event) => setValues({ ...values, market: event.target.value })}>
              {MARKETS.map((market) => (
                <option key={market}>{market}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Instrument">
            <input className="field" name="instrument" value={values.instrument} onChange={(event) => setValues({ ...values, instrument: event.target.value })} placeholder="SPY, NQ, AAPL" required />
          </FormField>
          <FormField label="Setup">
            <input className="field" name="setup" value={values.setup} onChange={(event) => setValues({ ...values, setup: event.target.value })} placeholder="Sniper Pullback" required />
          </FormField>
          <FormField label="Direction">
            <select className="field" name="direction" value={values.direction} onChange={(event) => setValues({ ...values, direction: event.target.value })}>
              {DIRECTIONS.map((direction) => (
                <option key={direction}>{direction}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Entry Price">
            <input className="field" type="number" step="0.0001" name="entry_price" value={values.entryPrice} onChange={(event) => setValues({ ...values, entryPrice: event.target.value })} required />
          </FormField>
          <FormField label="Exit Price">
            <input className="field" type="number" step="0.0001" name="exit_price" value={values.exitPrice} onChange={(event) => setValues({ ...values, exitPrice: event.target.value })} required />
          </FormField>
          <FormField label="Stop Loss">
            <input className="field" type="number" step="0.0001" name="stop_loss" value={values.stopLoss} onChange={(event) => setValues({ ...values, stopLoss: event.target.value })} required />
          </FormField>
          <FormField label="Take Profit">
            <input className="field" type="number" step="0.0001" name="take_profit" value={values.takeProfit} onChange={(event) => setValues({ ...values, takeProfit: event.target.value })} required />
          </FormField>
          <FormField label="Contracts / Size">
            <input className="field" type="number" step="0.0001" name="size" value={values.size} onChange={(event) => setValues({ ...values, size: event.target.value })} required />
          </FormField>
          <FormField label="Fees">
            <input className="field" type="number" step="0.01" name="fees" value={values.fees} onChange={(event) => setValues({ ...values, fees: event.target.value })} required />
          </FormField>
          <FormField label="Result USD">
            <input className="field" type="number" step="0.01" name="result_usd" value={values.resultUsd} onChange={(event) => setValues({ ...values, resultUsd: event.target.value })} placeholder={estimatedPnl.toFixed(2)} required />
          </FormField>
          <FormField label="Result %">
            <input className="field" type="number" step="0.01" name="result_percent" value={values.resultPercent} onChange={(event) => setValues({ ...values, resultPercent: event.target.value })} placeholder={estimatedPercent.toFixed(2)} required />
          </FormField>
          <FormField label="Setup Tags">
            <input className="field" name="setup_tags" value={values.setupTags} onChange={(event) => setValues({ ...values, setupTags: event.target.value })} placeholder="breakout, trend-day, A+" />
          </FormField>
          <FormField label="Screenshot URL">
            <input className="field" name="screenshot_url" value={values.screenshotUrl} onChange={(event) => setValues({ ...values, screenshotUrl: event.target.value })} placeholder="Optional image URL" />
          </FormField>
        </div>
      </section>

      <section className="panel grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Psychology tracking</h3>
          <p className="mt-2 text-sm text-slate-400">This section is intentionally first-class so execution quality is measured alongside P/L.</p>
          <div className="mt-6 grid gap-3">
            <BooleanField label="Followed plan" name="followed_plan" checked={values.followedPlan} onToggle={() => setValues({ ...values, followedPlan: !values.followedPlan })} />
            <BooleanField label="Revenge trade" name="revenge_trade" checked={values.revengeTrade} onToggle={() => setValues({ ...values, revengeTrade: !values.revengeTrade })} />
            <BooleanField label="FOMO" name="fomo" checked={values.fomo} onToggle={() => setValues({ ...values, fomo: !values.fomo })} />
            <BooleanField label="Overtrading" name="overtrading" checked={values.overtrading} onToggle={() => setValues({ ...values, overtrading: !values.overtrading })} />
            <BooleanField label="Respected stop loss" name="respect_stop_loss" checked={values.respectStopLoss} onToggle={() => setValues({ ...values, respectStopLoss: !values.respectStopLoss })} />
          </div>
          <div className="mt-5">
            <label className="label">Discipline Score</label>
            <input className="field" type="range" name="discipline_score" min="1" max="10" value={values.disciplineScore} onChange={(event) => setValues({ ...values, disciplineScore: event.target.value })} />
            <p className="mt-2 text-sm text-slate-300">{values.disciplineScore}/10</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Pre-trade emotion">
            <textarea className="field min-h-28" name="pre_emotion" value={values.preEmotion} onChange={(event) => setValues({ ...values, preEmotion: event.target.value })} />
          </FormField>
          <FormField label="During-trade emotion">
            <textarea className="field min-h-28" name="during_emotion" value={values.duringEmotion} onChange={(event) => setValues({ ...values, duringEmotion: event.target.value })} />
          </FormField>
          <FormField label="Post-trade emotion">
            <textarea className="field min-h-28" name="post_emotion" value={values.postEmotion} onChange={(event) => setValues({ ...values, postEmotion: event.target.value })} />
          </FormField>
          <FormField label="Mistake">
            <textarea className="field min-h-28" name="mistake" value={values.mistake} onChange={(event) => setValues({ ...values, mistake: event.target.value })} />
          </FormField>
          <FormField label="Lesson" className="md:col-span-2">
            <textarea className="field min-h-28" name="lesson" value={values.lesson} onChange={(event) => setValues({ ...values, lesson: event.target.value })} />
          </FormField>
          <FormField label="Notes" className="md:col-span-2">
            <textarea className="field min-h-36" name="notes" value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} placeholder="Supports markdown-style writing if you want structured notes." />
          </FormField>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="submit" disabled={isDemo} className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
          {trade ? "Save trade" : "Create trade"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function BooleanField({
  label,
  name,
  checked,
  onToggle
}: {
  label: string;
  name: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
      <span>{label}</span>
      <input type="checkbox" className="h-4 w-4 accent-emerald-400" name={name} checked={checked} onChange={onToggle} />
    </label>
  );
}
