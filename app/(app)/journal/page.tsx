import { JournalClient } from "@/components/journal-client";
import { getDashboardData } from "@/lib/data";
import { zonedDateKey } from "@/lib/timezone";
import { loadJournalAction } from "./actions";

export default async function JournalPage({
  searchParams
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const params = await searchParams;
  const { trades, accounts, auth } = await getDashboardData();
  const today = zonedDateKey();
  const selectedAccountId = params.account ?? "all";
  const initialJournal = await loadJournalAction(today, selectedAccountId === "all" ? null : selectedAccountId);
  const setups = [...new Set(trades.map((trade) => trade.setup).filter(Boolean))];

  return (
    <JournalClient
      initialJournal={initialJournal}
      trades={trades}
      accounts={accounts}
      selectedAccountId={selectedAccountId}
      setups={setups}
      isDemo={auth.isDemo}
    />
  );
}
