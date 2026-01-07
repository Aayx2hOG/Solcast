import axios from "axios";
import { Fetcher } from "./Fetcher";
import { OracleData } from ".././models/OracleData";

export class DecisionDeskFetcher implements Fetcher {
  async fetch(marketId: string): Promise<OracleData> {
    const res = await axios.get(
      `https://api.decisiondeskhq.com/results/${marketId}`
    );

    const winner = res.data?.winner;
    if (!winner) {
      throw new Error("DecisionDeskHQ: no final result");
    }
    return {
      marketId,
      value: winner,
      source: "DecisionDeskHQ",
      confidence: 0.95,
      timestamp: Date.now(),
      healthy: true,
    };
  }
}
