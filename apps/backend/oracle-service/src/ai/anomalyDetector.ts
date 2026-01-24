import {
  AnomalyDetectionConfig,
  AnomalyResult,
  DataPoint,
} from './types';

export class AnomalyDetector {
  private config: AnomalyDetectionConfig;
  private dataHistory: Map<string, DataPoint[]> = new Map();

  constructor(config: Partial<AnomalyDetectionConfig> = {}) {
    this.config = {
      stdDevThreshold: 3,
      minDataPoints: 5,
      timeWindow: 24 * 60 * 60 * 1000, 
      priceChangeThreshold: 30, 
      volumeSpikeFactor: 5,
      ...config,
    };
  }

  addDataPoint(source: string, value: number, timestamp: number): void {
    if (!this.dataHistory.has(source)) {
      this.dataHistory.set(source, []);
    }

    const history = this.dataHistory.get(source)!;
    history.push({ value, timestamp, source });

    const cutoff = Date.now() - this.config.timeWindow;
    this.dataHistory.set(
      source,
      history.filter((p) => p.timestamp > cutoff)
    );
  }

  detectAnomaly(source: string, value: number): AnomalyResult {
    const history = this.dataHistory.get(source) || [];

    if (history.length < this.config.minDataPoints) {
      return {
        isAnomaly: false,
        score: {
          value: 0,
          severity: 'low',
          reasons: ['Insufficient data history'],
        },
        metadata: {
          dataCount: history.length,
        },
      };
    }

    const reasons: string[] = [];
    let anomalyScore = 0;

    const zScoreResult = this.detectZScoreAnomaly(history, value);
    if (zScoreResult.isAnomaly) {
      reasons.push(`Z-score anomaly: ${zScoreResult.zScore?.toFixed(2)}`);
      anomalyScore += 0.4;
    }

    const spikeResult = this.detectPriceSpike(history, value);
    if (spikeResult.isAnomaly) {
      reasons.push(`Price spike: ${spikeResult.changePercent?.toFixed(2)}%`);
      anomalyScore += 0.3;
    }

    const consistencyResult = this.checkConsistency(history, value);
    if (!consistencyResult.isConsistent) {
      reasons.push(`Consistency issue: ${consistencyResult.reason}`);
      anomalyScore += 0.3;
    }

    anomalyScore = Math.min(anomalyScore, 1);

    const severity = this.getSeverity(anomalyScore);
    const isAnomaly = anomalyScore > 0.5;

    return {
      isAnomaly,
      score: {
        value: anomalyScore,
        severity,
        reasons,
      },
      metadata: {
        dataCount: history.length,
        mean: zScoreResult.mean,
        stdDev: zScoreResult.stdDev,
        zScore: zScoreResult.zScore,
      },
    };
  }

  private detectZScoreAnomaly(
    history: DataPoint[],
    currentValue: number
  ): { isAnomaly: boolean; mean?: number; stdDev?: number; zScore?: number } {
    const values = history.map((p) => p.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return {
        isAnomaly: Math.abs(currentValue - mean) > mean * 0.1,
        mean,
        stdDev,
        zScore: 0,
      };
    }

    const zScore = Math.abs((currentValue - mean) / stdDev);
    const isAnomaly = zScore > this.config.stdDevThreshold;

    return { isAnomaly, mean, stdDev, zScore };
  }

  private detectPriceSpike(
    history: DataPoint[],
    currentValue: number
  ): { isAnomaly: boolean; changePercent?: number } {
    const lastValue = history[history.length - 1].value;
    const changePercent = Math.abs((currentValue - lastValue) / lastValue) * 100;

    return {
      isAnomaly: changePercent > this.config.priceChangeThreshold,
      changePercent,
    };
  }

  private checkConsistency(
    history: DataPoint[],
    currentValue: number
  ): { isConsistent: boolean; reason?: string } {
    if (currentValue < 0) {
      return { isConsistent: false, reason: 'Negative value' };
    }

    if (!isFinite(currentValue)) {
      return { isConsistent: false, reason: 'Non-finite value' };
    }

    const values = history.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || max * 0.1;

    const beyondRange = currentValue < min - range || currentValue > max + range;
    if (beyondRange) {
      return {
        isConsistent: false,
        reason: `Outside historical range [${min.toFixed(2)}, ${max.toFixed(2)}]`,
      };
    }

    return { isConsistent: true };
  }

  private getSeverity(
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score > 0.9) return 'critical';
    if (score > 0.7) return 'high';
    if (score > 0.5) return 'medium';
    return 'low';
  }

  clearHistory(source?: string): void {
    if (source) {
      this.dataHistory.delete(source);
    } else {
      this.dataHistory.clear();
    }
  }

  getStats(source: string): { count: number; oldest: number; newest: number } | null {
    const history = this.dataHistory.get(source);
    if (!history || history.length === 0) return null;

    return {
      count: history.length,
      oldest: history[0].timestamp,
      newest: history[history.length - 1].timestamp,
    };
  }
}
