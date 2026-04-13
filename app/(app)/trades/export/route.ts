import { NextResponse } from "next/server";
import { getTrades } from "@/lib/data";

export async function GET() {
  const trades = await getTrades();
  const header = [
    "date",
    "time",
    "market",
    "instrument",
    "setup",
    "direction",
    "entry_price",
    "exit_price",
    "stop_loss",
    "take_profit",
    "size",
    "fees",
    "result_usd",
    "result_percent",
    "followed_plan",
    "revenge_trade",
    "fomo",
    "overtrading",
    "respect_stop_loss",
    "discipline_score"
  ];

  const rows = trades.map((trade) =>
    [
      trade.date,
      trade.time,
      trade.market,
      trade.instrument,
      trade.setup,
      trade.direction,
      trade.entryPrice,
      trade.exitPrice,
      trade.stopLoss,
      trade.takeProfit,
      trade.size,
      trade.fees,
      trade.resultUsd,
      trade.resultPercent,
      trade.followedPlan,
      trade.revengeTrade,
      trade.fomo,
      trade.overtrading,
      trade.respectStopLoss,
      trade.disciplineScore
    ].join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=trades.csv"
    }
  });
}
