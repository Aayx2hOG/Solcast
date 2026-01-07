import { startScheduler } from "./scheduler/index";
import { startInputListener } from "./inputEntity";

console.log("🧠 Oracle Service Booting...");

// start background resolution loop
startScheduler();

// start CLI input listener
startInputListener();
