import { BinanceFetcher } from "./BinanceFetcher";

async function main() {
  const fetcher = new BinanceFetcher();

  try {
    const data = await fetcher.fetch("ETH-USDT");

    console.log("Oracle speaks:");
    console.log(data);
  } catch (err) {
    console.error("The market refused to answer:", err);
  }
}

main();