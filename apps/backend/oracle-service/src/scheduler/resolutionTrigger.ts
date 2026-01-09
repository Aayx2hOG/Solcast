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
    return;
  }

  if (decision.status === "RESOLVED") {
  }
}
