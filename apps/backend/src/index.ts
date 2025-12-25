import express from 'express';
import cors from "cors";
import type { Request, Response } from "express";
import { authMiddleware } from './middleware';
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

app.use(cors());
app.use(express.json());

app.post('api/auth/login', (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: "userId is required" });
    }
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
})

app.get('/api/markets', (req: Request, res: Response) => {
    res.json({ markets: [] })
});

app.get('/api/markets/:id', (req: Request, res: Response) => {
    res.json({ id: req.params.id, question: 'Sample Market', status: 'active' });
});

app.get('/api/accounts/:address', (req: Request, res: Response) => {
    res.json({ address: req.params.address, balance: 0 });
});

app.post('/api/markets', authMiddleware, (req: Request, res: Response) => {
    const { question, description } = req.body;
    res.json({ id: 'new-market-id', question, description, createdBy: req.userId });
});

app.get('/api/secure/profile', authMiddleware, (req: Request, res: Response) => {
    res.json({ userId: req.userId, roles: ['user'] });
});

app.post('/api/secure/orders', authMiddleware, (req: Request, res: Response) => {
    res.json({ userId: req.userId, status: 'order accepted' })
});

app.post('/api/secure/positions', authMiddleware, (req: Request, res: Response) => {
    res.json({ userId: req.userId, positions: [] });
})

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now().toString() });
});

app.listen(PORT);