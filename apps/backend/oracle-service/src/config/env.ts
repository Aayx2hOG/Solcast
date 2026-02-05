import dotenv from "dotenv";
dotenv.config();

function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function optional(key: string, defaultValue: string = ""): string {
  return process.env[key] || defaultValue;
}

export const ENV = {
  DATABASE_URL: need("DATABASE_URL"),
  OPENWEATHER_API_KEY: optional("OPENWEATHER_API_KEY"),
  THE_ODDS_API_KEY: optional("THE_ODDS_API_KEY"),
  BACKEND_URL: optional("BACKEND_URL", "http://localhost:3001"),
};
