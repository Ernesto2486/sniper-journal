import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  tone = "neutral",
  hint
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss" | "neutral";
  hint?: string;
}) {
  const icon =
    tone === "profit" ? <ArrowUpRight className="h-4 w-4 text-emerald-300" /> : tone === "loss" ? <ArrowDownRight className="h-4 w-4 text-rose-300" /> : null;

  return (
    <div className="metric-glow panel flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{label}</p>
        {icon}
      </div>
      <p
        className={cn(
          "text-3xl font-semibold tracking-tight",
          tone === "profit" && "text-emerald-300",
          tone === "loss" && "text-rose-300"
        )}
      >
        {value}
      </p>
      {hint ? <p className="text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function kpiValue(kind: "currency" | "percent" | "number", value: number) {
  if (kind === "currency") return formatCurrency(value);
  if (kind === "percent") return formatPercent(value);
  return value.toString();
}
