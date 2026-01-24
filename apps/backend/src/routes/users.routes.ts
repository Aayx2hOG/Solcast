import { Router, Request, Response } from 'express';
import { prismaClient } from 'db/client';
import { authMiddleware } from '../middleware';
import { dbAvailable, setDbAvailable } from '../utils/config';
import { mockUsers } from '../utils/mockData';

export const usersRouter = Router();

usersRouter.get('/accounts/:address', async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const user = await prismaClient.user.findUnique({
            where: { walletAddress: req.params.address },
            include: {
                positions: { include: { market: true } },
                orders: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        console.log("Database unavailable, returning mock user");
        setDbAvailable(false);
        const user = mockUsers[req.params.address] || {
            id: req.params.address,
            walletAddress: req.params.address,
            positions: [],
            orders: []
        };
        res.json({ user });
    }
});

usersRouter.get('/secure/profile', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const user = await prismaClient.user.findUnique({
            where: { id: req.userId },
            include: {
                positions: true, orders: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        console.log("Database unavailable, returning mock profile");
        setDbAvailable(false);
        res.json({
            user: {
                id: req.userId,
                walletAddress: req.userId,
                positions: [],
                orders: []
            }
        });
    }
});

usersRouter.post('/secure/orders', authMiddleware, async (req: Request, res: Response) => {
    const { marketId, orderType, outcome, shares, price } = req.body;

    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const order = await prismaClient.order.create({
            data: {
                userId: req.userId!,
                marketId,
                orderType,
                outcome,
                shares: BigInt(shares),
                price: BigInt(price),
            }
        });
        res.json({ order });
    } catch (error) {
        console.log("Database unavailable, returning mock order");
        setDbAvailable(false);
        res.json({
            order: {
                id: Date.now().toString(),
                userId: req.userId,
                marketId,
                orderType,
                outcome,
                shares,
                price,
                createdAt: new Date()
            }
        });
    }
});

usersRouter.post('/secure/positions', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const positions = await prismaClient.position.findMany({
            where: { userId: req.userId! },
            include: { market: true }
        });
        res.json({ positions });
    } catch (error) {
        console.log("Database unavailable, returning empty positions");
        setDbAvailable(false);
        res.json({ positions: [] });
    }
});

usersRouter.get('/users/:address/trades', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const user = await prismaClient.user.findUnique({
            where: { walletAddress: req.params.address },
            include: { trades: true },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const trades = await prismaClient.trade.findMany({
            where: { userId: user.id },
            include: { market: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ trades: trades.map(t => ({ ...t, amount: t.amount.toString(), shares: t.shares.toString(), price: t.price.toString() })) });
    } catch (e) {
        res.json({ trades: [] });
    }
});

usersRouter.get('/leaderboard', async (req: Request, res: Response) => {
    res.json({
        traders: [
            { rank: 1, address: "7xKX...9Qwe", totalPnl: 15420.50, totalVolume: 125000, winRate: 68.5, activePositions: 12, resolvedMarkets: 45 },
            { rank: 2, address: "9mNv...2Hkl", totalPnl: 12350.25, totalVolume: 98500, winRate: 71.2, activePositions: 8, resolvedMarkets: 52 },
            { rank: 3, address: "3pQr...8Tyu", totalPnl: 10890.75, totalVolume: 87200, winRate: 65.8, activePositions: 15, resolvedMarkets: 38 },
            { rank: 4, address: "5kLm...4Bnm", totalPnl: 9542.00, totalVolume: 76800, winRate: 63.4, activePositions: 10, resolvedMarkets: 41 },
            { rank: 5, address: "2wXy...7Fgh", totalPnl: 8765.50, totalVolume: 69300, winRate: 69.7, activePositions: 7, resolvedMarkets: 34 },
        ]
    });
});

