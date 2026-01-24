import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prismaClient } from 'db/client';
import { config, dbAvailable, setDbAvailable } from '../utils/config';
import { mockUsers } from '../utils/mockData';
import { LoginSchema, validateRequest } from '../utils/validation';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response) => {
    const validation = validateRequest(LoginSchema, req.body);
    
    if (!validation.success) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors.map(e => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }

    const { walletAddress } = validation.data;
    
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
