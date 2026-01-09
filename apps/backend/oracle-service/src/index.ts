import { startScheduler } from "./scheduler/index";
import { startInputListener } from "./inputEntity";

console.log("Oracle Service Booting...");

startScheduler();

startInputListener();
