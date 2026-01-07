import { MarketType } from "../resolution/fetcherRegistry";

export interface Market {
  id: string;
  type: MarketType;
  active: boolean;
}