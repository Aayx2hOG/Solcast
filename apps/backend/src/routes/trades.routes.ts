import { Router, Request, Response } from 'express';
import { prismaClient } from 'db/client';
import { authMiddleware } from '../middleware';
import { dbAvailable } from '../utils/config';
import { recordTrade } from '../services/fraud.service';
import { detectAnomaly } from '../services/anomaly.service';
import { broadcastPrice } from '../utils/websocket';
import { TradeSchema, validateRequest } from '../utils/validation';

export const tradesRouter = Router();

/**
 * POST /api/trades
 * Execute a trade with fraud detection and anomaly checking
 * @requires Authentication
 */
tradesRouter.post('/', authMiddleware, async (req: Request, res: Response) => {
    const validation = validateRequest(TradeSchema, req.body);
    
    if (!validation.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    const { marketId, amount, type, shares, price, txHash } = validation.data;

    try {
        const fraudResult = recordTrade({
            userId: req.userId!,
            marketId,
            tradeType: type as 'BUY' | 'SELL',
            amount,
            price,
            timestamp: Date.now(),
            txHash,
        });

        if (fraudResult.recommendation === 'BLOCK') {
            console.warn(`[FRAUD BLOCKED] user=${req.userId} market=${marketId} indicators=${fraudResult.indicators.map(i => i.type).join(',')}`);

            if (dbAvailable) {
                try {
                    await prismaClient.fraudDetection.create({
                        data: {
                            userId: req.userId!,
                            marketId,
                            riskScore: fraudResult.overallRiskScore,
                            recommendation: fraudResult.recommendation,
                            indicators: fraudResult.indicators.map(i => ({
                                type: i.type,
                                severity: i.severity,
                                score: i.score,
                                evidence: i.evidence,
                                suspiciousUsers: i.suspiciousUsers,
                                affectedMarkets: i.affectedMarkets,
                            })),
                        }
                    });
                } catch (e) {
                    console.error('Failed to save fraud detection:', e);
                }
            }

            return res.status(403).json({
                error: 'Trade blocked due to suspicious activity',
                fraud: {
                    score: fraudResult.overallRiskScore,
                    indicators: fraudResult.indicators.map(i => ({
                        type: i.type,
                        severity: i.severity,
                        evidence: i.evidence,
                    })),
                }
            });
        }

        if (fraudResult.recommendation === 'FLAG') {
            console.warn(`[FRAUD FLAGGED] user=${req.userId} market=${marketId} score=${fraudResult.overallRiskScore.toFixed(3)}`);
        }

        const anomalyResult = detectAnomaly(marketId, price);

        if (anomalyResult.isAnomaly && anomalyResult.score.severity === 'critical') {
            console.warn(`[ANOMALY] market=${marketId} score=${anomalyResult.score.value.toFixed(3)} severity=critical`);

            if (anomalyResult.score.value > 0.9) {
                return res.status(403).json({
                    error: 'Trade blocked due to critical anomaly',
                    anomaly: {
                        score: anomalyResult.score.value,
                        indicators: anomalyResult.score.reasons,
                        reasons: anomalyResult.score.reasons,
                    }
                });
            }
        }

        if (!dbAvailable) throw new Error("DB unavailable");
        const trade = await prismaClient.trade.create({
            data: {
                marketId,
                userId: req.userId!,
                type,
                amount: BigInt(Math.round(amount)),
                shares: BigInt(Math.round(shares)),
                price: BigInt(Math.round(price * 1000000)), // Store as micro-units
                txHash: txHash || `temp-${Date.now()}`,
            }
        });

        if (fraudResult.isSuspicious || fraudResult.recommendation === 'FLAG') {
            try {
                await prismaClient.fraudDetection.create({
                    data: {
                        tradeId: trade.id,
                        userId: req.userId!,
                        marketId,
                        riskScore: fraudResult.overallRiskScore,
                        recommendation: fraudResult.recommendation,
                        indicators: fraudResult.indicators.map(i => ({
                            type: i.type,
                            severity: i.severity,
                            score: i.score,
                            evidence: i.evidence,
                            suspiciousUsers: i.suspiciousUsers,
                            affectedMarkets: i.affectedMarkets,
                        })),
                    }
                });
            } catch (e) {
                console.error('Failed to save fraud detection:', e);
            }
        }

        const market = await prismaClient.market.findUnique({
            where: { marketId }
        });
        if (market) {
            broadcastPrice(marketId, {
                yesPrice: Number(market.yesLiquidity) / (Number(market.yesLiquidity) + Number(market.noLiquidity)),
                noPrice: Number(market.noLiquidity) / (Number(market.yesLiquidity) + Number(market.noLiquidity)),
                volume: Number(market.totalVolume)
            });
        }

        res.json({
            trade: {
                ...trade,
                amount: trade.amount.toString(),
                shares: trade.shares.toString(),
                price: trade.price.toString()
            },
            fraud: {
                flagged: fraudResult.recommendation === 'FLAG',
                riskScore: fraudResult.overallRiskScore,
            },
            anomaly: {
                detected: anomalyResult.isAnomaly,
                score: anomalyResult.score.value,
                reasons: anomalyResult.score.reasons,
                severity: anomalyResult.score.severity,
            }
        });
    } catch (e) {
        res.json({
            trade: {
                id: txHash,
                marketId,
                userId: req.userId!,
                type,
                amount: amount.toString(),
                shares: shares.toString(),
                price: price.toString(),
                txHash,
                createdAt: new Date()
            }
        });
    }
});
