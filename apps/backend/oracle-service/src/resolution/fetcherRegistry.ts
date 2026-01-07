import { Fetcher } from "../fetchers/Fetcher";
import { CoinGeckoFetcher } from "../fetchers/CoinGeckoFetcher";
import { BinanceFetcher } from "../fetchers/BinanceFetcher";
import { OpenWeatherFetcher } from "../fetchers/OpenWeatherFetcher";
import { ESPNFetcher } from "../fetchers/ESPNFetcher";
import { TheOddsAPIFetcher } from "../fetchers/TheOddsAPIFetcher";
import { DecisionDeskFetcher } from "../fetchers/DecisionDeskFetcher";

export type MarketType = "CRYPTO" | "WEATHER" | "SPORTS" | "ELECTION";

export const FETCHERS: Record<MarketType, Fetcher[]> = {
  CRYPTO: [
    new CoinGeckoFetcher(),
    new BinanceFetcher(),
  ],
  WEATHER: [
    new OpenWeatherFetcher(),
  ],
  SPORTS: [
    new ESPNFetcher(),
  ],
  ELECTION: [
    new DecisionDeskFetcher(),
  ],
};
