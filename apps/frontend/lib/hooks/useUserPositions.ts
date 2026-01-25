"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { api } from "@/lib/services/api";
import { UserPosition, Market } from "@/lib/types";
import { PROGRAM_ID } from "@/lib/constants";

interface UseUserPositionsOptions {
  refreshInterval?: number; // in milliseconds, 0 to disable auto-refresh
  includeClosedPositions?: boolean;
}

interface UseUserPositionsReturn {
  positions: UserPosition[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getPositionByMarket: (marketId: number) => UserPosition | undefined;
  totalInvested: number;
  totalValue: number;
  totalPnl: number;
  pnlPercentage: number;
}

export function useUserPositions(
  markets: Market[] = [],
  options: UseUserPositionsOptions = {}
): UseUserPositionsReturn {
  const { refreshInterval = 30000, includeClosedPositions = false } = options;
  const { publicKey, connected } = useWallet();

  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!connected || !publicKey) {
      setPositions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getPositions();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data?.positions) {
        const formattedPositions: UserPosition[] = result.data.positions
          .filter((p: any) => {
            // Filter out closed positions if not requested
            if (!includeClosedPositions) {
              return p.yesShares > 0 || p.noShares > 0;
            }
            return true;
          })
          .map((p: any) => {
            // Find the corresponding market for price calculations
            const market = markets.find(
              (m) => m.marketId === parseInt(p.marketId)
            );

            const yesShares = p.yesShares || 0;
            const noShares = p.noShares || 0;
            const totalInvested = p.totalInvested || 0;

            // Calculate current value based on market prices
            const currentValue = market
              ? yesShares * market.yesPrice + noShares * market.noPrice
              : p.currentValue || 0;

            const pnl = currentValue - totalInvested;
            const pnlPercentage =
              totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

            return {
              publicKey: new PublicKey(p.id || PROGRAM_ID),
              user: publicKey,
              market: new PublicKey(p.marketId || PROGRAM_ID),
              yesShares,
              noShares,
              totalInvested,
              currentValue,
              pnl,
              pnlPercentage,
            };
          });

        setPositions(formattedPositions);
      }
    } catch (err: any) {
      console.error("Error fetching positions:", err);
      setError(err.message || "Failed to fetch positions");
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, markets, includeClosedPositions]);

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchPositions();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchPositions, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPositions, refreshInterval]);

  // Helper to get position for a specific market
  const getPositionByMarket = useCallback(
    (marketId: number): UserPosition | undefined => {
      return positions.find((p) => {
        const market = markets.find((m) => m.publicKey.equals(p.market));
        return market?.marketId === marketId;
      });
    },
    [positions, markets]
  );

  // Portfolio statistics
  const totalInvested = positions.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalPnl = totalValue - totalInvested;
  const pnlPercentage = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return {
    positions,
    isLoading,
    error,
    refresh: fetchPositions,
    getPositionByMarket,
    totalInvested,
    totalValue,
    totalPnl,
    pnlPercentage,
  };
}

// Hook for getting a single position
export function usePosition(marketId: number, markets: Market[] = []) {
  const { positions, isLoading, error, refresh } = useUserPositions(markets);

  const position = positions.find((p) => {
    const market = markets.find((m) => m.publicKey.equals(p.market));
    return market?.marketId === marketId;
  });

  const hasPosition = position
    ? position.yesShares > 0 || position.noShares > 0
    : false;

  return {
    position,
    hasPosition,
    isLoading,
    error,
    refresh,
  };
}

// Hook for claimable positions (markets that are resolved)
export function useClaimablePositions(markets: Market[] = []) {
  const { positions, isLoading, error, refresh } = useUserPositions(markets);

  const claimablePositions = positions.filter((position) => {
    const market = markets.find((m) => m.publicKey.equals(position.market));
    if (!market || market.status !== "Resolved") return false;

    // Check if user has shares in the winning outcome
    const hasWinningShares =
      (market.winningOutcome === "Yes" && position.yesShares > 0) ||
      (market.winningOutcome === "No" && position.noShares > 0);

    return hasWinningShares;
  });

  const totalClaimable = claimablePositions.reduce((sum, position) => {
    const market = markets.find((m) => m.publicKey.equals(position.market));
    if (!market) return sum;

    const winningShares =
      market.winningOutcome === "Yes"
        ? position.yesShares
        : position.noShares;

    return sum + winningShares; // Each winning share pays out $1
  }, 0);

  return {
    claimablePositions,
    totalClaimable,
    isLoading,
    error,
    refresh,
  };
}
