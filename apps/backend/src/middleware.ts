import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "./utils/config";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: "No authorization header" });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
        req.userId = decoded.userId as string;
        next();
    } catch (e) {
        console.error('JWT verification error:', e);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
