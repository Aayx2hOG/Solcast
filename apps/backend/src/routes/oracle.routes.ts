import { Router, Request, Response } from 'express';
import { broadcastOracleResolution, getOracleHistory, OracleResolution } from '../utils/websocket';
import { prismaClient } from 'db/client';

export const oracleRouter = Router();

// Internal endpoint for oracle-service to push resolution data
oracleRouter.post('/resolution', async (req: Request, res: Response) => {
    try {
        const resolution: OracleResolution = req.body;
        
        if (!resolution.marketId || resolution.status === undefined) {
            return res.status(400).json({ error: 'Invalid resolution data' });
        }

        // Broadcast to all subscribed clients
        broadcastOracleResolution(resolution);

        // Store in database for historical data
        try {
            await prismaClient.oracleResolution.create({
                data: {
                    marketId: resolution.marketId,
                    status: resolution.status,
                    value: typeof resolution.value === 'number' ? resolution.value : 0,
                    valueString: typeof resolution.value === 'string' ? resolution.value : null,
                    confidence: resolution.confidence,
                    sources: resolution.sources || [],
                }
            });
        } catch (dbError) {
            console.error('Failed to store oracle resolution:', dbError);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Oracle resolution error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get oracle resolution history
oracleRouter.get('/history', async (req: Request, res: Response) => {
    try {
        const { marketId, limit = 100 } = req.query;

        // Try to get from database first
        try {
            const resolutions = await prismaClient.oracleResolution.findMany({
                where: marketId ? { marketId: marketId as string } : undefined,
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
            });
            return res.json({ resolutions: resolutions.reverse() });
        } catch (dbError) {
            // Fallback to in-memory history
            const history = getOracleHistory(marketId as string | undefined);
            return res.json({ resolutions: history.slice(-Number(limit)) });
        }
    } catch (error) {
        console.error('Oracle history error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get latest oracle price for a specific market
oracleRouter.get('/price/:marketId', async (req: Request, res: Response) => {
    try {
        const { marketId } = req.params;

        try {
            const latest = await prismaClient.oracleResolution.findFirst({
                where: { marketId },
                orderBy: { createdAt: 'desc' },
            });

            if (!latest) {
                // Try in-memory
                const history = getOracleHistory(marketId);
                if (history.length > 0) {
                    return res.json(history[history.length - 1]);
                }
                return res.status(404).json({ error: 'No price data found' });
            }

            return res.json(latest);
        } catch (dbError) {
            const history = getOracleHistory(marketId);
            if (history.length > 0) {
                return res.json(history[history.length - 1]);
            }
            return res.status(404).json({ error: 'No price data found' });
        }
    } catch (error) {
        console.error('Oracle price error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
