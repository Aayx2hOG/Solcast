import express from 'express';
import cors from "cors";
import type { Request, Response } from "express";
import { authMiddleware } from './middleware';
import jwt from 'jsonwebtoken';
import { prismaClient } from 'db/client';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// Flag to track if database is available
let dbAvailable = true;

// Mock data for development when database is not available
const mockMarkets = [
    {
        id: "1",
        marketId: "market-1",
        question: "Will Bitcoin reach $100,000 by end of 2025?",
        description: "This market resolves to YES if Bitcoin price reaches or exceeds $100,000 USD on any major exchange before December 31, 2025.",
        category: "CRYPTO",
        createdAt: new Date(),
        endTimestamp: new Date("2025-12-31"),
        resolutionTimestamp: new Date("2026-01-01"),
        oracleSource: "CoinGecko",
        status: "ACTIVE",
        yesLiquidity: 50000,
        noLiquidity: 50000,
        totalVolume: 125000,
        yesPrice: 0.65,
        noPrice: 0.35,
        creator: { walletAddress: "7xKX...9Qwe" }
    },
    {
        id: "2",
        marketId: "market-2",
        question: "Will Ethereum ETF be approved in Q1 2026?",
        description: "This market resolves to YES if a spot Ethereum ETF is approved by the SEC in Q1 2026.",
        category: "CRYPTO",
        createdAt: new Date(),
        endTimestamp: new Date("2026-03-31"),
        resolutionTimestamp: new Date("2026-04-01"),
        oracleSource: "SEC Filings",
        status: "ACTIVE",
        yesLiquidity: 35000,
        noLiquidity: 45000,
        totalVolume: 89000,
        yesPrice: 0.44,
        noPrice: 0.56,
        creator: { walletAddress: "9mNv...2Hkl" }
    },
    {
        id: "3",
        marketId: "market-3",
        question: "Will AI pass the Turing Test by 2026?",
        description: "This market resolves to YES if any AI system officially passes the Turing Test as judged by an independent panel.",
        category: "TECHNOLOGY",
        createdAt: new Date(),
        endTimestamp: new Date("2026-12-31"),
        resolutionTimestamp: new Date("2027-01-01"),
        oracleSource: "AI Research Panel",
        status: "ACTIVE",
        yesLiquidity: 28000,
        noLiquidity: 32000,
        totalVolume: 67000,
        yesPrice: 0.47,
        noPrice: 0.53,
        creator: { walletAddress: "3pQr...8Tyu" }
    }
];

const mockUsers: Record<string, any> = {};

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
    }
    
    try {
        let user = await prismaClient.user.findUnique({
            where: { walletAddress }
        });
        if (!user) {
            user = await prismaClient.user.create({
                data: { walletAddress }
            });
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (error) {
        console.log("Database unavailable, using mock auth");
        dbAvailable = false;
        // Mock auth for development
        if (!mockUsers[walletAddress]) {
            mockUsers[walletAddress] = { id: walletAddress, walletAddress };
        }
        const token = jwt.sign({ userId: walletAddress }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: mockUsers[walletAddress] });
    }
});

app.get('/api/markets', async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const markets = await prismaClient.market.findMany({
            include: { creator: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ markets });
    } catch (error) {
        console.log("Database unavailable, returning mock markets");
        dbAvailable = false;
        res.json({ markets: mockMarkets });
    }
});

app.get('/api/markets/:id', async (req: Request, res: Response) => {
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
        dbAvailable = false;
        const market = mockMarkets.find(m => m.id === req.params.id || m.marketId === req.params.id);
        if (!market) {
            return res.status(404).json({ message: "Market not found" });
        }
        res.json(market);
    }
});

app.post('/api/markets', authMiddleware, async (req: Request, res: Response) => {
    const { question, description, category, endTimestamp, resolutionTimestamp, oracleSource, marketId } = req.body;

    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const market = await prismaClient.market.create({
            data: {
                marketId,
                question,
                description,
                category,
                endTimestamp: new Date(endTimestamp),
                resolutionTimestamp: new Date(resolutionTimestamp),
                oracleSource,
                creatorId: req.userId!,
            }
        });
        res.json({ market });
    } catch (error) {
        console.log("Database unavailable, returning mock market creation");
        dbAvailable = false;
        const newMarket = {
            id: String(mockMarkets.length + 1),
            marketId,
            question,
            description,
            category,
            createdAt: new Date(),
            endTimestamp: new Date(endTimestamp),
            resolutionTimestamp: new Date(resolutionTimestamp),
            oracleSource,
            status: "ACTIVE",
            yesLiquidity: 0,
            noLiquidity: 0,
            totalVolume: 0,
            yesPrice: 0.5,
            noPrice: 0.5,
            creator: { walletAddress: req.userId }
        };
        mockMarkets.push(newMarket as any);
        res.json({ market: newMarket });
    }
});

app.get('/api/accounts/:address', async (req: Request, res: Response) => {
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
        dbAvailable = false;
        const user = mockUsers[req.params.address] || { 
            id: req.params.address, 
            walletAddress: req.params.address,
            positions: [],
            orders: []
        };
        res.json({ user });
    }
});

app.get('/api/secure/profile', authMiddleware, async (req: Request, res: Response) => {
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
        dbAvailable = false;
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

app.post('/api/secure/orders', authMiddleware, async (req: Request, res: Response) => {
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
        dbAvailable = false;
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

app.post('/api/secure/positions', authMiddleware, async (req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const positions = await prismaClient.position.findMany({
            where: { userId: req.userId! },
            include: { market: true }
        });
        res.json({ positions });
    } catch (error) {
        console.log("Database unavailable, returning empty positions");
        dbAvailable = false;
        res.json({ positions: [] });
    }
});

app.get('/api/leaderboard', async (req: Request, res: Response) => {
    // Mock leaderboard data
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

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', dbAvailable, timestamp: Date.now().toString() });
});

process.on('SIGINT', async () => {
    await prismaClient.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Markets API: http://localhost:${PORT}/api/markets`);
});