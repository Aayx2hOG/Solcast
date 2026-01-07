import { Market } from "../models/Market";
import { resolveMarket } from "../resolution/resolveMarket";

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
    // Not enough APIs responded
    // NEXT STEP:
    // schedule refetch / backoff / retry
    return;
  }

  if (decision.status === "RESOLVED") {
    // APIs are alive
    // NEXT STEP:
    // proceed to price consensus
    // then write final result to Solana
  }
}
