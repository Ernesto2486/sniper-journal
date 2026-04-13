"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PerformancePoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function PerformanceBarChart({
  data,
  color = "#38bdf8"
}: {
  data: PerformancePoint[];
  color?: string;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} tickLine={false} axisLine={false} width={86} />
          <Tooltip
            contentStyle={{ background: "#08111f", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16 }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Bar dataKey="value" fill={color} radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
