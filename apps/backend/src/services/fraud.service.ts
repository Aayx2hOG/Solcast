import { FraudDetector } from '../../oracle-service/src/ai/fraudDetector';
import type { TradeEvent, FraudDetectionResult } from '../../oracle-service/src/ai/fraudDetection.types';

const fraudDetector = new FraudDetector(60 * 60 * 1000);

export function recordTrade(trade: TradeEvent): FraudDetectionResult {
    return fraudDetector.recordTrade(trade);
}

export function getUserStats(userId: string) {
    return fraudDetector.getUserStats(userId);
}

export function getFlaggedUsers(threshold?: number) {
    return fraudDetector.getFlaggedUsers(threshold);
}

export { fraudDetector };
