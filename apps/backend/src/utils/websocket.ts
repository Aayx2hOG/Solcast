import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

const marketSubs: Map<string, Set<WebSocket>> = new Map();
const oracleSubs: Set<WebSocket> = new Set();
let wss: WebSocketServer;

export function setupWebSocket(server: Server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws) => {
        ws.on('message', async (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.action === 'subscribe' && msg.marketId) {
                    if (!marketSubs.has(msg.marketId)) {
                        marketSubs.set(msg.marketId, new Set());
                    }
                    marketSubs.get(msg.marketId)!.add(ws);
                    ws.send(JSON.stringify({ type: "subscribed", marketId: msg.marketId }));
                }
                if (msg.action === 'unsubscribe' && msg.marketId) {
                    if (marketSubs.has(msg.marketId) && marketSubs.get(msg.marketId)!.has(ws)) {
                        marketSubs.get(msg.marketId)!.delete(ws);
                    }
                    ws.send(JSON.stringify({ type: "unsubscribed", marketId: msg.marketId }));
                }
                // Oracle feed subscription
                if (msg.action === 'subscribe_oracle') {
                    oracleSubs.add(ws);
                    ws.send(JSON.stringify({ type: "subscribed_oracle" }));
                }
                if (msg.action === 'unsubscribe_oracle') {
                    oracleSubs.delete(ws);
                    ws.send(JSON.stringify({ type: "unsubscribed_oracle" }));
                }
            } catch (e) {
                console.log(e);
            }
        });
        ws.on('close', () => {
            marketSubs.forEach((set) => {
                set.delete(ws);
            });
            oracleSubs.delete(ws);
        });
    });

    return wss;
}

export function broadcastPrice(marketId: string, data: { yesPrice: number, noPrice: number, volume: number }) {
    const subs = marketSubs.get(marketId);
    if (!subs) return;
    const payload = JSON.stringify({ type: 'MARKET_PRICE', marketId, ...data, ts: Date.now() });
    subs.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(payload));
}

export interface OracleResolution {
    marketId: string;
    status: string;
    value: number | string;
    confidence: number;
    sources?: { source: string; value: number; anomalyScore?: number }[];
}

// Store oracle history for new subscribers
const oracleHistory: Map<string, OracleResolution[]> = new Map();
const MAX_HISTORY_PER_MARKET = 100;

export function broadcastOracleResolution(resolution: OracleResolution) {
    const ts = Date.now();
    
    // Store in history with timestamp
    if (!oracleHistory.has(resolution.marketId)) {
        oracleHistory.set(resolution.marketId, []);
    }
    const history = oracleHistory.get(resolution.marketId)!;
    history.push({ ...resolution, ts } as any);
    if (history.length > MAX_HISTORY_PER_MARKET) {
        history.shift();
    }

    const payload = JSON.stringify({ 
        type: 'ORACLE_RESOLUTION', 
        ...resolution,
        ts 
    });
    oracleSubs.forEach((ws) => ws.readyState === WebSocket.OPEN && ws.send(payload));
}

export function getOracleHistory(marketId?: string): OracleResolution[] {
    if (marketId) {
        return oracleHistory.get(marketId) || [];
    }
    // Return all history flattened
    const all: OracleResolution[] = [];
    oracleHistory.forEach((history) => all.push(...history));
    return all.sort((a, b) => (a as any).ts - (b as any).ts);
}

export function getWebSocketServer() {
    return wss;
}
