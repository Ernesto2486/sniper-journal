import Link from "next/link";
import { loginAction, signupAction } from "@/app/login/actions";
import { getAuthState } from "@/lib/data";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const auth = await getAuthState();
  if (auth.user || auth.isDemo) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-20">
        <div className="panel max-w-xl p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Apex Journal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Your workspace is ready.</h1>
          <p className="mt-4 text-slate-400">
            {auth.isDemo ? "Supabase is not connected yet, so the app is running with demo data." : "You already have an active session."}
          </p>
          <Link href="/dashboard" className="mt-8 inline-flex rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950">
            Open dashboard
          </Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;

  return (
    <main className="grid min-h-screen gap-8 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
      <section className="panel grid-fade relative overflow-hidden p-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-sky-400/10" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">Trading Journal SaaS</p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white">Measure edge, psychology, and consistency from one command center.</h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Built for active traders who want institutional-style performance reporting and behavior tracking in the same workflow.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Dashboard KPIs", "Win rate, expectancy, profit factor, and drawdown at a glance."],
              ["Psychology logging", "FOMO, revenge trading, stop discipline, and lessons baked into every trade."],
              ["SaaS-ready stack", "Next.js App Router, Supabase auth/data, Recharts, Tailwind, Vercel-ready."]
            ].map(([title, copy]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-3 text-sm text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Authentication</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in or create your account</h2>
        </div>

        {params.error ? <div className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{params.error}</div> : null}
        {params.message ? <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{params.message}</div> : null}

        <div className="mt-8 grid gap-6">
          <form action={loginAction} className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h3 className="text-xl font-semibold">Sign in</h3>
            <div className="mt-5 space-y-4">
              <div><label className="label">Email</label><input className="field" type="email" name="email" required /></div>
              <div><label className="label">Password</label><input className="field" type="password" name="password" required /></div>
            </div>
            <button className="mt-6 w-full rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">Continue to dashboard</button>
          </form>

          <form action={signupAction} className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <h3 className="text-xl font-semibold">Create account</h3>
            <div className="mt-5 space-y-4">
              <div><label className="label">Email</label><input className="field" type="email" name="email" required /></div>
              <div><label className="label">Password</label><input className="field" type="password" name="password" minLength={6} required /></div>
            </div>
            <button className="mt-6 w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">Create trading workspace</button>
          </form>
        </div>
      </section>
    </main>
  );
}
