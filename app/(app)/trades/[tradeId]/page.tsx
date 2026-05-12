import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTradeAction, updateTradeAction } from "@/app/(app)/trades/actions";
import { TradeForm } from "@/components/trade-form";
import { getAuthState, getDefaultTradingAccount, getTradeById, getTradingAccounts } from "@/lib/data";

export default async function EditTradePage({
  params,
  searchParams
}: {
  params: Promise<{ tradeId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const [{ tradeId }, messages, auth, accounts, defaultAccount] = await Promise.all([params, searchParams, getAuthState(), getTradingAccounts(), getDefaultTradingAccount()]);
  const trade = await getTradeById(tradeId);

  if (!trade) {
    notFound();
  }

  const deleteAction = deleteTradeAction.bind(null, trade.id);
  const saveAction = updateTradeAction.bind(null, trade.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Edit trade</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{trade.instrument} | {trade.setup}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/trades" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
            Back to history
          </Link>
          <form action={deleteAction}>
            <button disabled={auth.isDemo} className="rounded-full border border-rose-300/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-50">
              Delete trade
            </button>
          </form>
        </div>
      </div>

      {messages.error ? <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{messages.error}</div> : null}
      {messages.message ? <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{messages.message}</div> : null}

      {trade.screenshotUrl ? (
        <div className="panel overflow-hidden">
          <div className="relative h-64 w-full">
            <img src={trade.screenshotUrl} alt={`${trade.instrument} chart`} className="h-full w-full object-cover" />
          </div>
        </div>
      ) : null}

      <TradeForm trade={trade} action={saveAction} isDemo={auth.isDemo} defaultAccountId={defaultAccount?.id} accounts={accounts} />
    </div>
  );
}

