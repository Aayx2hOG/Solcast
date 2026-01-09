import readline from "readline";
import { Market } from "./models/Market";
import { MarketType } from "./resolution/fetcherRegistry";
import { ACTIVE_MARKETS } from "./marketStore";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function isValidMarketType(type: string): type is MarketType {
  return ["CRYPTO", "WEATHER", "SPORTS", "ELECTION"].includes(type);
}

export function startInputListener() {
  console.log(
    "Enter input: CRYPTO BTC-USDT | WEATHER Delhi | SPORTS IPL_FINAL"
  );

  rl.on("line", (line) => {
    const [typeRaw, ...idParts] = line.trim().split(/\s+/);

    if (!typeRaw || idParts.length === 0) {
      console.log("Invalid format");
      return;
    }

    const type = typeRaw.toUpperCase();

    if (!isValidMarketType(type)) {
      console.log("Invalid market type:", type);
      return;
    }

    const id = idParts.join(" ").toUpperCase();

    const market: Market = {
      id,
      type,
      active: true,
    };

    ACTIVE_MARKETS.push(market);

    console.log("Market registered:", market);
  });
}
