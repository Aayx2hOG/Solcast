import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

const marketSubs: Map<string, Set<WebSocket>> = new Map();
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
            } catch (e) {
                console.log(e);
            }
        });
        ws.on('close', () => {
            marketSubs.forEach((set) => {
                set.delete(ws);
            });
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

export function getWebSocketServer() {
    return wss;
}
