import { TradeImportClient } from "@/components/trade-import-client";
import { getDashboardData, getDefaultTradingAccount } from "@/lib/data";

export default async function ImportTradesPage() {
  const [{ accounts, auth }, defaultAccount] = await Promise.all([
    getDashboardData(),
    getDefaultTradingAccount()
  ]);

  return (
    <TradeImportClient
      accounts={accounts}
      defaultAccountId={defaultAccount?.id ?? accounts[0]?.id ?? ""}
      isDemo={auth.isDemo}
    />
  );
}
