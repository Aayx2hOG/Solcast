import { Market } from "./models/Market";
import { MarketType } from "./resolution/fetcherRegistry";

export const ACTIVE_MARKETS: Market[] = [];

// Try to load prisma client
let prismaClient: any = null;
try {
  const dbModule = require('db');
  prismaClient = dbModule.prismaClient;
} catch (e) {
  console.log('[marketStore] Database not available');
}

// Map database category to oracle market type
function categoryToMarketType(category: string): MarketType | null {
  const mapping: Record<string, MarketType> = {
    'Crypto': 'CRYPTO',
    'crypto': 'CRYPTO',
    'CRYPTO': 'CRYPTO',
    'Weather': 'WEATHER',
    'weather': 'WEATHER',
    'WEATHER': 'WEATHER',
    'Sports': 'SPORTS',
    'sports': 'SPORTS',
    'SPORTS': 'SPORTS',
    'Politics': 'ELECTION',
    'politics': 'ELECTION',
    'Election': 'ELECTION',
    'election': 'ELECTION',
    'ELECTION': 'ELECTION',
  };
  return mapping[category] || null;
}

// Load markets from database
export async function loadMarketsFromDB(): Promise<void> {
  if (!prismaClient) {
    console.log('[marketStore] No database connection - using manual input only');
    return;
  }

  try {
    const dbMarkets = await prismaClient.market.findMany({
      where: {
        status: 'Active',
        endTimestamp: {
          gt: new Date(),
        },
      },
    });

    console.log(`[marketStore] Found ${dbMarkets.length} active markets in DB`);

    for (const dbMarket of dbMarkets) {
      const marketType = categoryToMarketType(dbMarket.category);
      
      if (!marketType) {
        console.log(`[marketStore] Skipping market ${dbMarket.id} - unknown category: ${dbMarket.category}`);
        continue;
      }

      // Check if already in ACTIVE_MARKETS
      const exists = ACTIVE_MARKETS.some(m => m.id === String(dbMarket.id));
      if (exists) continue;

      const market: Market = {
        id: dbMarket.oracleSource || String(dbMarket.id),
        type: marketType,
        active: true,
        dbId: dbMarket.id,
      };

      ACTIVE_MARKETS.push(market);
      console.log(`[marketStore] Loaded market: ${market.type} ${market.id}`);
    }
  } catch (error) {
    console.error('[marketStore] Error loading markets from DB:', error);
  }
}

// Refresh markets periodically
export function startMarketSync(intervalMs: number = 60000): void {
  // Initial load
  loadMarketsFromDB();
  
  // Periodic refresh
  setInterval(loadMarketsFromDB, intervalMs);
}