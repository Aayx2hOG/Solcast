import dotenv from "dotenv";
dotenv.config();

function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

export const ENV = {
  OPENWEATHER_API_KEY: need("OPENWEATHER_API_KEY"),
  THE_ODDS_API_KEY: need("THE_ODDS_API_KEY"),
};
