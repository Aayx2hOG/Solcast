import { startScheduler } from "./scheduler/index";
import { startInputListener } from "./inputEntity";
import { startMarketSync } from "./marketStore";

console.log("Oracle Service Booting...");

// Start auto-syncing markets from database
startMarketSync(60000); // Refresh every 60 seconds

startScheduler();

startInputListener();
