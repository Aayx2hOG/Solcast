export interface AnomalyScore {
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

export interface DataPoint {
  value: number;
  timestamp: number;
  source: string;
}

export interface AnomalyDetectionConfig {
  stdDevThreshold: number;
  minDataPoints: number;
  timeWindow: number;
  priceChangeThreshold: number;
  volumeSpikeFactor: number;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  score: AnomalyScore;
  metadata: {
    dataCount: number;
    mean?: number;
    stdDev?: number;
    zScore?: number;
  };
}

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

export type FraudIndicatorType =
  | 'WASH_TRADING'
  | 'PUMP_DUMP'
  | 'COORDINATED_TRADES'
  | 'SUSPICIOUS_TIMING'
  | 'MANIPULATION_ATTEMPT';

export interface FraudIndicator {
  type: FraudIndicatorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  evidence: string[];
  suspiciousUsers?: string[];
  affectedMarkets?: string[];
}

export interface FraudDetectionResult {
  isSuspicious: boolean;
  indicators: FraudIndicator[];
  overallRiskScore: number;
  recommendation: 'ALLOW' | 'FLAG' | 'BLOCK';
}

export interface MarketSnapshot {
  marketId: string;
  price: number;
  volume: number;
  uniqueTraders: number;
  timestamp: number;
}

export type ResolutionDecision =
  | { status: 'RETRY' }
  | { status: 'RESOLVED'; value: number | string; confidence: number };

export type ValidationResult =
  | { status: 'RETRY' }
  | { status: 'RESOLVED'; confidence: number };
