import express from 'express';
import cors from "cors";
import type { Request, Response } from "express";
import { authMiddleware } from './middleware';
import jwt from 'jsonwebtoken';
import { prismaClient } from 'db/client';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
    }
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
});

app.get('/api/markets', async (req: Request, res: Response) => {
    const markets = await prismaClient.market.findMany({
        include: { creator: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json({ markets })
});

app.get('/api/markets/:id', async (req: Request, res: Response) => {
    const market = await prismaClient.market.findUnique({
        where: { id: req.params.id },
        include: { creator: true, positions: true }
    });
    if (!market) {
        return res.status(404).json({ message: "Market not found" });
    }
    res.json(market);
});

app.post('/api/markets', authMiddleware, async (req: Request, res: Response) => {
    const { question, description, category, endTimestamp, resolutionTimestamp, oracleSource, marketId } = req.body;

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
    })
    res.json({ market });
});

app.get('/api/accounts/:address', async (req: Request, res: Response) => {
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
});

app.get('/api/secure/profile', authMiddleware, async (req: Request, res: Response) => {
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
});

app.post('/api/secure/orders', authMiddleware, async (req: Request, res: Response) => {
    const { marketId, orderType, outcome, shares, price } = req.body;

    const order = await prismaClient.order.create({
        data: {
            userId: req.userId!,
            marketId,
            orderType,
            outcome,
            shares: BigInt(shares),
            price: BigInt(price),
        }
    })
    res.json({ order });
});

app.post('/api/secure/positions', authMiddleware, async (req: Request, res: Response) => {
    const positions = await prismaClient.position.findMany({
        where: { userId: req.userId! },
        include: { market: true }
    });
    res.json({ positions });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now().toString() });
});

process.on('SIGINT', async () => {
    await prismaClient.$disconnect();
    process.exit(0);
});

app.listen(PORT);