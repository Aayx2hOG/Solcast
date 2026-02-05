import { Market } from "../models/Market";
import { resolveMarket } from "../resolution/resolveMarket";
import { ENV } from "../config/env";

const BACKEND_URL = ENV.BACKEND_URL || "http://localhost:3001";

async function broadcastResolution(marketId: string, decision: any) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/oracle/resolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        marketId,
        status: decision.status,
        value: decision.value,
        confidence: decision.confidence,
      }),
    });
    if (!response.ok) {
      console.error('[BROADCAST] Failed to send resolution:', response.status);
    }
  } catch (err: any) {
    console.error('[BROADCAST] Error sending resolution:', err.message);
  }
}

export async function triggerResolution(market: Market) {
  const decision = await resolveMarket(
    market.id,
    market.type
  );

  console.log(
    `[RESOLUTION] ${market.id}`,
    decision
  );

  if (decision.status === "RETRY") {
    return;
  }

  if (decision.status === "RESOLVED") {
    // Broadcast to backend WebSocket
    await broadcastResolution(market.id, decision);
  }
}
