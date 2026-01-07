export interface OracleData {
  marketId: string;
  value: string | number;
  source: string;
  confidence: number;
  timestamp: number;
  healthy?: boolean;
}