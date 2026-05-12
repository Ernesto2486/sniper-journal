import { Archive, Plus } from "lucide-react";
import { archiveAccountAction, createAccountAction, updateAccountAction } from "@/app/(app)/accounts/actions";
import { getDashboardData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import type { TradingAccount } from "@/lib/types";

export default async function AccountsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { accounts, auth } = await getDashboardData();
  const activeAccounts = accounts.filter((account) => account.isActive);
  const archivedAccounts = accounts.filter((account) => !account.isActive);

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Accounts</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Trading account control.</h1>
            <p className="mt-3 max-w-3xl text-slate-400">Separate prop firm, brokerage, paper, and live account performance without changing how existing trades work.</p>
          </div>
          <div className="grid gap-2 text-right text-sm text-slate-300">
            <span>{activeAccounts.length} active</span>
            <span>{archivedAccounts.length} archived</span>
          </div>
        </div>
        {params.error ? <div className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{params.error}</div> : null}
        {params.message ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{params.message}</div> : null}
      </section>

      <section className="panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <Plus className="h-5 w-5 text-emerald-300" />
          <h2 className="text-xl font-semibold tracking-tight">Create account</h2>
        </div>
        <AccountForm action={createAccountAction} disabled={auth.isDemo} />
        {auth.isDemo ? <p className="mt-3 text-sm text-amber-100">Demo mode is read-only. Connect Supabase to manage accounts.</p> : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {accounts.map((account) => {
          const updateAction = updateAccountAction.bind(null, account.id);
          const archiveAction = archiveAccountAction.bind(null, account.id);

          return (
            <article key={account.id} className={`panel p-6 ${account.isActive ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{account.isActive ? "Active" : "Archived"}</p>
                  <h3 className="mt-2 text-2xl font-semibold">{account.accountName}</h3>
                  <p className="mt-2 text-sm text-slate-400">{account.broker || "No broker"} | {account.accountType || "No type"}</p>
                </div>
                <div className="text-right">
                  <p className="label">Balance</p>
                  <p className="text-2xl font-semibold text-emerald-200">{formatCurrency(account.currentBalance)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="label">Starting balance</p>
                  <p className="text-lg font-semibold">{formatCurrency(account.startingBalance)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="label">Net change</p>
                  <p className={`text-lg font-semibold ${account.currentBalance - account.startingBalance >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {formatCurrency(account.currentBalance - account.startingBalance)}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <AccountForm account={account} action={updateAction} disabled={auth.isDemo} />
              </div>

              {account.isActive ? (
                <form action={archiveAction} className="mt-4 flex justify-end">
                  <button disabled={auth.isDemo} className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-50">
                    <Archive className="h-4 w-4" />
                    Archive
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function AccountForm({
  account,
  action,
  disabled
}: {
  account?: TradingAccount;
  action: (formData: FormData) => void | Promise<void>;
  disabled: boolean;
}) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      <div className="xl:col-span-2">
        <label className="label">Account name</label>
        <input className="field" name="account_name" defaultValue={account?.accountName ?? ""} placeholder="Main Account" required />
      </div>
      <div>
        <label className="label">Broker</label>
        <input className="field" name="broker" defaultValue={account?.broker ?? ""} placeholder="Tradovate, Schwab" />
      </div>
      <div>
        <label className="label">Account type</label>
        <input className="field" name="account_type" defaultValue={account?.accountType ?? ""} placeholder="Live, Funded, Paper" />
      </div>
      <div>
        <label className="label">Starting balance</label>
        <input className="field" type="number" step="0.01" name="starting_balance" defaultValue={account?.startingBalance ?? 0} />
      </div>
      <div>
        <label className="label">Current balance</label>
        <input className="field" type="number" step="0.01" name="current_balance" defaultValue={account?.currentBalance ?? 0} />
      </div>
      <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 xl:col-span-2">
        <span>Active</span>
        <input type="checkbox" className="h-4 w-4 accent-emerald-400" name="is_active" defaultChecked={account?.isActive ?? true} />
      </label>
      <div className="flex items-end xl:col-span-4">
        <button disabled={disabled} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
          {account ? "Save account" : "Create account"}
        </button>
      </div>
    </form>
  );
}
