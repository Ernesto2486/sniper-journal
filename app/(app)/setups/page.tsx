import { Star, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { createSetupAction, deleteSetupAction, toggleFavoriteSetupAction, updateSetupAction } from "@/app/(app)/setups/actions";
import { getAuthState, getSetups } from "@/lib/data";
import { EXECUTION_TIMEFRAMES, type SetupRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function SetupsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [messages, auth, setups] = await Promise.all([searchParams, getAuthState(), getSetups()]);

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Setup library</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Codify the trades worth repeating.</h1>
            <p className="mt-3 max-w-3xl text-slate-400">Build reusable playbooks, favorite your A+ patterns, and pull setup names into new trade entries.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{setups.length} setups</span>
        </div>
      </section>

      {messages.error ? <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{messages.error}</div> : null}
      {messages.message ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{messages.message}</div> : null}

      <SetupForm title="Create setup" action={createSetupAction} disabled={auth.isDemo} />

      <section className="grid gap-4 xl:grid-cols-2">
        {setups.map((setup) => (
          <SetupCard key={setup.id} setup={setup} disabled={auth.isDemo} />
        ))}
      </section>
    </div>
  );
}

function SetupCard({ setup, disabled }: { setup: SetupRecord; disabled: boolean }) {
  const updateAction = updateSetupAction.bind(null, setup.id);
  const deleteAction = deleteSetupAction.bind(null, setup.id);
  const favoriteAction = toggleFavoriteSetupAction.bind(null, setup.id, setup.isFavorite);

  return (
    <article className="panel p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-semibold">{setup.setupName}</p>
          <p className="mt-1 text-sm text-slate-400">{setup.category || "Uncategorized"} | {setup.preferredTimeframe || "No timeframe"}</p>
        </div>
        <div className="flex gap-2">
          <form action={favoriteAction}>
            <button disabled={disabled} className={cn("rounded-full border px-3 py-2 text-xs font-semibold", setup.isFavorite ? "border-amber-300/40 bg-amber-300/15 text-amber-100" : "border-white/10 bg-white/5 text-slate-200")}>
              <Star className="inline h-4 w-4" /> Favorite
            </button>
          </form>
          <form action={deleteAction}>
            <button disabled={disabled} className="rounded-full border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-100">
              <Trash2 className="inline h-4 w-4" /> Delete
            </button>
          </form>
        </div>
      </div>
      <SetupForm title="Edit setup" action={updateAction} setup={setup} disabled={disabled} compact />
    </article>
  );
}

function SetupForm({
  title,
  action,
  setup,
  disabled,
  compact = false
}: {
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  setup?: SetupRecord;
  disabled: boolean;
  compact?: boolean;
}) {
  return (
    <form action={action} className={cn("panel p-6", compact && "border-white/5 bg-white/[0.02]")}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Field label="Setup Name">
          <input className="field" name="setup_name" defaultValue={setup?.setupName ?? ""} required />
        </Field>
        <Field label="Category">
          <input className="field" name="category" defaultValue={setup?.category ?? ""} placeholder="Breakout, Reversal, Continuation" />
        </Field>
        <Field label="Preferred Timeframe">
          <select className="field" name="preferred_timeframe" defaultValue={setup?.preferredTimeframe ?? "5m"}>
            {EXECUTION_TIMEFRAMES.map((timeframe) => <option key={timeframe}>{timeframe}</option>)}
          </select>
        </Field>
        <Field label="Screenshot URL">
          <input className="field" name="screenshot_url" defaultValue={setup?.screenshotUrl ?? ""} placeholder="Optional chart reference" />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <textarea className="field min-h-24" name="description" defaultValue={setup?.description ?? ""} />
        </Field>
        <Field label="Entry Rules">
          <textarea className="field min-h-28" name="entry_rules" defaultValue={setup?.entryRules ?? ""} />
        </Field>
        <Field label="Risk Rules">
          <textarea className="field min-h-28" name="risk_rules" defaultValue={setup?.riskRules ?? ""} />
        </Field>
        <Field label="Confirmation Rules">
          <textarea className="field min-h-28" name="confirmation_rules" defaultValue={setup?.confirmationRules ?? ""} />
        </Field>
        <Field label="Avoid Conditions">
          <textarea className="field min-h-28" name="avoid_conditions" defaultValue={setup?.avoidConditions ?? ""} />
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <textarea className="field min-h-24" name="notes" defaultValue={setup?.notes ?? ""} />
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" name="is_favorite" defaultChecked={setup?.isFavorite ?? false} className="h-4 w-4 accent-emerald-400" />
          Favorite setup
        </label>
        <button disabled={disabled} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
          Save setup
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
