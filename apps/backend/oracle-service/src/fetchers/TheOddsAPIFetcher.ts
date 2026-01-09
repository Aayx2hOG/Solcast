import axios from "axios";
import { Fetcher } from "./Fetcher";
import { OracleData } from "../models/OracleData";
import { ENV } from "../config/env";

export class TheOddsAPIFetcher implements Fetcher {
  async fetch(marketId: string): Promise<OracleData> {

    const sportKey = this.mapSport(marketId);

    const res = await axios.get(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds`,
      {
        params: {
          apiKey: ENV.THE_ODDS_API_KEY,
          regions: "us",
          markets: "h2h",
        },
      }
    );

    const event = res.data?.[0];
    const outcomes =
      event?.bookmakers?.[0]?.markets?.[0]?.outcomes;

    if (!Array.isArray(outcomes)) {
      throw new Error("TheOddsAPI: no odds data");
    }

    const favorite = outcomes.reduce((best: any, cur: any) =>
      cur.price < best.price ? cur : best
    );

    return {
      marketId,
      value: favorite.name,
      source: "TheOddsAPI",
      confidence: 0.7,
      timestamp: Date.now(),
      healthy: true,
    };
  }

  private mapSport(marketId: string): string {
    switch (marketId.toUpperCase()) {
      case "NBA":
        return "basketball_nba";
      case "NFL":
        return "americanfootball_nfl";
      case "MLB":
        return "baseball_mlb";
      case "NHL":
        return "icehockey_nhl";
      default:
        throw new Error(`TheOddsAPI: unsupported sport ${marketId}`);
    }
  }
}

