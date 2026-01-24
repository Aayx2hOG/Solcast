import { Router, Request, Response } from 'express';
import { prismaClient } from 'db/client';
import { authMiddleware } from '../middleware';

export const fraudRouter = Router();

fraudRouter.get('/alerts', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { limit = '50', severity, marketId } = req.query;

        const where: any = {};
        if (severity) where.recommendation = severity;
        if (marketId) where.marketId = marketId;

        const alerts = await prismaClient.fraudDetection.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
            include: {
                trade: {
                    select: {
                        id: true,
                        type: true,
                        amount: true,
                        price: true,
                        txHash: true,
                    }
                }
            }
        });

        res.json({ alerts });
    } catch (error) {
        console.error('Error fetching fraud alerts:', error);
        res.status(500).json({ error: 'Failed to fetch fraud alerts' });
    }
});

fraudRouter.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const fraudHistory = await prismaClient.fraudDetection.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const stats = {
            totalFlags: fraudHistory.length,
            blocked: fraudHistory.filter(f => f.recommendation === 'BLOCK').length,
            flagged: fraudHistory.filter(f => f.recommendation === 'FLAG').length,
            avgRiskScore: fraudHistory.reduce((sum, f) => sum + f.riskScore, 0) / fraudHistory.length || 0,
            recentActivity: fraudHistory.slice(0, 10),
        };

        res.json({ stats });
    } catch (error) {
        console.error('Error fetching user fraud history:', error);
        res.status(500).json({ error: 'Failed to fetch user fraud history' });
    }
});

fraudRouter.get('/market/:marketId', async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;

        const fraudActivity = await prismaClient.fraudDetection.findMany({
            where: { marketId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const stats = {
            totalIncidents: fraudActivity.length,
            blocked: fraudActivity.filter(f => f.recommendation === 'BLOCK').length,
            flagged: fraudActivity.filter(f => f.recommendation === 'FLAG').length,
            avgRiskScore: fraudActivity.reduce((sum, f) => sum + f.riskScore, 0) / fraudActivity.length || 0,
            indicatorBreakdown: fraudActivity.reduce((acc: any, f: any) => {
                const indicators = f.indicators as any[];
                indicators.forEach((ind: any) => {
                    acc[ind.type] = (acc[ind.type] || 0) + 1;
                });
                return acc;
            }, {}),
        };

        res.json({ stats, recentActivity: fraudActivity.slice(0, 10) });
    } catch (error) {
        console.error('Error fetching market fraud activity:', error);
        res.status(500).json({ error: 'Failed to fetch market fraud activity' });
    }
});

