import axios from "axios";
import { Fetcher } from "./Fetcher";
import { OracleData } from "../models/OracleData";

export class BinanceFetcher implements Fetcher {
  async fetch(marketId: string): Promise<OracleData> {
    const [coin, currency] = marketId.split("-");
    if (!coin || !currency) {
      throw new Error("Binance: invalid marketId format");
    }

    const symbol = `${coin}${currency}`.toUpperCase();

    const res = await axios.get(
      "https://api.binance.com/api/v3/ticker/price",
      { params: { symbol } }
    );

    const value = Number(res.data?.price);
    if (Number.isNaN(value)) {
      throw new Error("Binance: invalid price");
    }

    return {
      marketId,
      value,
      source: "Binance",
      confidence: 0.95,
      timestamp: Date.now(),
      healthy: true,
    };
  }
}