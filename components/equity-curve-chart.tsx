"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EquityPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function EquityCurveChart({ data }: { data: EquityPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="equityFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#2dd4a6" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#2dd4a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} minTickGap={30} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} tickLine={false} axisLine={false} width={90} />
          <Tooltip
            contentStyle={{ background: "#08111f", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16 }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Area type="monotone" dataKey="cumulativePnl" stroke="#2dd4a6" strokeWidth={3} fill="url(#equityFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
