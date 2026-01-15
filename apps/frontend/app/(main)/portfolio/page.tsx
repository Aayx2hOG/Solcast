"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WobbleCardSimple } from "@/components/ui/wobble-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { userPositions, markets } = useSolana();

  const portfolioStats = useMemo(() => {
    const totalInvested = userPositions.reduce((sum, p) => sum + p.totalInvested, 0);
    const totalValue = userPositions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPnl = totalValue - totalInvested;
    const pnlPercentage = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    
    const winningPositions = userPositions.filter((p) => p.pnl > 0).length;
    const losingPositions = userPositions.filter((p) => p.pnl < 0).length;
    const winRate = userPositions.length > 0 
      ? (winningPositions / userPositions.length) * 100 
      : 0;

    return {
      totalInvested: (totalInvested / 1_000_000).toFixed(2),
      totalValue: (totalValue / 1_000_000).toFixed(2),
      totalPnl: (totalPnl / 1_000_000).toFixed(2),
      pnlPercentage: pnlPercentage.toFixed(2),
      activePositions: userPositions.length,
      winRate: winRate.toFixed(1),
      isProfitable: totalPnl >= 0,
    };
  }, [userPositions]);

  const positionsWithMarkets = useMemo(() => {
    return userPositions.map((position) => ({
      position,
      market: markets.find((m) => m.publicKey.equals(position.market)),
    }));
  }, [userPositions, markets]);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to view your portfolio
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
        <p className="text-muted-foreground">Track your positions and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <WobbleCardSimple glowColor="34, 197, 94" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Total Invested</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">${portfolioStats.totalInvested}</div>
          <p className="text-xs text-white/50 mt-1">USDC invested</p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="59, 130, 246" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Current Value</span>
            <BarChart3 className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">${portfolioStats.totalValue}</div>
          <p className="text-xs text-white/50 mt-1">Market value</p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor={portfolioStats.isProfitable ? "34, 197, 94" : "239, 68, 68"} className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Total P&L</span>
            {portfolioStats.isProfitable ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-400" />
            )}
          </div>
          <div
            className={`text-2xl font-bold ${
              portfolioStats.isProfitable ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {portfolioStats.isProfitable ? "+" : ""}${portfolioStats.totalPnl}
          </div>
          <p className="text-xs text-white/50 mt-1">
            {portfolioStats.isProfitable ? "+" : ""}
            {portfolioStats.pnlPercentage}%
          </p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="168, 85, 247" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Win Rate</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{portfolioStats.winRate}%</div>
          <p className="text-xs text-white/50 mt-1">
            {portfolioStats.activePositions} active positions
          </p>
        </WobbleCardSimple>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positionsWithMarkets.length > 0 ? (
            <div className="space-y-4">
              {positionsWithMarkets.map(({ position, market }) => {
                if (!market) return null;
                
                const isProfitable = position.pnl >= 0;
                
                return (
                  <Link
                    key={position.publicKey.toBase58()}
                    href={`/market/${market.marketId}`}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{market.question}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {market.category}
                              </Badge>
                              <Badge
                                variant={market.status === "Active" ? "success" : "default"}
                                className="text-xs"
                              >
                                {market.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-lg font-bold ${
                                isProfitable ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {isProfitable ? "+" : ""}$
                              {(position.pnl / 1_000_000).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {isProfitable ? "+" : ""}
                              {position.pnlPercentage.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Yes Shares</span>
                            <p className="font-medium">{position.yesShares.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">No Shares</span>
                            <p className="font-medium">{position.noShares.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Invested</span>
                            <p className="font-medium">
                              ${(position.totalInvested / 1_000_000).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Current Value</span>
                            <p className="font-medium">
                              ${(position.currentValue / 1_000_000).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No active positions</p>
              <Link href="/explorer">
                <Button>Browse Markets</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
