import express from 'express';
import cors from "cors";
import type { Request, Response } from "express";
import { authMiddleware } from './middleware';
import jwt from 'jsonwebtoken';
import { prismaClient } from 'db/client';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { FraudDetector } from '../oracle-service/src/ai/fraudDetector';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

let dbAvailable = true;

// Initialize fraud detector
const fraudDetector = new FraudDetector(60 * 60 * 1000); // 1 hour window

const wss = new WebSocketServer({server, path: '/ws'});
const marketSubs : Map<string, Set<WebSocket>> = new Map();

wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
        try {
            const msg = JSON.parse(data.toString());
            if(msg.action === 'subscribe' && msg.marketId){
                if (!marketSubs.has(msg.marketId)){
                    marketSubs.set(msg.marketId, new Set());
                }
                marketSubs.get(msg.marketId)!.add(ws);
                ws.send(JSON.stringify({type: "subscribed", marketId: msg.marketId}));
            }
            if (msg.action === 'unsubscribe' && msg.marketId){
                if (marketSubs.has(msg.marketId) && marketSubs.get(msg.marketId)!.has(ws)){
                    marketSubs.get(msg.marketId)!.delete(ws);
                }
                ws.send(JSON.stringify({type: "unsubscribed", marketId: msg.marketId}));
            }
        }catch(e){
            console.log(e);
        }
    });
    ws.on('close', () => {
        marketSubs.forEach((set) => {
            set.delete(ws);
        });
    });
});

function broadcastPrice(marketId: string, data: {yesPrice: number, noPrice: number, volume: number}){
    const subs = marketSubs.get(marketId);
    if (!subs) return;
    const payload = JSON.stringify({type: 'MARKET_PRICE', marketId, ...data, ts: Date.now()})
    subs.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(payload));
};

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

app.post('/api/trades', authMiddleware, async (req: Request, res: Response) => {
   const {marketId, amount, type, shares, price, txHash} = req.body;
   
   try {
        // Fraud detection check
        const fraudResult = fraudDetector.recordTrade({
            userId: req.userId!,
            marketId,
            tradeType: type.toUpperCase() as 'BUY' | 'SELL',
            amount: parseFloat(amount),
            price: parseFloat(price),
            timestamp: Date.now(),
            txHash,
        });

        if (fraudResult.recommendation === 'BLOCK') {
            console.warn(`🚨 [FRAUD BLOCKED] User ${req.userId} on market ${marketId}`);
            console.warn(`   Indicators: ${fraudResult.indicators.map(i => i.type).join(', ')}`);
            
            // Save blocked fraud attempt to database
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
            console.warn(`⚠️ [FRAUD FLAGGED] User ${req.userId} on market ${marketId}`);
            console.warn(`   Risk score: ${fraudResult.overallRiskScore.toFixed(3)}`);
            console.warn(`   Indicators: ${fraudResult.indicators.map(i => `${i.type}(${i.severity})`).join(', ')}`);
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

        // Save fraud detection result for this trade
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
            where: {marketId}});
            if (market){
                broadcastPrice(marketId,  {
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
                }
            });
   }catch(e){
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

// ============================================
// FRAUD DETECTION ANALYTICS ENDPOINTS
// ============================================

app.get('/api/fraud/alerts', authMiddleware, async (req: Request, res: Response) => {
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

app.get('/api/fraud/user/:userId', authMiddleware, async (req: Request, res: Response) => {
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

app.get('/api/fraud/market/:marketId', async (req: Request, res: Response) => {
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

// ============================================
// ANOMALY DETECTION ANALYTICS ENDPOINTS
// ============================================

app.get('/api/anomaly/alerts', async (req: Request, res: Response) => {
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

app.get('/api/anomaly/market/:marketId', async (req: Request, res: Response) => {
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

app.get('/api/markets/:id/trades', authMiddleware, async (req: Request, res: Response) => {
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

app.get('/api/users/:address/trades', authMiddleware, async(req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const user = await prismaClient.user.findUnique({
            where: {walletAddress: req.params.address},
            include: {trades: true},
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const trades = await prismaClient.trade.findMany({
            where: {userId: user.id},
            include: {market: true},
            orderBy: {createdAt: 'desc'}
        });
        res.json({ trades: trades.map(t => ({ ...t, amount: t.amount.toString(), shares: t.shares.toString(), price: t.price.toString() })) });
    }catch(e){
        res.json({ trades: [] });
    }
});

app.get('/api/markets/:id/stats', authMiddleware, async(req: Request, res: Response) => {
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        const [stats, uniqueTrades] = await Promise.all([
            prismaClient.trade.aggregate({
                where:{marketId: req.params.id},
                _sum:{amount: true},
                _count: true
            }),
            prismaClient.trade.groupBy({
                where:{marketId: req.params.id},
                by: ['userId']
            }),
        ]);
        res.json({
            totalVolume: stats._sum.amount?.toString() || "0",
            uniqueTraders: uniqueTrades.length,
            totalTrades: stats._count
        });
    }catch(e){
        res.json({ totalVolume: "0", uniqueTraders: 0, totalTrades: 0 });
    }
});

app.get('/api/markets/:id/chart', async (req: Request, res: Response) => {
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

app.get('/api/leaderboard', async (req: Request, res: Response) => {
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

server.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`WebSocket running on ws://localhost:${PORT}/ws`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Markets API: http://localhost:${PORT}/api/markets`);
});