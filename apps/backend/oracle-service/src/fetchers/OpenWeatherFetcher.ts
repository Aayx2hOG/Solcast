import axios from "axios";
import { Fetcher } from "./Fetcher";
import { OracleData } from ".././models/OracleData";
import { ENV } from ".././config/env";
export class OpenWeatherFetcher implements Fetcher {
  async fetch(marketId: string): Promise<OracleData> {
    const [city] = marketId.split("-");

    const res = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: city,
          units: "metric",
          appid: ENV.OPENWEATHER_API_KEY,
        },
      }
    );

    const value = res.data?.main?.temp;
    if (value === undefined) {
      throw new Error("OpenWeather: invalid response");
    }

    return {
      marketId,
      value,
      source: "OpenWeather",
      confidence: 0.95,
      timestamp: Date.now(),
      healthy: true,
    };
  }
}
