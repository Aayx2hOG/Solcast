import { Router, Request, Response } from 'express';
import { prismaClient } from 'db/client';

export const analyticsRouter = Router();

analyticsRouter.get('/anomaly/alerts', async (req: Request, res: Response) => {
    try {
        const { limit = '50', severity, marketId } = req.query;

        const where: any = { isAnomaly: true };
        if (severity) where.severity = severity;
        if (marketId) where.marketId = marketId;

        const alerts = await prismaClient.anomalyDetection.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
        });

        res.json({ alerts });
    } catch (error) {
        console.error('Error fetching anomaly alerts:', error);
        res.status(500).json({ error: 'Failed to fetch anomaly alerts' });
    }
});

analyticsRouter.get('/anomaly/market/:marketId', async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;
        const { hours = '24' } = req.query;

        const since = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

        const anomalies = await prismaClient.anomalyDetection.findMany({
            where: {
                marketId,
                createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
        });

        const stats = {
            totalDetections: anomalies.length,
            anomalies: anomalies.filter(a => a.isAnomaly).length,
            critical: anomalies.filter(a => a.severity === 'critical').length,
            high: anomalies.filter(a => a.severity === 'high').length,
            avgScore: anomalies.reduce((sum, a) => sum + a.anomalyScore, 0) / anomalies.length || 0,
            bySource: anomalies.reduce((acc: any, a) => {
                if (!acc[a.source]) acc[a.source] = { total: 0, anomalies: 0, avgScore: 0 };
                acc[a.source].total++;
                if (a.isAnomaly) acc[a.source].anomalies++;
                acc[a.source].avgScore = (acc[a.source].avgScore * (acc[a.source].total - 1) + a.anomalyScore) / acc[a.source].total;
                return acc;
            }, {}),
        };

        res.json({ stats, recentAnomalies: anomalies.slice(0, 20) });
    } catch (error) {
        console.error('Error fetching market anomaly data:', error);
        res.status(500).json({ error: 'Failed to fetch market anomaly data' });
    }
});

analyticsRouter.get('/market/:marketId', async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;
        const { hours = '24' } = req.query;
        const since = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

        const [fraudData, anomalyData, tradeStats] = await Promise.all([
            prismaClient.fraudDetection.findMany({
                where: { marketId, createdAt: { gte: since } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prismaClient.anomalyDetection.findMany({
                where: { marketId, createdAt: { gte: since } },
                orderBy: { createdAt: 'desc' },
                take: 50,
            }),
            prismaClient.trade.aggregate({
                where: { marketId, createdAt: { gte: since } },
                _count: true,
                _sum: { amount: true },
            }),
        ]);

        const fraudScore = fraudData.length > 0 ? fraudData.reduce((sum, f) => sum + f.riskScore, 0) / fraudData.length : 0;
        const anomalyScore = anomalyData.length > 0 ? anomalyData.reduce((sum, a) => sum + a.anomalyScore, 0) / anomalyData.length : 0;
        const overAllRisk = (fraudScore * 0.6) + (anomalyScore * 0.4);

        res.json({
            marketId,
            timeframe: `${hours}h`,
            riskProfile: {
                overall: overAllRisk,
                fraudScore,
                anomalyScore,
                riskLevel: overAllRisk > 0.7 ? 'HIGH' : overAllRisk > 0.4 ? 'MEDIUM' : 'LOW'
            },
            fraud: {
                totalIncidents: fraudData.length,
                blocked: fraudData.filter(f => f.recommendation === 'BLOCK').length,
                flagged: fraudData.filter(f => f.recommendation === 'FLAG').length,
            },
            anomalies: {
                total: anomalyData.length,
                critical: anomalyData.filter(a => a.severity === 'critical').length,
                high: anomalyData.filter(a => a.severity === 'high').length,
                medium: anomalyData.filter(a => a.severity === 'medium').length,
                low: anomalyData.filter(a => a.severity === 'low').length,
            },
            trading: {
                volume: tradeStats._sum.amount?.toString() || '0',
                tradeCount: tradeStats._count,
            },
            recentFraud: fraudData.slice(0, 5),
            recentAnomalies: anomalyData.slice(0, 5),
        });
    } catch (e) {
        console.error('Error fetching market analytics:', e);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

