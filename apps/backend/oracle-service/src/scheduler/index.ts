import cron from "node-cron";
import { ACTIVE_MARKETS } from "../marketStore";
import { triggerResolution } from "./resolutionTrigger";

export function startScheduler() {
  console.log("[SCHEDULER] Started on Node", process.version);

  cron.schedule("*/10 * * * * *", async () => {
    for (const market of ACTIVE_MARKETS) {
      if (!market.active) continue;
      await triggerResolution(market);
    }
  });
}
