import { OracleData } from "../models/OracleData";

export interface Fetcher {
  fetch(marketId: string): Promise<OracleData>;
}