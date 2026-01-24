import { AnomalyDetector } from './anomalyDetector';
import { AnomalyDetectionConfig } from './types';

const anomalyConfig: Partial<AnomalyDetectionConfig> = {
  stdDevThreshold: 3,
  minDataPoints: 5,
  timeWindow: 24 * 60 * 60 * 1000,
  priceChangeThreshold: 30,
};

const detector = new AnomalyDetector(anomalyConfig);
export function processDataWithAnomalyDetection(
  source: string,
  value: number
): boolean {
  detector.addDataPoint(source, value, Date.now());

  const result = detector.detectAnomaly(source, value);

  if (result.isAnomaly) {
    console.warn(` Anomaly detected in ${source}:`, {
      score: result.score.value,
      severity: result.score.severity,
      reasons: result.score.reasons,
    });

    switch (result.score.severity) {
      case 'critical':
        return false;
      case 'high':
        console.warn(`High severity anomaly - use with caution`);
        return true;
      case 'medium':
        console.log('Medium severity - proceeding with logging');
        return true;
      case 'low':
        return true;
    }
  }

  return true;
}

export { detector };
