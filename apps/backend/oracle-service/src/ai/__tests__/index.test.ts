import { describe, test, expect, beforeEach } from 'bun:test';
import { FraudDetector } from '../fraudDetector';
import { AnomalyDetector } from '../anomalyDetector';
import type { TradeEvent, FraudDetectionResult, FraudIndicator } from '../../types';

const createTrade = (
  overrides: Partial<TradeEvent> & { userId: string; marketId: string }
): TradeEvent => ({
  tradeType: 'BUY',
  amount: 100,
  price: 100,
  timestamp: Date.now(),
  ...overrides,
});

const seedNormalPrices = (detector: AnomalyDetector, source: string, count = 5) => {
  const baseTime = Date.now();
  for (let i = 0; i < count; i++) {
    detector.addDataPoint(source, 100 + i, baseTime + i * 1000);
  }
};

describe('FraudDetector', () => {
  let detector: FraudDetector;

  beforeEach(() => {
    detector = new FraudDetector(60 * 60 * 1000);
  });

  describe('Wash Trading', () => {
    test('detects rapid buy/sell cycles', () => {
      const baseTime = Date.now();
      const trades = [
        createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'BUY', amount: 100, timestamp: baseTime }),
        createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'SELL', amount: 95, timestamp: baseTime + 60000 }),
        createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'BUY', amount: 90, timestamp: baseTime + 120000 }),
        createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'SELL', amount: 88, timestamp: baseTime + 180000 }),
      ];

      let result: FraudDetectionResult | undefined;
      trades.forEach(t => result = detector.recordTrade(t));

      expect(result?.isSuspicious).toBe(true);
      expect(result?.indicators.some(i => i.type === 'WASH_TRADING')).toBe(true);
    });

    test('ignores legitimate trading', () => {
      const baseTime = Date.now();
      detector.recordTrade(createTrade({ userId: 'u1', marketId: 'm1', amount: 100, timestamp: baseTime }));
      const result = detector.recordTrade(createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'SELL', amount: 20, timestamp: baseTime + 60000 }));

      expect(result.indicators.filter(i => i.type === 'WASH_TRADING')).toHaveLength(0);
    });

    test('assigns critical severity for high score', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        detector.recordTrade(createTrade({
          userId: 'u1',
          marketId: 'm1',
          tradeType: i % 2 === 0 ? 'BUY' : 'SELL',
          amount: 100 - i,
          timestamp: baseTime + i * 30000,
        }));
      }

      const result = detector.recordTrade(createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'SELL', amount: 96, timestamp: baseTime + 150000 }));
      const indicator = result.indicators.find(i => i.type === 'WASH_TRADING');

      expect(indicator?.severity).toBe('critical');
      expect(indicator?.score).toBeGreaterThan(0.8);
    });
  });

  describe('Pump & Dump', () => {
    test('detects price spike with volume surge', () => {
      const baseTime = Date.now();
      const interval = 12 * 60 * 1000;

      for (let i = 0; i < 5; i++) {
        detector.recordTrade(createTrade({ userId: `u${i}`, marketId: 'm1', amount: 10, price: 100, timestamp: baseTime + i * 1000 }));
      }

      for (let i = 0; i < 20; i++) {
        detector.recordTrade(createTrade({ userId: `pump${i}`, marketId: 'm1', amount: 50, price: 100 + i * 2, timestamp: baseTime + interval + i * 1000 }));
      }

      const result = detector.recordTrade(createTrade({ userId: 'x', marketId: 'm1', amount: 100, price: 150, timestamp: baseTime + interval * 2 }));

      expect(result.indicators.some(i => i.type === 'PUMP_DUMP')).toBe(true);
    });

    test('ignores gradual increases', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 10; i++) {
        detector.recordTrade(createTrade({ userId: `u${i}`, marketId: 'm1', amount: 10, price: 100 + i * 0.5, timestamp: baseTime + i * 60000 }));
      }

      const result = detector.recordTrade(createTrade({ userId: 'u11', marketId: 'm1', amount: 10, price: 105, timestamp: baseTime + 600000 }));

      expect(result.indicators.some(i => i.type === 'PUMP_DUMP')).toBe(false);
    });
  });

  describe('Coordinated Trading', () => {
    test('detects multiple users trading same direction', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        detector.recordTrade(createTrade({ userId: `u${i}`, marketId: 'm1', amount: 50, timestamp: baseTime + i * 10000 }));
        detector.recordTrade(createTrade({ userId: `u${i}`, marketId: 'm1', amount: 50, timestamp: baseTime + i * 10000 + 5000 }));
      }

      const result = detector.recordTrade(createTrade({ userId: 'u0', marketId: 'm1', amount: 50, timestamp: baseTime + 60000 }));

      expect(result.indicators.some(i => i.type === 'COORDINATED_TRADES')).toBe(true);
    });

    test('ignores small groups', () => {
      const baseTime = Date.now();
      detector.recordTrade(createTrade({ userId: 'u1', marketId: 'm1', timestamp: baseTime }));
      const result = detector.recordTrade(createTrade({ userId: 'u2', marketId: 'm1', timestamp: baseTime + 10000 }));

      expect(result.indicators.some(i => i.type === 'COORDINATED_TRADES')).toBe(false);
    });
  });

  describe('Risk Assessment', () => {
    test('allows normal trades', () => {
      const result = detector.recordTrade(createTrade({ userId: 'normal', marketId: 'm1' }));

      expect(result.isSuspicious).toBe(false);
      expect(result.recommendation).toBe('ALLOW');
    });

    test('blocks high-risk trades', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 6; i++) {
        detector.recordTrade(createTrade({ userId: 'bad', marketId: 'm1', tradeType: i % 2 === 0 ? 'BUY' : 'SELL', amount: 100, timestamp: baseTime + i * 20000 }));
      }

      const result = detector.recordTrade(createTrade({ userId: 'bad', marketId: 'm1', tradeType: 'SELL', timestamp: baseTime + 150000 }));

      expect(['FLAG', 'BLOCK'].includes(result.recommendation)).toBe(true);
    });
  });

  describe('User Stats', () => {
    test('tracks volumes correctly', () => {
      const baseTime = Date.now();
      detector.recordTrade(createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'BUY', amount: 100, timestamp: baseTime }));
      detector.recordTrade(createTrade({ userId: 'u1', marketId: 'm1', tradeType: 'SELL', amount: 50, timestamp: baseTime + 60000 }));

      const stats = detector.getUserStats('u1');

      expect(stats?.totalTrades).toBe(2);
      expect(stats?.buyVolume).toBe(100);
      expect(stats?.sellVolume).toBe(50);
      expect(stats?.netPosition).toBe(50);
    });

    test('returns null for unknown user', () => {
      expect(detector.getUserStats('unknown')).toBeNull();
    });
  });
});

describe('AnomalyDetector', () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    detector = new AnomalyDetector({
      stdDevThreshold: 3,
      minDataPoints: 5,
      timeWindow: 24 * 60 * 60 * 1000,
      priceChangeThreshold: 30,
      volumeSpikeFactor: 5,
    });
  });

  describe('Data Management', () => {
    test('tracks data points per source', () => {
      const ts = Date.now();
      detector.addDataPoint('BTC', 50000, ts);
      detector.addDataPoint('ETH', 3000, ts);

      expect(detector.getStats('BTC')?.count).toBe(1);
      expect(detector.getStats('ETH')?.count).toBe(1);
      expect(detector.getStats('unknown')).toBeNull();
    });

    test('clears history selectively', () => {
      const ts = Date.now();
      detector.addDataPoint('a', 100, ts);
      detector.addDataPoint('b', 200, ts);

      detector.clearHistory('a');

      expect(detector.getStats('a')).toBeNull();
      expect(detector.getStats('b')).not.toBeNull();
    });

    test('clears all history', () => {
      detector.addDataPoint('a', 100, Date.now());
      detector.addDataPoint('b', 200, Date.now());

      detector.clearHistory();

      expect(detector.getStats('a')).toBeNull();
      expect(detector.getStats('b')).toBeNull();
    });
  });

  describe('Z-Score Detection', () => {
    test('detects statistical outliers', () => {
      seedNormalPrices(detector, 's1', 7);
      const result = detector.detectAnomaly('s1', 200);

      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Z-score'))).toBe(true);
      expect(result.metadata.zScore).toBeGreaterThan(3);
    });

    test('accepts values within range', () => {
      seedNormalPrices(detector, 's1', 5);
      const result = detector.detectAnomaly('s1', 102);

      expect(result.isAnomaly).toBe(false);
    });
  });

  describe('Price Spike Detection', () => {
    test('detects upward spikes', () => {
      seedNormalPrices(detector, 's1', 5);
      const result = detector.detectAnomaly('s1', 140);

      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Price spike'))).toBe(true);
    });

    test('detects downward spikes', () => {
      seedNormalPrices(detector, 's1', 5);
      const result = detector.detectAnomaly('s1', 60);

      expect(result.isAnomaly).toBe(true);
    });
  });

  describe('Consistency Checks', () => {
    test('flags negative values', () => {
      seedNormalPrices(detector, 's1', 5);
      const result = detector.detectAnomaly('s1', -50);

      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Negative'))).toBe(true);
    });

    test('flags Infinity', () => {
      seedNormalPrices(detector, 's1', 5);
      const result = detector.detectAnomaly('s1', Infinity);

      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Non-finite'))).toBe(true);
    });

    test('flags NaN', () => {
      seedNormalPrices(detector, 's1', 5);
      const result = detector.detectAnomaly('s1', NaN);

      expect(result.score.value).toBeGreaterThan(0);
    });
  });

  describe('Severity', () => {
    test('critical for extreme anomalies', () => {
      seedNormalPrices(detector, 's1', 5);
      const result = detector.detectAnomaly('s1', 500);

      expect(result.score.severity).toBe('critical');
      expect(result.score.value).toBeGreaterThan(0.9);
    });
  });

  describe('Insufficient Data', () => {
    test('requires minimum data points', () => {
      detector.addDataPoint('s1', 100, Date.now());
      detector.addDataPoint('s1', 102, Date.now() + 1000);

      const result = detector.detectAnomaly('s1', 500);

      expect(result.isAnomaly).toBe(false);
      expect(result.score.reasons).toContain('Insufficient data history');
    });
  });
});

describe('Integration', () => {
  test('detects combined fraud and anomaly in market manipulation', () => {
    const fraud = new FraudDetector();
    const anomaly = new AnomalyDetector();
    const baseTime = Date.now();

    for (let i = 0; i < 6; i++) {
      anomaly.addDataPoint('m1', 100 + i * 0.5, baseTime + i * 60000);
    }

    for (let i = 0; i < 4; i++) {
      fraud.recordTrade(createTrade({ userId: `p${i}`, marketId: 'm1', amount: 100, price: 100 + i * 5, timestamp: baseTime + 360000 + i * 10000 }));
      fraud.recordTrade(createTrade({ userId: `p${i}`, marketId: 'm1', amount: 100, price: 102 + i * 5, timestamp: baseTime + 365000 + i * 10000 }));
    }

    const fraudResult = fraud.recordTrade(createTrade({ userId: 'p0', marketId: 'm1', price: 130, timestamp: baseTime + 420000 }));
    const anomalyResult = anomaly.detectAnomaly('m1', 145);

    expect(fraudResult.indicators.some(i => i.type === 'COORDINATED_TRADES')).toBe(true);
    expect(anomalyResult.isAnomaly).toBe(true);
  });

  test('no false positives for normal activity', () => {
    const fraud = new FraudDetector();
    const anomaly = new AnomalyDetector();
    const baseTime = Date.now();

    for (let i = 0; i < 10; i++) {
      const price = 100 + Math.random() * 5;
      anomaly.addDataPoint('m1', price, baseTime + i * 60000);
      fraud.recordTrade(createTrade({
        userId: `u${i}`,
        marketId: 'm1',
        tradeType: i % 2 === 0 ? 'BUY' : 'SELL',
        amount: 20 + Math.random() * 10,
        price,
        timestamp: baseTime + i * 60000,
      }));
    }

    const fraudResult = fraud.recordTrade(createTrade({ userId: 'u10', marketId: 'm1', amount: 25, price: 103, timestamp: baseTime + 600000 }));
    const anomalyResult = anomaly.detectAnomaly('m1', 103);

    expect(fraudResult.recommendation).toBe('ALLOW');
    expect(anomalyResult.isAnomaly).toBe(false);
  });
});
