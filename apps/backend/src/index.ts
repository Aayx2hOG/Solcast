import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { prismaClient } from 'db/client';
import { config, dbAvailable } from './utils/config';
import { setupWebSocket } from './utils/websocket';
import {
    authRouter,
    marketsRouter,
    tradesRouter,
    usersRouter,
    fraudRouter,
    analyticsRouter,
} from './routes';

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());

setupWebSocket(server);

app.use('/api/auth', authRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/trades', tradesRouter);
app.use('/api', usersRouter);
app.use('/api/fraud', fraudRouter);
app.use('/api/analytics', analyticsRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', dbAvailable, timestamp: Date.now().toString() });
});

process.on('SIGINT', async () => {
    await prismaClient.$disconnect();
    process.exit(0);
});

server.listen(config.PORT, () => {
    console.log(`Backend server running on http://localhost:${config.PORT}`);
    console.log(`WebSocket running on ws://localhost:${config.PORT}/ws`);
    console.log(`Health check: http://localhost:${config.PORT}/health`);
    console.log(`Markets API: http://localhost:${config.PORT}/api/markets`);
});