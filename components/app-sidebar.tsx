import Link from "next/link";
import { BarChart3, CalendarDays, LayoutDashboard, LogOut, PlusCircle, Table2 } from "lucide-react";
import { signOutAction } from "@/app/(app)/trades/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trade History", icon: Table2 },
  { href: "/trades/new", label: "New Trade", icon: PlusCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays }
];

export function AppSidebar({
  userEmail,
  isDemo
}: {
  userEmail: string;
  isDemo: boolean;
}) {
  return (
    <aside className="panel sticky top-6 flex h-fit flex-col gap-6 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300/80">Sniper Journal</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Trade with data, not emotion.</h1>
        <p className="mt-3 text-sm text-slate-400">
          {isDemo ? "Demo mode active. Connect Supabase to save live data." : userEmail}
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-400/30 hover:bg-emerald-400/10"
          >
            <Icon className="h-4 w-4 text-emerald-300" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
        <p className="font-semibold">Subscription-ready</p>
        <p className="mt-2 text-amber-50/75">
          Billing hooks are left intentionally modular so Stripe plans can be attached without restructuring the app.
        </p>
      </div>

      {!isDemo ? (
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      ) : null}
    </aside>
  );
}
