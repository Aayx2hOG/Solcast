import { FETCHERS, MarketType } from "./fetcherRegistry";
import { validate } from "../validation/validator";
import { OracleData } from "../models/OracleData";
import { ResolutionDecision } from "./types";

function resolvePrice(data: OracleData[]): number {
  const prices = data
    .filter(d => d.healthy === true && typeof d.value === "number")
    .map(d => d.value as number)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    throw new Error("No valid prices");
  }

  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 === 1
    ? prices[mid]
    : (prices[mid - 1] + prices[mid]) / 2;
}

export async function resolveMarket(
  marketId: string,
  marketType: MarketType
): Promise<ResolutionDecision> {

  const fetchers = FETCHERS[marketType];
  if (!fetchers || fetchers.length === 0) {
    return { status: "RETRY" };
  }

  const results: OracleData[] = [];

  for (const fetcher of fetchers) {
    try {
      const data = await fetcher.fetch(marketId);
      results.push(data);
    } catch (err: any) {
      console.error(
        `[FETCH FAIL] ${marketId} ${fetcher.constructor.name}`,
        err?.message
      );
    }
  }

  if (marketType === "SPORTS" || marketType === "ELECTION") {
    const result = results.find(
      r => r.healthy === true && typeof r.value === "string"
    );

    if (!result) {
      return { status: "RETRY" };
    }

    return {
      status: "RESOLVED",
      value: result.value,
      confidence: result.confidence,
    };
  }

  const minSources = Math.max(
    1,
    Math.ceil(fetchers.length * 0.6)
  );

  const validation = validate(results, minSources);
  if (validation.status === "RETRY") {
    return { status: "RETRY" };
  }

  const price = resolvePrice(results);

  return {
    status: "RESOLVED",
    value: price,
    confidence: validation.confidence,
  };
}
