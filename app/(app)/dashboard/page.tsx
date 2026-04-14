import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#0f3b2e,_#020617_35%,_#020617_100%)] text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Sniper Journal
            </p>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
              Trade with data, not emotion.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A trading journal built for disciplined traders who want to track
              performance, review setups, and grow with real analytics.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-2xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Start Free
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Go to Dashboard
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
              <span>✔ Track every trade</span>
              <span>✔ Review discipline</span>
              <span>✔ Unlock Pro analytics</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Performance dashboard
                </p>
                <p className="mt-4 text-3xl font-bold text-emerald-400">
                  +26.5R
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Measure win rate, expectancy, P/L, and drawdown in one place.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Psychology tracking
                </p>
                <p className="mt-4 text-3xl font-bold text-white">7.8/10</p>
                <p className="mt-2 text-sm text-slate-400">
                  Review discipline, revenge trades, FOMO, and execution habits.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Setup review
                </p>
                <p className="mt-4 text-2xl font-bold text-white">
                  Breakout & Pullback
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Discover which setups actually pay you consistently.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Pro unlock
                </p>
                <p className="mt-4 text-2xl font-bold text-emerald-400">
                  Unlimited trades
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Upgrade to unlock full analytics and advanced journal tools.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-24 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold">Track every trade</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Log entries, exits, setup type, emotions, discipline score, and
              notes in one professional journal.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold">See what works</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Use dashboards and charts to understand your edge, not just your
              feelings after a trade.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-lg font-semibold">Upgrade when ready</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Start free, then unlock unlimited trades and premium analytics
              with Pro.
            </p>
          </div>
        </section>

        <section className="mt-24">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Simple plans for serious traders
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Free
              </p>
              <p className="mt-4 text-4xl font-bold">$0</p>
              <p className="mt-2 text-slate-300">Start learning your numbers.</p>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>• Up to 5 visible trades</p>
                <p>• Limited analytics access</p>
                <p>• Trading journal basics</p>
              </div>

              <Link
                href="/login"
                className="mt-8 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold transition hover:bg-white/10"
              >
                Start Free
              </Link>
            </div>

            <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-8 shadow-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Pro
              </p>
              <p className="mt-4 text-4xl font-bold">$19<span className="text-lg font-medium text-slate-300">/month</span></p>
              <p className="mt-2 text-slate-200">
                Built for traders who want full visibility and growth.
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-200">
                <p>• Unlimited trades</p>
                <p>• Full analytics dashboard</p>
                <p>• Performance and discipline insights</p>
                <p>• Premium trading journal tools</p>
              </div>

              <Link
                href="/login"
                className="mt-8 inline-flex rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-24 rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Start now
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Build discipline. Track performance. Trade smarter.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Sniper Journal helps you stop guessing and start improving with
            real data.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl bg-emerald-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Start Free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Open Dashboard
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
