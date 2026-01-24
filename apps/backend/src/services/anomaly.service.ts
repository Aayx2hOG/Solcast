import { AnomalyDetector } from '../../oracle-service/src/ai/anomalyDetector';
import type { AnomalyResult } from '../../oracle-service/src/ai/types';

const anomalyDetector = new AnomalyDetector({
    stdDevThreshold: 3,
    minDataPoints: 5,
    timeWindow: 24 * 60 * 60 * 1000,
    priceChangeThreshold: 30,
    volumeSpikeFactor: 5,
});

export function detectAnomaly(marketId: string, price: number): AnomalyResult {
    anomalyDetector.addDataPoint(marketId, price, Date.now());
    return anomalyDetector.detectAnomaly(marketId, price);
}

export function getStats(source: string) {
    return anomalyDetector.getStats(source);
}

export { anomalyDetector };
