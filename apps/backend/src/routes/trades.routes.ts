import { Router, Request, Response } from 'express';
import { prismaClient } from 'db/client';
import { authMiddleware } from '../middleware';
import { dbAvailable } from '../utils/config';
import { recordTrade } from '../services/fraud.service';
import { detectAnomaly } from '../services/anomaly.service';
import { broadcastPrice } from '../utils/websocket';

export const tradesRouter = Router();

tradesRouter.post('/', authMiddleware, async (req: Request, res: Response) => {
    const { marketId, amount, type, shares, price, txHash } = req.body;

    try {
        const fraudResult = recordTrade({
            userId: req.userId!,
            marketId,
            tradeType: type.toUpperCase() as 'BUY' | 'SELL',
            amount: parseFloat(amount),
            price: parseFloat(price),
            timestamp: Date.now(),
            txHash,
        });

        if (fraudResult.recommendation === 'BLOCK') {
            console.warn(`[FRAUD BLOCKED] User ${req.userId} on market ${marketId}`);
            console.warn(`Indicators: ${fraudResult.indicators.map(i => i.type).join(', ')}`);

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
            console.warn(`[FRAUD FLAGGED] User ${req.userId} on market ${marketId}`);
            console.warn(`Risk score: ${fraudResult.overallRiskScore.toFixed(3)}`);
            console.warn(`Indicators: ${fraudResult.indicators.map(i => `${i.type}(${i.severity})`).join(', ')}`);
        }

        const priceValue = parseFloat(price);
        const anomalyResult = detectAnomaly(marketId, priceValue);

        if (anomalyResult.isAnomaly && anomalyResult.score.severity === 'critical') {
            console.warn(`critical anomaly market ${marketId}: score=${anomalyResult.score.value}`);
            console.warn(`Indicators: ${anomalyResult.score.reasons.join(', ')}`);

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
                amount: BigInt(amount),
                shares: BigInt(shares),
                price: BigInt(price),
                txHash,
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
