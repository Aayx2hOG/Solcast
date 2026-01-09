import axios from "axios";
import { Fetcher } from "./Fetcher";
import { OracleData } from "../models/OracleData";

export class ESPNFetcher implements Fetcher {
  async fetch(marketId: string): Promise<OracleData> {

    const [league, eventId] = marketId.split("-");

    if (!league || !eventId) {
      throw new Error("ESPN: invalid marketId format");
    }

    const sportPath = this.getSportPath(league);

    const res = await axios.get(
      `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary`,
      { params: { event: eventId } }
    );

    const competitors =
      res.data?.header?.competitions?.[0]?.competitors;

    if (!Array.isArray(competitors)) {
      throw new Error("ESPN: invalid response");
    }

    const winner = competitors.find(
      (c: any) => c.winner === true
    )?.team?.name;

    if (!winner) {
      throw new Error("ESPN: game not final");
    }

    return {
      marketId,
      value: winner,
      source: "ESPN",
      confidence: 0.95,
      timestamp: Date.now(),
      healthy: true,
    };
  }

  private getSportPath(league: string): string {
    switch (league.toUpperCase()) {
      case "NBA":
        return "basketball/nba";
      case "NFL":
        return "football/nfl";
      case "MLB":
        return "baseball/mlb";
      case "NHL":
        return "hockey/nhl";
      default:
        throw new Error(`ESPN: unsupported league ${league}`);
    }
  }
}
