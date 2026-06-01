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
  const initialJournal = await loadJournalAction(today);
  const setups = [...new Set(trades.map((trade) => trade.setup).filter(Boolean))];

  return (
    <JournalClient
      initialJournal={initialJournal}
      trades={trades}
      accounts={accounts}
      selectedAccountId={params.account ?? "all"}
      setups={setups}
      isDemo={auth.isDemo}
    />
  );
}
