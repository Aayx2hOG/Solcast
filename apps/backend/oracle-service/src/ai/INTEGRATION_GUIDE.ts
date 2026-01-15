import AnomalyDetector from './anomalyDetector';
import { AnomalyDetectionConfig } from './types';

/**
 * Example: How to integrate anomaly detection into your fetcher pipeline
 */

// 1. Initialize detector with custom config
const anomalyConfig: Partial<AnomalyDetectionConfig> = {
  stdDevThreshold: 3,
  minDataPoints: 5,
  timeWindow: 24 * 60 * 60 * 1000, // 24 hours
  priceChangeThreshold: 30, // 30% max change
};

const detector = new AnomalyDetector(anomalyConfig);

// 2. Add data points as you fetch them
export function processDataWithAnomalyDetection(
  source: string,
  value: number
): boolean {
  // Add point to history
  detector.addDataPoint(source, value, Date.now());

  // Check for anomalies
  const result = detector.detectAnomaly(source, value);

  if (result.isAnomaly) {
    console.warn(`🚨 Anomaly detected in ${source}:`, {
      score: result.score.value,
      severity: result.score.severity,
      reasons: result.score.reasons,
    });

    // Handle based on severity
    switch (result.score.severity) {
      case 'critical':
        // Reject data, alert team
        return false;
      case 'high':
        // Flag for review, use with caution
        console.warn(`High severity anomaly - use with caution`);
        return true;
      case 'medium':
        // Log and proceed
        console.log('Medium severity - proceeding with logging');
        return true;
      case 'low':
        // Just log
        return true;
    }
  }

  return true;
}

// 3. Integration point in resolveMarket.ts:
// Replace this:
//   const fetchedData = await fetcher.fetch(market);
// 
// With this:
//   const fetchedData = await fetcher.fetch(market);
//   const isValid = processDataWithAnomalyDetection(
//     fetcher.constructor.name,
//     fetchedData.price
//   );
//   if (!isValid) throw new Error('Data failed anomaly detection');

export { detector };
