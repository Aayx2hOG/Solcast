import {
  TradeEvent,
  UserTradePattern,
  FraudIndicator,
  FraudDetectionResult,
  MarketSnapshot,
} from './fraudDetection.types';

export class FraudDetector {
  private tradeHistory: Map<string, TradeEvent[]> = new Map(); // marketId -> trades
  private userPatterns: Map<string, UserTradePattern> = new Map(); // userId -> pattern
  private marketSnapshots: Map<string, MarketSnapshot[]> = new Map(); // marketId -> snapshots
  private timeWindow: number; // ms to look back for patterns

  constructor(timeWindow: number = 60 * 60 * 1000) {
    // 1 hour default
    this.timeWindow = timeWindow;
  }

  /**
   * Record a trade for analysis
   */
  recordTrade(trade: TradeEvent): FraudDetectionResult {
    // Add to history
    if (!this.tradeHistory.has(trade.marketId)) {
      this.tradeHistory.set(trade.marketId, []);
    }
    this.tradeHistory.get(trade.marketId)!.push(trade);

    // Update user pattern
    this.updateUserPattern(trade);

    // Clean old data
    this.cleanOldData();

    // Run fraud detection
    return this.detect(trade);
  }

  private detect(recentTrade: TradeEvent): FraudDetectionResult {
    const indicators: FraudIndicator[] = [];

    // 1. Wash Trading Detection
    const washIndicator = this.detectWashTrading(recentTrade);
    if (washIndicator) indicators.push(washIndicator);

    // 2. Pump & Dump Detection
    const pumpDumpIndicator = this.detectPumpDump(recentTrade);
    if (pumpDumpIndicator) indicators.push(pumpDumpIndicator);

    // 3. Coordinated Trading Detection
    const coordinatedIndicator = this.detectCoordinatedTrades(recentTrade);
    if (coordinatedIndicator) indicators.push(coordinatedIndicator);

    // 4. Suspicious Timing Detection
    const timingIndicator = this.detectSuspiciousTiming(recentTrade);
    if (timingIndicator) indicators.push(timingIndicator);

    // Calculate overall risk
    const overallRiskScore =
      indicators.length > 0
        ? indicators.reduce((sum, ind) => sum + ind.score, 0) / indicators.length
        : 0;

    const isSuspicious = overallRiskScore > 0.6;
    const recommendation =
      overallRiskScore > 0.8 ? 'BLOCK' : overallRiskScore > 0.6 ? 'FLAG' : 'ALLOW';

    return {
      isSuspicious,
      indicators,
      overallRiskScore,
      recommendation,
    };
  }

  /**
   * Detect wash trading: user buying and immediately selling
   */
  private detectWashTrading(trade: TradeEvent): FraudIndicator | null {
    const recentTrades = this.getRecentTrades(trade.marketId, 5 * 60 * 1000); // 5 min window
    const userTrades = recentTrades.filter(
      (t) => t.userId === trade.userId && t.marketId === trade.marketId
    );

    if (userTrades.length < 3) return null;

    // Count buy/sell pairs
    const buys = userTrades.filter((t) => t.tradeType === 'BUY');
    const sells = userTrades.filter((t) => t.tradeType === 'SELL');

    // Check if volumes nearly cancel out (wash pattern)
    const buyVolume = buys.reduce((sum, t) => sum + t.amount, 0);
    const sellVolume = sells.reduce((sum, t) => sum + t.amount, 0);
    const netPosition = buyVolume - sellVolume;
    const totalVolume = buyVolume + sellVolume;

    if (totalVolume === 0) return null;

    const washRatio = Math.abs(netPosition) / totalVolume; // Close to 0 = wash
    if (washRatio > 0.2) return null; // Net position too large

    // High wash trading score
    const score = 1 - washRatio;

    return {
      type: 'WASH_TRADING',
      severity: score > 0.8 ? 'critical' : 'high',
      score,
      evidence: [
        `User made ${userTrades.length} trades in 5 min`,
        `Buy volume: ${buyVolume.toFixed(2)}, Sell volume: ${sellVolume.toFixed(2)}`,
        `Net position: ${netPosition.toFixed(2)} (${(washRatio * 100).toFixed(1)}% of total)`,
      ],
      suspiciousUsers: [trade.userId],
    };
  }

  private detectPumpDump(trade: TradeEvent): FraudIndicator | null {
    const recentTrades = this.getRecentTrades(trade.marketId, this.timeWindow);

    if (recentTrades.length < 5) return null;

    // Group trades into buckets
    const bucketSize = Math.floor(this.timeWindow / 5); // 5 buckets
    const buckets: TradeEvent[][] = Array(5)
      .fill(null)
      .map(() => []);

    for (const t of recentTrades) {
      const bucketIndex = Math.floor(
        (t.timestamp - recentTrades[0].timestamp) / bucketSize
      );
      if (bucketIndex >= 0 && bucketIndex < 5) {
        buckets[bucketIndex].push(t);
      }
    }

    // Check for price spike then volume spike
    const prices = buckets
      .map((b) =>
        b.length > 0 ? b.reduce((sum, t) => sum + t.price, 0) / b.length : null
      )
      .filter((p): p is number => p !== null);

    let priceSpike = 0;
    let volumeSpike = 0;

    for (let i = 1; i < prices.length; i++) {
      const changePercent = ((prices[i] - prices[i - 1]) / prices[i - 1]) * 100;
      if (Math.abs(changePercent) > 10) priceSpike += 1;

      const vol1 = buckets[i - 1].reduce((sum, t) => sum + t.amount, 0);
      const vol2 = buckets[i].reduce((sum, t) => sum + t.amount, 0);
      if (vol2 > vol1 * 3) volumeSpike += 1;
    }

    if (priceSpike === 0 || volumeSpike === 0) return null;

    const score = Math.min((priceSpike + volumeSpike) / 4, 1);

    return {
      type: 'PUMP_DUMP',
      severity: score > 0.7 ? 'high' : 'medium',
      score,
      evidence: [
        `Price spikes detected: ${priceSpike}`,
        `Volume spikes detected: ${volumeSpike}`,
        `Market showed ${(score * 100).toFixed(0)}% pump-dump characteristics`,
      ],
      affectedMarkets: [trade.marketId],
    };
  }

  /**
   * Detect coordinated trades: multiple users trading same direction in short time
   */
  private detectCoordinatedTrades(trade: TradeEvent): FraudIndicator | null {
    const recentTrades = this.getRecentTrades(
      trade.marketId,
      2 * 60 * 1000
    ); // 2 min window

    if (recentTrades.length < 5) return null;

    // Group by direction
    const buys = recentTrades.filter((t) => t.tradeType === 'BUY');
    const sells = recentTrades.filter((t) => t.tradeType === 'SELL');

    const direction = buys.length > sells.length ? 'BUY' : 'SELL';
    const trades = direction === 'BUY' ? buys : sells;

    const uniqueUsers = new Set(trades.map((t) => t.userId)).size;
    const coordinationScore = uniqueUsers > 0 ? trades.length / uniqueUsers : 0; // Avg trades per user

    // If many users all trading same direction rapidly = suspicious
    if (uniqueUsers < 3 || coordinationScore < 1.5) return null;

    const score = Math.min(coordinationScore / 5, 1); // Normalized

    return {
      type: 'COORDINATED_TRADES',
      severity: score > 0.7 ? 'high' : 'medium',
      score,
      evidence: [
        `${uniqueUsers} users made ${trades.length} ${direction} trades in 2 min`,
        `${coordinationScore.toFixed(2)} trades per user (suspicious if >1.5)`,
      ],
      suspiciousUsers: Array.from(
        new Set(trades.map((t) => t.userId))
      ),
      affectedMarkets: [trade.marketId],
    };
  }

  /**
   * Detect suspicious timing: trades at resolution time or market closing
   */
  private detectSuspiciousTiming(trade: TradeEvent): FraudIndicator | null {
    // Placeholder: would integrate with market schedules
    // For now, flag trades in specific market windows
    const evidence: string[] = [];
    let score = 0;

    // Flag if trade happens right before/after market events
    // This would connect to resolution schedule in real implementation

    if (score === 0) return null;

    return {
      type: 'SUSPICIOUS_TIMING',
      severity: 'medium',
      score,
      evidence,
      affectedMarkets: [trade.marketId],
    };
  }

  /**
   * Get recent trades for a market
   */
  private getRecentTrades(marketId: string, timeWindow: number): TradeEvent[] {
    const trades = this.tradeHistory.get(marketId) || [];
    const cutoff = Date.now() - timeWindow;
    return trades.filter((t) => t.timestamp > cutoff);
  }

  /**
   * Update user trading pattern
   */
  private updateUserPattern(trade: TradeEvent): void {
    if (!this.userPatterns.has(trade.userId)) {
      this.userPatterns.set(trade.userId, {
        userId: trade.userId,
        totalTrades: 0,
        buyVolume: 0,
        sellVolume: 0,
        netPosition: 0,
        avgTradeSize: 0,
        avgTimeBetweenTrades: 0,
        lastTradeTime: Date.now(),
      });
    }

    const pattern = this.userPatterns.get(trade.userId)!;
    const oldTotal = pattern.totalTrades;

    pattern.totalTrades += 1;
    if (trade.tradeType === 'BUY') {
      pattern.buyVolume += trade.amount;
    } else {
      pattern.sellVolume += trade.amount;
    }
    pattern.netPosition = pattern.buyVolume - pattern.sellVolume;
    pattern.avgTradeSize =
      (pattern.avgTradeSize * oldTotal + trade.amount) / pattern.totalTrades;
    pattern.lastTradeTime = trade.timestamp;
  }

  /**
   * Clean old data outside time window
   */
  private cleanOldData(): void {
    const cutoff = Date.now() - this.timeWindow * 2;

    for (const [key, trades] of this.tradeHistory.entries()) {
      const filtered = trades.filter((t) => t.timestamp > cutoff);
      if (filtered.length === 0) {
        this.tradeHistory.delete(key);
      } else {
        this.tradeHistory.set(key, filtered);
      }
    }
  }

  /**
   * Get statistics for a user
   */
  getUserStats(userId: string): UserTradePattern | null {
    return this.userPatterns.get(userId) || null;
  }

  /**
   * Get all users flagged
   */
  getFlaggedUsers(threshold: number = 0.6): Map<string, UserTradePattern> {
    // Would track flagged users separately in production
    return this.userPatterns;
  }
}

