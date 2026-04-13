"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DistributionPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const colors = ["#2dd4a6", "#f87171"];

export function DistributionChart({ data }: { data: DistributionPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={78} outerRadius={110} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#08111f", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 16 }}
            formatter={(value: number, _name, payload) => [`${value} trades | ${formatCurrency(payload?.payload?.amount ?? 0)}`, "Count"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
