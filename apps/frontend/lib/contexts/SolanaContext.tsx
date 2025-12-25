"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Market, UserPosition, Trade } from "../types";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "../constants";

interface SolanaContextType {
  program: Program | null;
  markets: Market[];
  userPositions: UserPosition[];
  isLoading: boolean;
  error: string | null;
  refreshMarkets: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  buyShares: (marketId: number, outcome: "Yes" | "No", amount: number) => Promise<string>;
  sellShares: (marketId: number, outcome: "Yes" | "No", shares: number) => Promise<string>;
  createMarket: (marketData: any) => Promise<string>;
  claimWinnings: (marketId: number) => Promise<string>;
}

const SolanaContext = createContext<SolanaContextType | undefined>(undefined);

export const SolanaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet && connection) {
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
      });
      // Note: You'll need to import the IDL here
      // const program = new Program(IDL, PROGRAM_ID, provider);
      // setProgram(program);
    }
  }, [wallet, connection]);

  const refreshMarkets = async () => {
    if (!program) return;
    setIsLoading(true);
    try {
      // Fetch all market accounts
      const marketAccounts = await program.account.market.all();
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
      setError(null);
    } catch (err: any) {
      console.error("Error fetching markets:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPositions = async () => {
    if (!program || !wallet) return;
    setIsLoading(true);
    try {
      const positionAccounts = await program.account.userPosition.all([
        {
          memcmp: {
            offset: 8,
            bytes: wallet.publicKey.toBase58(),
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
      setError(null);
    } catch (err: any) {
      console.error("Error fetching positions:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const buyShares = async (marketId: number, outcome: "Yes" | "No", amount: number): Promise<string> => {
    if (!program || !wallet) throw new Error("Wallet not connected");
    
    try {
      const tx = await program.methods
        .buyShares({ [outcome.toLowerCase()]: {} }, amount)
        .accounts({
          // Add required accounts here
        })
        .rpc();
      
      await refreshMarkets();
      await refreshPositions();
      return tx;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const sellShares = async (marketId: number, outcome: "Yes" | "No", shares: number): Promise<string> => {
    if (!program || !wallet) throw new Error("Wallet not connected");
    
    try {
      const tx = await program.methods
        .sellShares({ [outcome.toLowerCase()]: {} }, shares, 0)
        .accounts({
          // Add required accounts here
        })
        .rpc();
      
      await refreshMarkets();
      await refreshPositions();
      return tx;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const createMarket = async (marketData: any): Promise<string> => {
    if (!program || !wallet) throw new Error("Wallet not connected");
    
    try {
      const tx = await program.methods
        .createMarket(
          marketData.marketId,
          marketData.question,
          marketData.description,
          marketData.category,
          marketData.endTimestamp,
          marketData.resolutionTimestamp,
          marketData.oracleSource,
          marketData.initialLiquidity
        )
        .accounts({
          // Add required accounts here
        })
        .rpc();
      
      await refreshMarkets();
      return tx;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const claimWinnings = async (marketId: number): Promise<string> => {
    if (!program || !wallet) throw new Error("Wallet not connected");
    
    try {
      const tx = await program.methods
        .claimWinnings()
        .accounts({
          // Add required accounts here
        })
        .rpc();
      
      await refreshPositions();
      return tx;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    if (program) {
      refreshMarkets();
      if (wallet) {
        refreshPositions();
      }
    }
  }, [program, wallet]);

  return (
    <SolanaContext.Provider
      value={{
        program,
        markets,
        userPositions,
        isLoading,
        error,
        refreshMarkets,
        refreshPositions,
        buyShares,
        sellShares,
        createMarket,
        claimWinnings,
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
