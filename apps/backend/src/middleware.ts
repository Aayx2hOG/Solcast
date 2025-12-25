import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: "No authorization header" });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        console.log('Decoded JWT:', decoded);
        req.userId = decoded.userId as string;
        next();
    } catch (e) {
        console.error('JWT verification error:', e);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
