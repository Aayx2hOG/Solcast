import { Router, Request, Response } from 'express';
import { prismaClient, MarketCategory } from 'db/client';
import { authMiddleware } from '../middleware';
import { dbAvailable, setDbAvailable } from '../utils/config';
import { mockMarkets } from '../utils/mockData';
import { CreateMarketSchema, validateRequest } from '../utils/validation';

export const marketsRouter = Router();

marketsRouter.get('/', async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const markets = await prismaClient.market.findMany({
            include: { creator: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ markets });
    } catch (error) {
        console.log("Database unavailable, returning mock markets");
        setDbAvailable(false);
        res.json({ markets: mockMarkets });
    }
});

marketsRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const market = await prismaClient.market.findUnique({
            where: { id: req.params.id },
            include: { creator: true, positions: true }
        });
        if (!market) {
            return res.status(404).json({ message: "Market not found" });
        }
        res.json(market);
    } catch (error) {
        console.log("Database unavailable, returning mock market");
        setDbAvailable(false);
        const market = mockMarkets.find(m => m.id === req.params.id || m.marketId === req.params.id);
        if (!market) {
            return res.status(404).json({ message: "Market not found" });
        }
        res.json(market);
    }
});

marketsRouter.post('/', authMiddleware, async (req: Request, res: Response) => {
    const validation = validateRequest(CreateMarketSchema, req.body);
    
    if (!validation.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    const { question, description, category, endTimestamp, resolutionTimestamp, oracleSource, marketId } = validation.data;
    const finalMarketId = marketId || `market-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const market = await prismaClient.market.create({
            data: {
                marketId: finalMarketId,
                question,
                description,
                category: category as MarketCategory,
                endTimestamp: new Date(endTimestamp * 1000),
                resolutionTimestamp: new Date(resolutionTimestamp * 1000),
                oracleSource,
                creator: {
                    connect: {
                        id: (req as any).userId
                    }
                }
            }
        });
        res.json({ market });
    } catch (error) {
        console.log("Database unavailable, returning mock market creation");
        setDbAvailable(false);
        const newMarket = {
            id: String(mockMarkets.length + 1),
            marketId: finalMarketId,
            question,
            description,
            category,
            createdAt: new Date(),
            endTimestamp: new Date(endTimestamp * 1000),
            resolutionTimestamp: new Date(resolutionTimestamp * 1000),
            oracleSource,
            status: "ACTIVE",
            yesLiquidity: 0,
            noLiquidity: 0,
            totalVolume: 0,
            yesPrice: 0.5,
            noPrice: 0.5,
        };
        mockMarkets.push(newMarket as any);
        res.json({ market: newMarket });
    }
});

marketsRouter.get('/:id/trades', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const trades = await prismaClient.trade.findMany({
            where: { marketId: req.params.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json({ trades: trades.map(t => ({ ...t, amount: t.amount.toString(), shares: t.shares.toString(), price: t.price.toString() })) });
    } catch (e) {
        res.json({ trades: [] });
    }
});

marketsRouter.get('/:id/stats', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const [stats, uniqueTrades] = await Promise.all([
            prismaClient.trade.aggregate({
                where: { marketId: req.params.id },
                _sum: { amount: true },
                _count: true
            }),
            prismaClient.trade.groupBy({
                where: { marketId: req.params.id },
                by: ['userId']
            }),
        ]);
        res.json({
            totalVolume: stats._sum.amount?.toString() || "0",
            uniqueTraders: uniqueTrades.length,
            totalTrades: stats._count
        });
    } catch (e) {
        res.json({ totalVolume: "0", uniqueTraders: 0, totalTrades: 0 });
    }
});

marketsRouter.get('/:id/chart', async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const trades = await prismaClient.trade.findMany({
            where: { marketId: req.params.id },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true, price: true, type: true }
        });

        const hourly: Record<number, number[]> = {};
        trades.forEach(t => {
            const hour = new Date(t.createdAt).setMinutes(0, 0, 0);
            if (!hourly[hour]) hourly[hour] = [];
            hourly[hour].push(Number(t.price));
        });

        const points = Object.entries(hourly).map(([ts, prices]) => ({
            timestamp: Number(ts),
            price: prices.reduce((a, b) => a + b, 0) / prices.length
        }));

        res.json({ points });
    } catch (error) {
        res.json({ points: [] });
    }
});

