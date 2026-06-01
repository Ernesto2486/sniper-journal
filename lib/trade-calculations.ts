import type { Direction, Market } from "@/lib/types";

type TradeResultInput = {
  market: Market | string;
  direction: Direction | string;
  entryPrice: number;
  exitPrice: number;
  size: number;
  fees?: number;
};

export function contractMultiplierForMarket(market: Market | string) {
  if (market === "Options") return 100;
  return 1;
}

export function calculateTradeResult({
  market,
  direction,
  entryPrice,
  exitPrice,
  size,
  fees = 0
}: TradeResultInput) {
  const multiplier = contractMultiplierForMarket(market);
  const priceDelta = direction === "Short" ? entryPrice - exitPrice : exitPrice - entryPrice;
  const notional = Math.abs(entryPrice * size * multiplier);
  const resultUsd = priceDelta * size * multiplier - fees;
  const resultPercent = notional ? (resultUsd / notional) * 100 : 0;

  return {
    multiplier,
    resultUsd,
    resultPercent
  };
}
