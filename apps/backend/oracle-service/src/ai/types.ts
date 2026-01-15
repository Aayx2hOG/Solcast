export interface AnomalyScore {
  value: number; // 0-1, where 1 is highest anomaly
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
