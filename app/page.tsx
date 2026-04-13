import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, CalendarRange, ShieldCheck } from "lucide-react";
import { getAuthState } from "@/lib/data";

const featureCards = [
  {
    icon: BarChart3,
    title: "Performance dashboard",
    copy: "Eight core KPIs, equity curve, setup analysis, and weekday breakdowns."
  },
  {
    icon: BrainCircuit,
    title: "Psychology-first logging",
    copy: "Followed plan, revenge, FOMO, overtrading, emotions, mistakes, lessons, and discipline score."
  },
  {
    icon: CalendarRange,
    title: "Calendar review",
    copy: "Month-level P/L heatmap with weekly summaries for fast review loops."
  },
  {
    icon: ShieldCheck,
    title: "Production-ready stack",
    copy: "Next.js App Router, TypeScript, Tailwind, Supabase auth/database, Recharts, and Vercel deployment."
  }
] as const;

export default async function LandingPage() {
  const auth = await getAuthState();

  return (
    <main className="px-6 py-8 lg:px-10">
      <section className="panel grid min-h-[82vh] overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative p-10 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,166,0.12),transparent_28%),radial-gradient(circle_at_center_right,rgba(56,189,248,0.12),transparent_24%)]" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">Apex Journal</p>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white lg:text-7xl">
              A complete trading journal platform for active traders.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Log trades, analyze setups, track psychology, and review equity growth with a dark SaaS experience designed for daily execution.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href={auth.user || auth.isDemo ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950">
                {auth.user || auth.isDemo ? "Open dashboard" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white">
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-slate-950/40 p-8 lg:p-10">
          {featureCards.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">{title}</h2>
              </div>
              <p className="mt-4 text-sm text-slate-400">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
