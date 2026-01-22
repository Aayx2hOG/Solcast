export interface TradeEvent {
  userId: string;
  marketId: string;
  tradeType: 'BUY' | 'SELL';
  amount: number;
  price: number;
  timestamp: number;
  txHash?: string;
}

export interface UserTradePattern {
  userId: string;
  totalTrades: number;
  buyVolume: number;
  sellVolume: number;
  netPosition: number;
  avgTradeSize: number;
  avgTimeBetweenTrades: number;
  lastTradeTime: number;
}

export interface FraudIndicator {
  type:
    | 'WASH_TRADING'
    | 'PUMP_DUMP'
    | 'COORDINATED_TRADES'
    | 'SUSPICIOUS_TIMING'
    | 'MANIPULATION_ATTEMPT';
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-1
  evidence: string[];
  suspiciousUsers?: string[];
  affectedMarkets?: string[];
}

export interface FraudDetectionResult {
  isSuspicious: boolean;
  indicators: FraudIndicator[];
  overallRiskScore: number; // 0-1
  recommendation: 'ALLOW' | 'FLAG' | 'BLOCK';
}

export interface MarketSnapshot {
  marketId: string;
  price: number;
  volume: number;
  uniqueTraders: number;
  timestamp: number;
}
