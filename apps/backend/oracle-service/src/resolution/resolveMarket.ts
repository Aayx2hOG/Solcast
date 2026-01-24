import { FETCHERS, MarketType } from "./fetcherRegistry";
import { validate } from "../validation/validator";
import { OracleData } from "../models/OracleData";
import { ResolutionDecision } from "../types";
import { AnomalyDetector } from "../ai/anomalyDetector";

// Import prisma client - will work when DB is available
let prismaClient: any = null;
try {
  const dbModule = require('db');
  prismaClient = dbModule.prismaClient;
} catch (e) {
  console.log('[resolveMarket] Database not available - anomaly persistence disabled');
}

// Initialize global anomaly detector
const anomalyDetector = new AnomalyDetector({
  stdDevThreshold: 3,
  minDataPoints: 5,
  timeWindow: 24 * 60 * 60 * 1000, // 24 hours
  priceChangeThreshold: 30, // 30% max change
  volumeSpikeFactor: 5,
});

interface EnhancedOracleData extends OracleData {
  anomalyScore?: number;
  anomalySeverity?: 'low' | 'medium' | 'high' | 'critical';
  anomalyReasons?: string[];
}

function resolvePrice(data: EnhancedOracleData[]): { price: number; confidenceAdjustment: number } {
  const validPrices = data
    .filter(d => d.healthy === true && typeof d.value === "number")
    .map(d => ({
      value: d.value as number,
      source: d.source,
      anomalyScore: d.anomalyScore || 0,
      anomalySeverity: d.anomalySeverity || 'low',
    }))
    .sort((a, b) => a.value - b.value);

  if (validPrices.length === 0) {
    throw new Error("No valid prices");
  }

  // Calculate weighted median, deprioritizing anomalies
  const totalWeight = validPrices.reduce((sum, p) => sum + (1 - p.anomalyScore), 0);
  const weights = validPrices.map(p => (1 - p.anomalyScore) / totalWeight);
  
  let cumulativeWeight = 0;
  let price = validPrices[0].value;
  for (let i = 0; i < validPrices.length; i++) {
    cumulativeWeight += weights[i];
    if (cumulativeWeight >= 0.5) {
      price = validPrices[i].value;
      break;
    }
  }

  // Adjust confidence based on anomaly prevalence
  const anomalousCount = validPrices.filter(p => p.anomalyScore > 0.5).length;
  const anomalyRate = anomalousCount / validPrices.length;
  const confidenceAdjustment = Math.max(0.7, 1 - anomalyRate * 0.5);

  return { price, confidenceAdjustment };
}

export async function resolveMarket(
  marketId: string,
  marketType: MarketType
): Promise<ResolutionDecision> {

  const fetchers = FETCHERS[marketType];
  if (!fetchers || fetchers.length === 0) {
    return { status: "RETRY" };
  }

  const results: EnhancedOracleData[] = [];

  for (const fetcher of fetchers) {
    try {
      const data = await fetcher.fetch(marketId);
      
      // Perform anomaly detection on numeric data
      let enhancedData: EnhancedOracleData = { ...data };
      if (typeof data.value === "number") {
        const anomalyResult = anomalyDetector.detectAnomaly(data.source, data.value);
        enhancedData.anomalyScore = anomalyResult.score.value;
        enhancedData.anomalySeverity = anomalyResult.score.severity;
        enhancedData.anomalyReasons = anomalyResult.score.reasons;

        if (anomalyResult.isAnomaly) {
          console.warn(
            `[ANOMALY] ${marketId} ${data.source}: severity=${anomalyResult.score.severity}, score=${anomalyResult.score.value.toFixed(3)}`
          );
          console.debug(`  Reasons: ${anomalyResult.score.reasons.join(", ")}`);
        }

        // Save anomaly detection result to database
        if (prismaClient && (anomalyResult.isAnomaly || anomalyResult.score.value > 0.3)) {
          try {
            await prismaClient.anomalyDetection.create({
              data: {
                marketId,
                source: data.source,
                value: data.value,
                anomalyScore: anomalyResult.score.value,
                severity: anomalyResult.score.severity,
                reasons: anomalyResult.score.reasons,
                isAnomaly: anomalyResult.isAnomaly,
                metadata: {
                  dataCount: anomalyResult.metadata.dataCount,
                  mean: anomalyResult.metadata.mean,
                  stdDev: anomalyResult.metadata.stdDev,
                  zScore: anomalyResult.metadata.zScore,
                },
              }
            });
          } catch (e) {
            console.error('Failed to save anomaly detection:', e);
          }
        }

        // Add data point to detector history
        anomalyDetector.addDataPoint(data.source, data.value, data.timestamp);
      }
      
      results.push(enhancedData);
    } catch (err: any) {
      console.error(
        `[FETCH FAIL] ${marketId} ${fetcher.constructor.name}`,
        err?.message
      );
    }
  }

  if (marketType === "SPORTS" || marketType === "ELECTION") {
    const result = results.find(
      r => r.healthy === true && typeof r.value === "string"
    );

    if (!result) {
      return { status: "RETRY" };
    }

    return {
      status: "RESOLVED",
      value: result.value,
      confidence: result.confidence,
    };
  }

  const minSources = Math.max(
    1,
    Math.ceil(fetchers.length * 0.6)
  );

  const validation = validate(results, minSources);
  if (validation.status === "RETRY") {
    return { status: "RETRY" };
  }

  const { price, confidenceAdjustment } = resolvePrice(results);
  const adjustedConfidence = validation.confidence * confidenceAdjustment;

  console.info(
    `[RESOLUTION] ${marketId}: price=${price}, confidence=${adjustedConfidence.toFixed(3)} (base=${validation.confidence.toFixed(3)}, anomaly_adj=${confidenceAdjustment.toFixed(3)})`
  );

  return {
    status: "RESOLVED",
    value: price,
    confidence: adjustedConfidence,
  };
}
