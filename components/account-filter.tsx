import type { TradingAccount } from "@/lib/types";

type AccountFilterProps = {
  accounts: TradingAccount[];
  selectedAccount?: string;
  hidden?: Record<string, string | undefined>;
  compact?: boolean;
};

export function AccountFilter({ accounts, selectedAccount = "all", hidden = {}, compact = false }: AccountFilterProps) {
  return (
    <form className={compact ? "flex flex-wrap items-end gap-3" : "grid gap-4 md:grid-cols-[minmax(220px,320px)_auto]"}>
      {Object.entries(hidden).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
      <div>
        <label className="label">Account</label>
        <select className="field" name="account" defaultValue={selectedAccount}>
          <option value="all">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.accountName}{account.isActive ? "" : " (Archived)"}
            </option>
          ))}
        </select>
      </div>
      <button className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">
        Apply
      </button>
    </form>
  );
}
