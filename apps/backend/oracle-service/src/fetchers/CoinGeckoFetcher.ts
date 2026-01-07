import axios from "axios";
import { Fetcher } from "./Fetcher";
import { OracleData } from "../models/OracleData";

const COINGECKO_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  MATIC: "matic-network",
  ADA: "cardano",
};

export class CoinGeckoFetcher implements Fetcher {
  async fetch(marketId: string): Promise<OracleData> {
    const [symbol] = marketId.split("-");

    const id = COINGECKO_ID_MAP[symbol.toUpperCase()];
    if (!id) {
      throw new Error(`CoinGecko: unsupported symbol ${symbol}`);
    }

    const res = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: id,
          vs_currencies: "usd",
        },
      }
    );

    const value = res.data?.[id]?.usd;
    if (typeof value !== "number") {
      throw new Error("CoinGecko: invalid price");
    }

    return {
      marketId,
      value,
      source: "CoinGecko",
      confidence: 0.95,
      timestamp: Date.now(),
      healthy: true,
    };
  }
}
