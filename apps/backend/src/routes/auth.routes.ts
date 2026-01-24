import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prismaClient } from 'db/client';
import { config, dbAvailable, setDbAvailable } from '../utils/config';
import { mockUsers } from '../utils/mockData';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
    }
    
    try {
        if (!dbAvailable) throw new Error("DB unavailable");
        let user = await prismaClient.user.findUnique({
            where: { walletAddress }
        });
        if (!user) {
            user = await prismaClient.user.create({
                data: { walletAddress }
            });
        }
        const token = jwt.sign({ userId: user.id }, config.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (error) {
        console.log("Database unavailable, using mock auth");
        setDbAvailable(false);
        if (!mockUsers[walletAddress]) {
            mockUsers[walletAddress] = { id: walletAddress, walletAddress };
        }
        const token = jwt.sign({ userId: walletAddress }, config.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: mockUsers[walletAddress] });
    }
});
