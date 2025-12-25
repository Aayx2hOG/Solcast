import { PublicKey } from "@solana/web3.js";

export enum MarketCategory {
  Sports = "Sports",
  Politics = "Politics",
  Crypto = "Crypto",
  Economics = "Economics",
  Entertainment = "Entertainment",
  Science = "Science",
  Other = "Other",
}

export enum MarketStatus {
  Active = "Active",
  Resolved = "Resolved",
  Invalid = "Invalid",
}

export enum Outcome {
  Yes = "Yes",
  No = "No",
}

export interface Market {
  publicKey: PublicKey;
  marketId: number;
  authority: PublicKey;
  question: string;
  description: string;
  category: MarketCategory;
  createdAt: Date;
  endTimestamp: Date;
  resolutionTimestamp: Date;
  oracleSource: string;
  status: MarketStatus;
  yesLiquidity: number;
  noLiquidity: number;
  totalYesShares: number;
  totalNoShares: number;
  totalVolume: number;
  winningOutcome?: Outcome;
  yesPrice: number;
  noPrice: number;
  volume24h?: number;
  priceChange24h?: number;
}

export interface UserPosition {
  publicKey: PublicKey;
  user: PublicKey;
  market: PublicKey;
  yesShares: number;
  noShares: number;
  totalInvested: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
}

export interface Trade {
  signature: string;
  market: PublicKey;
  user: PublicKey;
  outcome: Outcome;
  shares: number;
  price: number;
  cost: number;
  timestamp: Date;
  type: "buy" | "sell";
}

export interface PricePoint {
  timestamp: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
}

export interface LeaderboardEntry {
  user: PublicKey;
  username?: string;
  totalPnl: number;
  totalVolume: number;
  winRate: number;
  activePositions: number;
  rank: number;
}

export interface Notification {
  id: string;
  type: "trade" | "resolution" | "price_alert" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface MarketFilters {
  category?: MarketCategory;
  status?: MarketStatus;
  search?: string;
  sortBy?: "volume" | "newest" | "ending_soon" | "popular";
  minLiquidity?: number;
}

export interface ChartData {
  prices: PricePoint[];
  volume: { timestamp: number; volume: number }[];
  trades: Trade[];
}
