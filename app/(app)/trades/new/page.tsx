import Link from "next/link";
import { createTradeAction } from "@/app/(app)/trades/actions";
import { TradeForm } from "@/components/trade-form";
import { getAuthState } from "@/lib/data";

export default async function NewTradePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const auth = await getAuthState();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Trade entry</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Capture the trade and the trader.</h1>
        </div>
        <Link href="/trades" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
          Back to history
        </Link>
      </div>
      {params.error ? <div className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{params.error}</div> : null}
      <TradeForm action={createTradeAction} isDemo={auth.isDemo} />
    </div>
  );
}
