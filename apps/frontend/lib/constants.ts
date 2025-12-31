export const PROGRAM_ID = "32RHEHXbReKvWE2bNxcH9486qLSNnH4nYMtWHe5axizE";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // Mainnet USDC

export const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
export const RPC_ENDPOINT = 
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:8899";

export const WEBSOCKET_ENDPOINT = 
  process.env.NEXT_PUBLIC_WS_ENDPOINT || "ws://localhost:8900";

export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const CATEGORIES = [
  "Sports",
  "Politics",
  "Crypto",
  "Economics",
  "Entertainment",
  "Science",
  "Other",
] as const;

export const MARKET_STATUSES = ["Active", "Resolved", "Invalid"] as const;

export const SORT_OPTIONS = [
  { value: "volume", label: "Highest Volume" },
  { value: "newest", label: "Newest" },
  { value: "ending_soon", label: "Ending Soon" },
  { value: "popular", label: "Most Popular" },
] as const;

export const CHART_TIMEFRAMES = [
  { value: "1H", label: "1 Hour", minutes: 60 },
  { value: "24H", label: "24 Hours", minutes: 1440 },
  { value: "7D", label: "7 Days", minutes: 10080 },
  { value: "30D", label: "30 Days", minutes: 43200 },
  { value: "ALL", label: "All Time", minutes: -1 },
] as const;

export const PRICE_DECIMALS = 2;
export const VOLUME_DECIMALS = 2;
export const SHARE_DECIMALS = 6;

export const TRANSACTION_TIMEOUT = 60000; // 60 seconds
export const POLLING_INTERVAL = 5000; // 5 seconds
