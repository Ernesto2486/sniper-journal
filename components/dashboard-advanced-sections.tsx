"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EquityPoint, PerformancePoint } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type DrawdownEquityPoint = EquityPoint & {
  drawdown: number;
};

type EquityMetrics = {
  peakPnl: number;
  maxDrawdown: number;
  currentDrawdown: number;
  longestUnderwater: number;
};

type PeriodKey = "daily" | "weekly" | "monthly" | "yearly";

type PeriodDataset = Record<PeriodKey, PerformancePoint[]>;

const periodTabs: { key: PeriodKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" }
];

export function AdvancedEquityCurveSection({
  data,
  metrics
}: {
  data: DrawdownEquityPoint[];
  metrics: EquityMetrics;
}) {
  const [showDrawdown, setShowDrawdown] = useState(false);
  const chartColor = showDrawdown ? "#fb7185" : "#2dd4a6";
  const gradientId = showDrawdown ? "drawdownFill" : "advancedEquityFill";

  function resetView() {
    setShowDrawdown(false);
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Equity curve</h2>
          <p className="mt-2 text-sm text-slate-400">Cumulative P/L over time based on the selected account and date range filters.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowDrawdown((current) => !current)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition",
              showDrawdown
                ? "border-rose-300 bg-rose-400 text-slate-950"
                : "border-white/10 bg-white/[0.04] text-slate-100 hover:border-rose-300/40 hover:bg-rose-400/10"
            )}
          >
            Drawdown mode
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <EquityMetric label="Peak P&L" value={formatCurrency(metrics.peakPnl)} tone={metrics.peakPnl > 0 ? "profit" : "neutral"} />
        <EquityMetric label="Max Drawdown" value={formatCurrency(metrics.maxDrawdown)} tone="loss" />
        <EquityMetric label="Current Drawdown" value={formatCurrency(metrics.currentDrawdown)} tone={metrics.currentDrawdown > 0 ? "loss" : "neutral"} />
        <EquityMetric label="Longest Underwater" value={`${metrics.longestUnderwater} trades`} />
      </div>

      <div className="mt-5 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.45} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} minTickGap={30} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} axisLine={false} width={90} />
            <Tooltip
              contentStyle={{ background: "#08111f", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16 }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Area
              type="monotone"
              dataKey={showDrawdown ? "drawdown" : "cumulativePnl"}
              name={showDrawdown ? "Drawdown" : "Equity"}
              stroke={chartColor}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function EquityMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "profit" | "loss" | "neutral" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-xl font-semibold", tone === "profit" && "text-emerald-300", tone === "loss" && "text-rose-300")}>{value}</p>
    </div>
  );
}

export function PeriodPerformanceSection({ data }: { data: PeriodDataset }) {
  const [activeTab, setActiveTab] = useState<PeriodKey>("daily");
  const activeData = useMemo(() => data[activeTab], [activeTab, data]);

  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Performance</h2>
          <p className="mt-2 text-sm text-slate-400">P/L grouped by period for the selected account and date range.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                activeTab === tab.key
                  ? "border-emerald-300 bg-emerald-400 text-slate-950"
                  : "border-white/10 bg-white/[0.04] text-slate-100 hover:border-emerald-400/40 hover:bg-emerald-400/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activeData}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(value) => formatCurrency(Number(value))} tickLine={false} axisLine={false} width={86} />
            <Tooltip
              contentStyle={{ background: "#08111f", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16 }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {activeData.map((point) => (
                <Cell key={point.label} fill={point.value >= 0 ? "#34d399" : "#fb7185"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}