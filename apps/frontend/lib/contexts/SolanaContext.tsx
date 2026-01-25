"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Market, UserPosition, Trade } from "../types";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "../constants";
import { api } from "../services/api";

interface SolanaContextType {
  program: Program | null;
  markets: Market[];
  userPositions: UserPosition[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshMarkets: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  buyShares: (marketId: number, outcome: "Yes" | "No", amount: number) => Promise<string>;
  sellShares: (marketId: number, outcome: "Yes" | "No", shares: number) => Promise<string>;
  createMarket: (marketData: any) => Promise<string>;
  claimWinnings: (marketId: number) => Promise<string>;
  login: () => Promise<void>;
}

const SolanaContext = createContext<SolanaContextType | undefined>(undefined);

export const SolanaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { publicKey, connected } = useWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (anchorWallet && connection) {
      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
      });
    }
  }, [anchorWallet, connection]);

  const login = useCallback(async () => {
    if (!publicKey) return;
    try {
      api.clearToken();
      const result = await api.login(publicKey.toBase58());
      if (result.data) {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && !isAuthenticated) {
      login();
    }
    if (!connected && isAuthenticated) {
      api.clearToken();
      setIsAuthenticated(false);
    }
  }, [connected, isAuthenticated, login]);

  const refreshMarkets = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiResult = await api.getMarkets();
      if (apiResult.data?.markets && apiResult.data.markets.length > 0) {
        const formattedMarkets: Market[] = apiResult.data.markets.map((m: any) => {
          let pubKey: PublicKey;
          try {
            pubKey = m.publicKey ? new PublicKey(m.publicKey) : new PublicKey(PROGRAM_ID);
          } catch {
            pubKey = new PublicKey(PROGRAM_ID);
          }
          
          let authorityKey: PublicKey;
          try {
            authorityKey = m.creator?.walletAddress ? new PublicKey(m.creator.walletAddress) : new PublicKey(PROGRAM_ID);
          } catch {
            authorityKey = new PublicKey(PROGRAM_ID);
          }

          return {
            publicKey: pubKey,
            marketId: parseInt(m.marketId) || m.id || 0,
            authority: authorityKey,
            question: m.question,
            description: m.description,
            category: m.category,
            createdAt: new Date(m.createdAt),
            endTimestamp: new Date(m.endTimestamp),
            resolutionTimestamp: new Date(m.resolutionTimestamp),
            oracleSource: m.oracleSource || "",
            status: m.status || "Active",
            yesLiquidity: m.yesLiquidity || 0,
            noLiquidity: m.noLiquidity || 0,
            totalYesShares: m.totalYesShares || 0,
            totalNoShares: m.totalNoShares || 0,
            totalVolume: m.totalVolume || 0,
            winningOutcome: m.winningOutcome,
            yesPrice: m.yesPrice || 0.5,
            noPrice: m.noPrice || 0.5,
          };
        });
        setMarkets(formattedMarkets);
        setError(null);
        return;
      }

      if (program) {
        const marketAccounts = await (program.account as any).market.all();
        const formattedMarkets: Market[] = marketAccounts.map((account: any) => {
          const data = account.account;
          const totalLiquidity = data.yesLiquidity + data.noLiquidity;
          return {
            publicKey: account.publicKey,
            marketId: data.marketId.toNumber(),
            authority: data.authority,
            question: data.question,
            description: data.description,
            category: data.category,
            createdAt: new Date(data.createdAt.toNumber() * 1000),
            endTimestamp: new Date(data.endTimestamp.toNumber() * 1000),
            resolutionTimestamp: new Date(data.resolutionTimestamp.toNumber() * 1000),
            oracleSource: data.oracleSource,
            status: data.status,
            yesLiquidity: data.yesLiquidity.toNumber(),
            noLiquidity: data.noLiquidity.toNumber(),
            totalYesShares: data.totalYesShares.toNumber(),
            totalNoShares: data.totalNoShares.toNumber(),
            totalVolume: data.totalVolume.toNumber(),
            winningOutcome: data.winningOutcome,
            yesPrice: totalLiquidity > 0 ? data.yesLiquidity / totalLiquidity : 0.5,
            noPrice: totalLiquidity > 0 ? data.noLiquidity / totalLiquidity : 0.5,
          };
        });
        setMarkets(formattedMarkets);
      }
      setError(null);
    } catch (err: any) {
      console.error("Error fetching markets:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [program]);

  const refreshPositions = useCallback(async () => {
    if (!publicKey) return;
    setIsLoading(true);
    try {
      const apiResult = await api.getPositions();
      if (apiResult.data?.positions) {
        const formattedPositions: UserPosition[] = apiResult.data.positions.map((p: any) => ({
          publicKey: new PublicKey(p.id || PROGRAM_ID),
          user: publicKey,
          market: new PublicKey(p.marketId || PROGRAM_ID),
          yesShares: p.yesShares || 0,
          noShares: p.noShares || 0,
          totalInvested: p.totalInvested || 0,
          currentValue: p.currentValue || 0,
          pnl: p.pnl || 0,
          pnlPercentage: p.pnlPercentage || 0,
        }));
        setUserPositions(formattedPositions);
        setError(null);
        return;
      }

      if (program && anchorWallet) {
        const positionAccounts = await (program.account as any).userPosition.all([
          {
            memcmp: {
              offset: 8,
              bytes: publicKey.toBase58(),
            },
          },
        ]);
        
        const formattedPositions: UserPosition[] = positionAccounts.map((account: any) => {
          const data = account.account;
          const market = markets.find((m) => m.publicKey.equals(data.market));
          const currentValue = market
            ? data.yesShares.toNumber() * market.yesPrice +
              data.noShares.toNumber() * market.noPrice
            : 0;
          const totalInvested = data.totalInvested.toNumber();
          const pnl = currentValue - totalInvested;
          
          return {
            publicKey: account.publicKey,
            user: data.user,
            market: data.market,
            yesShares: data.yesShares.toNumber(),
            noShares: data.noShares.toNumber(),
            totalInvested,
            currentValue,
            pnl,
            pnlPercentage: totalInvested > 0 ? (pnl / totalInvested) * 100 : 0,
          };
        });
        
        setUserPositions(formattedPositions);
      }
      setError(null);
    } catch (err: any) {
      console.error("Error fetching positions:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey, anchorWallet, markets]);

  const buyShares = async (marketId: number, outcome: "Yes" | "No", amount: number): Promise<string> => {
    if (!program || !anchorWallet) throw new Error("Wallet not connected");
    
    try {
      const tx = await program.methods
        .buyShares({ [outcome.toLowerCase()]: {} }, amount)
        .accounts({})
        .rpc();
      
      await refreshMarkets();
      await refreshPositions();
      return tx;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const sellShares = async (marketId: number, outcome: "Yes" | "No", shares: number): Promise<string> => {
    if (!program || !anchorWallet) throw new Error("Wallet not connected");
    
    try {
      const tx = await program.methods
        .sellShares({ [outcome.toLowerCase()]: {} }, shares, 0)
        .accounts({})
        .rpc();
      
      await refreshMarkets();
      await refreshPositions();
      return tx;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const createMarket = useCallback(async (marketData: any): Promise<string> => {
    if (!connected || !publicKey) {
      throw new Error("Wallet not connected");
    }
    
    try {
      const result = await api.createMarket({
        marketId: marketData.marketId?.toString() || `market-${Date.now()}`,
        question: marketData.question,
        description: marketData.description,
        category: marketData.category,
        endTimestamp: marketData.endTimestamp,
        resolutionTimestamp: marketData.resolutionTimestamp,
        oracleSource: marketData.oracleSource,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      await refreshMarkets();
      return result.data?.market?.id || 'created';
    } catch (err: any) {
      throw new Error(err.message);
    }
  }, [connected, publicKey, refreshMarkets]);

  const claimWinnings = async (marketId: number): Promise<string> => {
    if (!program || !anchorWallet) throw new Error("Wallet not connected");
    
    try {
      const tx = await program.methods
        .claimWinnings()
        .accounts({})
        .rpc();
      
      await refreshPositions();
      return tx;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    refreshMarkets();
  }, [refreshMarkets]);

  useEffect(() => {
    if (connected && isAuthenticated) {
      refreshPositions();
    }
  }, [connected, isAuthenticated, refreshPositions]);

  return (
    <SolanaContext.Provider
      value={{
        program,
        markets,
        userPositions,
        isLoading,
        error,
        isAuthenticated,
        refreshMarkets,
        refreshPositions,
        buyShares,
        sellShares,
        createMarket,
        claimWinnings,
        login,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
};

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error("useSolana must be used within SolanaProvider");
  }
  return context;
};
