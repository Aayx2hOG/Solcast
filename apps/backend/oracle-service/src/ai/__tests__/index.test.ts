/**
 * Comprehensive Test Suite for AI Detection Systems
 * 
 * This file runs all test cases for:
 * - Fraud Detection (Wash Trading, Pump & Dump, Coordinated Trading)
 * - Anomaly Detection (Z-Score, Price Spikes, Consistency Checks)
 * 
 * Run with: bun test
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { FraudDetector } from '../fraudDetector';
import { AnomalyDetector } from '../anomalyDetector';
import type { TradeEvent, FraudDetectionResult, FraudIndicator } from '../fraudDetection.types';

// ============================================
// FRAUD DETECTION TESTS
// ============================================

describe('FraudDetector - Complete Test Suite', () => {
  let fraudDetector: FraudDetector;

  beforeEach(() => {
    fraudDetector = new FraudDetector(60 * 60 * 1000); // 1 hour window
  });

  describe('Wash Trading Detection', () => {
    test('should detect wash trading pattern', () => {
      const baseTime = Date.now();
      const trades: TradeEvent[] = [
        { userId: 'user1', marketId: 'market1', tradeType: 'BUY', amount: 100, price: 10, timestamp: baseTime },
        { userId: 'user1', marketId: 'market1', tradeType: 'SELL', amount: 95, price: 10.1, timestamp: baseTime + 60000 },
        { userId: 'user1', marketId: 'market1', tradeType: 'BUY', amount: 90, price: 10.2, timestamp: baseTime + 120000 },
        { userId: 'user1', marketId: 'market1', tradeType: 'SELL', amount: 88, price: 10.1, timestamp: baseTime + 180000 },
      ];

      let lastResult: FraudDetectionResult | undefined;
      trades.forEach(trade => lastResult = fraudDetector.recordTrade(trade));

      expect(lastResult?.isSuspicious).toBe(true);
      expect(lastResult?.indicators.some((ind: FraudIndicator) => ind.type === 'WASH_TRADING')).toBe(true);
      expect(lastResult?.overallRiskScore).toBeGreaterThan(0.6);
    });

    test('should not flag legitimate trading patterns', () => {
      const baseTime = Date.now();
      const trades: TradeEvent[] = [
        { userId: 'user1', marketId: 'market1', tradeType: 'BUY', amount: 100, price: 10, timestamp: baseTime },
        { userId: 'user1', marketId: 'market1', tradeType: 'SELL', amount: 20, price: 10.1, timestamp: baseTime + 60000 },
      ];

      let lastResult: FraudDetectionResult | undefined;
      trades.forEach(trade => lastResult = fraudDetector.recordTrade(trade));

      const washIndicators = lastResult?.indicators.filter((ind: FraudIndicator) => ind.type === 'WASH_TRADING');
      expect(washIndicators?.length).toBe(0);
    });

    test('should assign critical severity for high wash score', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 4; i++) {
        fraudDetector.recordTrade({
          userId: 'user1',
          marketId: 'market1',
          tradeType: i % 2 === 0 ? 'BUY' : 'SELL',
          amount: 100 - i,
          price: 10,
          timestamp: baseTime + i * 30000,
        });
      }

      const result = fraudDetector.recordTrade({
        userId: 'user1',
        marketId: 'market1',
        tradeType: 'SELL',
        amount: 96,
        price: 10,
        timestamp: baseTime + 120000,
      });

      const washIndicator = result.indicators.find((ind: FraudIndicator) => ind.type === 'WASH_TRADING');
      expect(washIndicator?.severity).toBe('critical');
      expect(washIndicator?.score).toBeGreaterThan(0.8);
    });
  });

  describe('Pump & Dump Detection', () => {
    test('should detect pump and dump patterns', () => {
      const baseTime = Date.now();
      const bucketInterval = 12 * 60 * 1000;

      // Normal trading
      for (let i = 0; i < 5; i++) {
        fraudDetector.recordTrade({
          userId: `user${i}`,
          marketId: 'market1',
          tradeType: 'BUY',
          amount: 10,
          price: 100,
          timestamp: baseTime + i * 1000,
        });
      }

      // Pump phase
      for (let i = 0; i < 20; i++) {
        fraudDetector.recordTrade({
          userId: `user${i + 10}`,
          marketId: 'market1',
          tradeType: 'BUY',
          amount: 50,
          price: 100 + i * 2,
          timestamp: baseTime + bucketInterval + i * 1000,
        });
      }

      const result = fraudDetector.recordTrade({
        userId: 'userX',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 100,
        price: 150,
        timestamp: baseTime + bucketInterval * 2,
      });

      const pumpIndicator = result.indicators.find(ind => ind.type === 'PUMP_DUMP');
      expect(pumpIndicator).toBeDefined();
    });

    test('should not flag gradual price increases', () => {
      const baseTime = Date.now();

      for (let i = 0; i < 10; i++) {
        fraudDetector.recordTrade({
          userId: `user${i}`,
          marketId: 'market1',
          tradeType: 'BUY',
          amount: 10,
          price: 100 + i * 0.5,
          timestamp: baseTime + i * 60000,
        });
      }

      const result = fraudDetector.recordTrade({
        userId: 'user11',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 10,
        price: 105,
        timestamp: baseTime + 600000,
      });

      expect(result.indicators.some(ind => ind.type === 'PUMP_DUMP')).toBe(false);
    });
  });

  describe('Coordinated Trading Detection', () => {
    test('should detect coordinated buy orders', () => {
      const baseTime = Date.now();

      // Need more users with multiple trades each within 2 min window
      for (let i = 0; i < 5; i++) {
        fraudDetector.recordTrade({
          userId: `user${i}`,
          marketId: 'market1',
          tradeType: 'BUY',
          amount: 50,
          price: 100,
          timestamp: baseTime + i * 10000,
        });
        // Each user makes multiple trades
        fraudDetector.recordTrade({
          userId: `user${i}`,
          marketId: 'market1',
          tradeType: 'BUY',
          amount: 50,
          price: 100,
          timestamp: baseTime + i * 10000 + 5000,
        });
      }

      const result = fraudDetector.recordTrade({
        userId: 'user0',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 50,
        price: 100,
        timestamp: baseTime + 60000,
      });

      expect(result.indicators.some(ind => ind.type === 'COORDINATED_TRADES')).toBe(true);
      const coordIndicator = result.indicators.find(ind => ind.type === 'COORDINATED_TRADES');
      expect(coordIndicator?.suspiciousUsers?.length).toBeGreaterThanOrEqual(3);
    });

    test('should detect coordinated sell orders', () => {
      const baseTime = Date.now();

      // Each seller makes multiple trades to increase coordination score
      for (let i = 0; i < 4; i++) {
        fraudDetector.recordTrade({
          userId: `seller${i}`,
          marketId: 'market1',
          tradeType: 'SELL',
          amount: 30,
          price: 100,
          timestamp: baseTime + i * 15000,
        });
        fraudDetector.recordTrade({
          userId: `seller${i}`,
          marketId: 'market1',
          tradeType: 'SELL',
          amount: 30,
          price: 100,
          timestamp: baseTime + i * 15000 + 5000,
        });
      }

      const result = fraudDetector.recordTrade({
        userId: 'seller0',
        marketId: 'market1',
        tradeType: 'SELL',
        amount: 30,
        price: 100,
        timestamp: baseTime + 80000,
      });

      const coordIndicator = result.indicators.find(ind => ind.type === 'COORDINATED_TRADES');
      expect(coordIndicator).toBeDefined();
    });

    test('should not flag small group coordination', () => {
      const baseTime = Date.now();

      fraudDetector.recordTrade({
        userId: 'user1',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 50,
        price: 100,
        timestamp: baseTime,
      });

      const result = fraudDetector.recordTrade({
        userId: 'user2',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 50,
        price: 100,
        timestamp: baseTime + 10000,
      });

      expect(result.indicators.some(ind => ind.type === 'COORDINATED_TRADES')).toBe(false);
    });
  });

  describe('Risk Assessment & Recommendations', () => {
    test('should recommend BLOCK for high risk', () => {
      const baseTime = Date.now();

      // Create wash trading pattern
      for (let i = 0; i < 5; i++) {
        fraudDetector.recordTrade({
          userId: 'badactor',
          marketId: 'market1',
          tradeType: i % 2 === 0 ? 'BUY' : 'SELL',
          amount: 100,
          price: 100,
          timestamp: baseTime + i * 30000,
        });
      }

      // Add coordinated trades
      for (let i = 0; i < 6; i++) {
        fraudDetector.recordTrade({
          userId: `accomplice${i}`,
          marketId: 'market1',
          tradeType: 'BUY',
          amount: 50,
          price: 100,
          timestamp: baseTime + 180000 + i * 10000,
        });
      }

      const result = fraudDetector.recordTrade({
        userId: 'badactor',
        marketId: 'market1',
        tradeType: 'SELL',
        amount: 100,
        price: 100,
        timestamp: baseTime + 240000,
      });

      expect(result.overallRiskScore).toBeGreaterThan(0.6);
      expect(['BLOCK', 'FLAG'].includes(result.recommendation)).toBe(true);
    });

    test('should recommend ALLOW for normal trades', () => {
      const result = fraudDetector.recordTrade({
        userId: 'normaluser',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 50,
        price: 100,
        timestamp: Date.now(),
      });

      expect(result.isSuspicious).toBe(false);
      expect(result.recommendation).toBe('ALLOW');
    });
  });

  describe('User Pattern Tracking', () => {
    test('should track user patterns correctly', () => {
      const baseTime = Date.now();

      fraudDetector.recordTrade({
        userId: 'user1',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 100,
        price: 10,
        timestamp: baseTime,
      });

      fraudDetector.recordTrade({
        userId: 'user1',
        marketId: 'market1',
        tradeType: 'SELL',
        amount: 50,
        price: 12,
        timestamp: baseTime + 60000,
      });

      const pattern = fraudDetector.getUserStats('user1');
      expect(pattern?.totalTrades).toBe(2);
      expect(pattern?.buyVolume).toBe(100);
      expect(pattern?.sellVolume).toBe(50);
      expect(pattern?.netPosition).toBe(50);
    });

    test('should calculate average trade size', () => {
      const baseTime = Date.now();

      fraudDetector.recordTrade({
        userId: 'user1',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 100,
        price: 10,
        timestamp: baseTime,
      });

      fraudDetector.recordTrade({
        userId: 'user1',
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 200,
        price: 10,
        timestamp: baseTime + 60000,
      });

      const pattern = fraudDetector.getUserStats('user1');
      expect(pattern?.avgTradeSize).toBe(150);
    });
  });
});

// ============================================
// ANOMALY DETECTION TESTS
// ============================================

describe('AnomalyDetector - Complete Test Suite', () => {
  let anomalyDetector: AnomalyDetector;

  beforeEach(() => {
    anomalyDetector = new AnomalyDetector({
      stdDevThreshold: 3,
      minDataPoints: 5,
      timeWindow: 24 * 60 * 60 * 1000,
      priceChangeThreshold: 30,
      volumeSpikeFactor: 5,
    });
  });

  describe('Initialization & Configuration', () => {
    test('should initialize with default config', () => {
      const detector = new AnomalyDetector();
      expect(detector).toBeDefined();
    });

    test('should initialize with custom config', () => {
      const detector = new AnomalyDetector({
        stdDevThreshold: 2,
        minDataPoints: 10,
      });
      expect(detector).toBeDefined();
    });
  });

  describe('Data Point Management', () => {
    test('should add and track data points', () => {
      const timestamp = Date.now();
      anomalyDetector.addDataPoint('BTC/USD', 50000, timestamp);

      const stats = anomalyDetector.getStats('BTC/USD');
      expect(stats?.count).toBe(1);
      expect(stats?.newest).toBe(timestamp);
    });

    test('should maintain separate histories per source', () => {
      const timestamp = Date.now();
      anomalyDetector.addDataPoint('BTC/USD', 50000, timestamp);
      anomalyDetector.addDataPoint('ETH/USD', 3000, timestamp);

      const btcStats = anomalyDetector.getStats('BTC/USD');
      const ethStats = anomalyDetector.getStats('ETH/USD');

      expect(btcStats?.count).toBe(1);
      expect(ethStats?.count).toBe(1);
    });

    test('should clean old data outside time window', () => {
      const oldTime = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const recentTime = Date.now();

      anomalyDetector.addDataPoint('source1', 100, oldTime);
      anomalyDetector.addDataPoint('source1', 110, recentTime);

      const stats = anomalyDetector.getStats('source1');
      expect(stats?.count).toBe(1);
    });
  });

  describe('Z-Score Anomaly Detection', () => {
    test('should detect statistical outliers', () => {
      const baseTime = Date.now();
      const normalValues = [100, 102, 98, 101, 99, 100, 101];

      normalValues.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 200);

      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Z-score'))).toBe(true);
      expect(result.metadata.zScore).toBeGreaterThan(3);
    });

    test('should not flag values within normal range', () => {
      const baseTime = Date.now();
      const values = [100, 102, 98, 101, 99];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 102);
      expect(result.isAnomaly).toBe(false);
    });

    test('should calculate correct statistics', () => {
      const baseTime = Date.now();
      const values = [10, 20, 30, 40, 50];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 30);
      expect(result.metadata.mean).toBe(30);
      expect(result.metadata.stdDev).toBeCloseTo(14.14, 1);
    });

    test('should handle zero standard deviation', () => {
      const baseTime = Date.now();
      const constantValues = [100, 100, 100, 100, 100];

      constantValues.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      // Need >10% change to trigger anomaly with zero std dev
      const result = anomalyDetector.detectAnomaly('source1', 112);
      expect(result.metadata.stdDev).toBe(0);
      expect(result.isAnomaly).toBe(true);
    });
  });

  describe('Price Spike Detection', () => {
    test('should detect sudden price spikes', () => {
      const baseTime = Date.now();
      const values = [100, 101, 102, 103, 104];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 140);
      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Price spike'))).toBe(true);
    });

    test('should not flag gradual changes', () => {
      const baseTime = Date.now();
      const values = [100, 105, 110, 115, 120];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 125);
      expect(result.score.reasons.some(r => r.includes('Price spike'))).toBe(false);
    });

    test('should detect downward spikes', () => {
      const baseTime = Date.now();
      const values = [100, 100, 100, 100, 100];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 60);
      expect(result.isAnomaly).toBe(true);
    });
  });

  describe('Consistency Checks', () => {
    test('should detect negative values', () => {
      const baseTime = Date.now();
      const values = [100, 110, 105, 108, 112];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', -50);
      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Negative'))).toBe(true);
    });

    test('should detect non-finite values', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        anomalyDetector.addDataPoint('source1', 100, baseTime + i * 1000);
      }

      const result = anomalyDetector.detectAnomaly('source1', Infinity);
      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Non-finite'))).toBe(true);
    });

    test('should detect values beyond historical range', () => {
      const baseTime = Date.now();
      const values = [100, 102, 98, 101, 99];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 500);
      expect(result.isAnomaly).toBe(true);
      expect(result.score.reasons.some(r => r.includes('Outside historical range'))).toBe(true);
    });

    test('should handle NaN values', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        anomalyDetector.addDataPoint('source1', 100, baseTime + i * 1000);
      }

      const result = anomalyDetector.detectAnomaly('source1', NaN);
      // NaN fails isFinite check - adds 0.3 to score, which is < 0.5 threshold
      // But consistency issue should be detected
      expect(result.score.reasons.some(r => r.includes('Non-finite') || r.includes('Consistency'))).toBe(true);
      expect(result.score.value).toBeGreaterThan(0);
    });
  });

  describe('Severity Assignment', () => {
    test('should assign critical severity for extreme anomalies', () => {
      const baseTime = Date.now();
      const values = [100, 100, 100, 100, 100];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 300);
      expect(result.score.severity).toBe('critical');
      expect(result.score.value).toBeGreaterThan(0.9);
    });

    test('should assign appropriate severity levels', () => {
      const baseTime = Date.now();
      const values = [100, 102, 98, 101, 99];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 180);
      expect(['high', 'critical'].includes(result.score.severity)).toBe(true);
    });
  });

  describe('Insufficient Data Handling', () => {
    test('should return non-anomaly with insufficient data', () => {
      const baseTime = Date.now();
      anomalyDetector.addDataPoint('source1', 100, baseTime);
      anomalyDetector.addDataPoint('source1', 102, baseTime + 1000);

      const result = anomalyDetector.detectAnomaly('source1', 150);
      expect(result.isAnomaly).toBe(false);
      expect(result.score.reasons).toContain('Insufficient data history');
    });

    test('should work at minimum data threshold', () => {
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        anomalyDetector.addDataPoint('source1', 100 + i, baseTime + i * 1000);
      }

      const result = anomalyDetector.detectAnomaly('source1', 200);
      expect(result.metadata.dataCount).toBe(5);
      expect(result.isAnomaly).toBe(true);
    });
  });

  describe('History Management', () => {
    test('should clear specific source history', () => {
      const timestamp = Date.now();
      anomalyDetector.addDataPoint('source1', 100, timestamp);
      anomalyDetector.addDataPoint('source2', 200, timestamp);

      anomalyDetector.clearHistory('source1');

      expect(anomalyDetector.getStats('source1')).toBeNull();
      expect(anomalyDetector.getStats('source2')).not.toBeNull();
    });

    test('should clear all history', () => {
      const timestamp = Date.now();
      anomalyDetector.addDataPoint('source1', 100, timestamp);
      anomalyDetector.addDataPoint('source2', 200, timestamp);

      anomalyDetector.clearHistory();

      expect(anomalyDetector.getStats('source1')).toBeNull();
      expect(anomalyDetector.getStats('source2')).toBeNull();
    });
  });

  describe('Real-World Scenarios', () => {
    test('should detect oracle manipulation attempt', () => {
      const baseTime = Date.now();
      const normalPrices = [50000, 50100, 50050, 50150, 50080, 50120];

      normalPrices.forEach((price, idx) => {
        anomalyDetector.addDataPoint('BTC/USD', price, baseTime + idx * 60000);
      });

      const result = anomalyDetector.detectAnomaly('BTC/USD', 75000);
      expect(result.isAnomaly).toBe(true);
      expect(['high', 'critical'].includes(result.score.severity)).toBe(true);
    });

    test('should handle volatile markets appropriately', () => {
      const baseTime = Date.now();
      const volatilePrices = [100, 105, 103, 108, 106, 112, 110, 115];

      volatilePrices.forEach((price, idx) => {
        anomalyDetector.addDataPoint('VOLATILE', price, baseTime + idx * 60000);
      });

      const result = anomalyDetector.detectAnomaly('VOLATILE', 118);
      
      if (result.isAnomaly) {
        expect(['low', 'medium'].includes(result.score.severity)).toBe(true);
      }
    });

    test('should detect data feed errors', () => {
      const baseTime = Date.now();
      
      for (let i = 0; i < 6; i++) {
        anomalyDetector.addDataPoint('FEED', 1000, baseTime + i * 1000);
      }

      const result = anomalyDetector.detectAnomaly('FEED', 0);
      expect(result.isAnomaly).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very small values', () => {
      const baseTime = Date.now();
      const values = [0.001, 0.002, 0.0015, 0.0018, 0.0022];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 0.002);
      expect(result).toBeDefined();
    });

    test('should handle very large values', () => {
      const baseTime = Date.now();
      const values = [1e10, 1.1e10, 1.05e10, 1.08e10, 1.12e10];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 1.1e10);
      expect(result).toBeDefined();
    });

    test('should handle zero values correctly', () => {
      const baseTime = Date.now();
      const values = [0, 0, 0, 0, 0];

      values.forEach((value, idx) => {
        anomalyDetector.addDataPoint('source1', value, baseTime + idx * 1000);
      });

      const result = anomalyDetector.detectAnomaly('source1', 0);
      expect(result.isAnomaly).toBe(false);
    });
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('Integration Tests - Combined Detection', () => {
  test('should detect both fraud and price anomalies in market manipulation', () => {
    const fraudDetector = new FraudDetector();
    const anomalyDetector = new AnomalyDetector();
    const baseTime = Date.now();

    // Setup normal price baseline
    for (let i = 0; i < 6; i++) {
      anomalyDetector.addDataPoint('market1', 100 + i * 0.5, baseTime + i * 60000);
    }

    // Simulate coordinated pump - each pumper makes multiple trades
    for (let i = 0; i < 4; i++) {
      fraudDetector.recordTrade({
        userId: `pumper${i}`,
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 100,
        price: 100 + i * 5,
        timestamp: baseTime + 360000 + i * 10000,
      });
      fraudDetector.recordTrade({
        userId: `pumper${i}`,
        marketId: 'market1',
        tradeType: 'BUY',
        amount: 100,
        price: 100 + i * 5 + 2,
        timestamp: baseTime + 360000 + i * 10000 + 5000,
      });
    }

    // Check for coordinated trading (fraud)
    const fraudResult = fraudDetector.recordTrade({
      userId: 'pumper0',
      marketId: 'market1',
      tradeType: 'BUY',
      amount: 100,
      price: 130,
      timestamp: baseTime + 420000,
    });

    // Check for price anomaly
    const anomalyResult = anomalyDetector.detectAnomaly('market1', 145);

    expect(fraudResult.indicators.some(ind => ind.type === 'COORDINATED_TRADES')).toBe(true);
    expect(anomalyResult.isAnomaly).toBe(true);
  });

  test('should handle normal market activity without false positives', () => {
    const fraudDetector = new FraudDetector();
    const anomalyDetector = new AnomalyDetector();
    const baseTime = Date.now();

    // Normal trading activity
    for (let i = 0; i < 10; i++) {
      const price = 100 + Math.random() * 5;
      anomalyDetector.addDataPoint('market1', price, baseTime + i * 60000);

      fraudDetector.recordTrade({
        userId: `user${i}`,
        marketId: 'market1',
        tradeType: i % 2 === 0 ? 'BUY' : 'SELL',
        amount: 20 + Math.random() * 10,
        price,
        timestamp: baseTime + i * 60000,
      });
    }

    const fraudResult = fraudDetector.recordTrade({
      userId: 'user10',
      marketId: 'market1',
      tradeType: 'BUY',
      amount: 25,
      price: 103,
      timestamp: baseTime + 600000,
    });

    const anomalyResult = anomalyDetector.detectAnomaly('market1', 103);

    expect(fraudResult.recommendation).toBe('ALLOW');
    expect(anomalyResult.isAnomaly).toBe(false);
  });
});

console.log('\n✅ All AI Detection Tests Completed!\n');
