"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useClaimablePositions } from "@/lib/hooks/useUserPositions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WobbleCardSimple } from "@/components/ui/wobble-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PositionCard, PositionCardSkeleton } from "@/components/portfolio/PositionCard";
import { PositionListSkeleton, StatsGridSkeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  BarChart3,
  Trophy,
  Clock,
  RefreshCw,
  History,
  Filter
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MarketStatus, Outcome } from "@/lib/types";
import { toast } from "sonner";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { userPositions, markets, claimWinnings, isLoading, refreshPositions } = useSolana();
  const [activeTab, setActiveTab] = useState("active");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get claimable positions
  const { claimablePositions, totalClaimable } = useClaimablePositions(markets);

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
      winningPositions,
      losingPositions,
      winRate: winRate.toFixed(1),
      isProfitable: totalPnl >= 0,
    };
  }, [userPositions]);

  const positionsWithMarkets = useMemo(() => {
    return userPositions
      .map((position) => ({
        position,
        market: markets.find((m) => m.publicKey.equals(position.market)),
      }))
      .filter(({ market }) => market !== undefined);
  }, [userPositions, markets]);

  // Filtered positions by tab
  const filteredPositions = useMemo(() => {
    return positionsWithMarkets.filter(({ market }) => {
      if (!market) return false;
      switch (activeTab) {
        case "active":
          return market.status === MarketStatus.Active;
        case "resolved":
          return market.status === MarketStatus.Resolved;
        case "claimable":
          return market.status === MarketStatus.Resolved && 
            claimablePositions.some(cp => cp.market.equals(market.publicKey));
        default:
          return true;
      }
    });
  }, [positionsWithMarkets, activeTab, claimablePositions]);

  // Handle claim
  const handleClaim = async (marketId: number) => {
    try {
      const tx = await claimWinnings(marketId);
      toast.success("Winnings claimed successfully!", {
        description: `Transaction: ${tx.slice(0, 8)}...`,
      });
    } catch (error: any) {
      toast.error("Failed to claim winnings", {
        description: error.message,
      });
      throw error;
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPositions();
      toast.success("Portfolio refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 sm:p-12 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to view your portfolio
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <StatsGridSkeleton />
        <PositionListSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Portfolio</h1>
            <p className="text-muted-foreground">Track your positions and performance</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Claimable Banner */}
        {totalClaimable > 0 && (
          <Card className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-emerald-500/30">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-500/20">
                    <Trophy className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold">You have winnings to claim!</p>
                    <p className="text-sm text-muted-foreground">
                      ${totalClaimable.toFixed(2)} USDC available from {claimablePositions.length} market{claimablePositions.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveTab("claimable")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Claim All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <WobbleCardSimple glowColor="34, 197, 94" className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-white/80">Total Invested</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">${portfolioStats.totalInvested}</div>
            <p className="text-[10px] sm:text-xs text-white/50 mt-1">USDC invested</p>
          </WobbleCardSimple>

          <WobbleCardSimple glowColor="59, 130, 246" className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-white/80">Current Value</span>
              <BarChart3 className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">${portfolioStats.totalValue}</div>
            <p className="text-[10px] sm:text-xs text-white/50 mt-1">Market value</p>
          </WobbleCardSimple>

          <WobbleCardSimple glowColor={portfolioStats.isProfitable ? "34, 197, 94" : "239, 68, 68"} className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-white/80">Total P&L</span>
              {portfolioStats.isProfitable ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold ${
                portfolioStats.isProfitable ? "text-emerald-400" : "text-red-400"
              }`}
            >
            {portfolioStats.isProfitable ? "+" : ""}${portfolioStats.totalPnl}
            </div>
            <p className="text-[10px] sm:text-xs text-white/50 mt-1">
              {portfolioStats.isProfitable ? "+" : ""}
              {portfolioStats.pnlPercentage}%
            </p>
          </WobbleCardSimple>

          <WobbleCardSimple glowColor="168, 85, 247" className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-white/80">Win Rate</span>
              <Trophy className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{portfolioStats.winRate}%</div>
            <p className="text-[10px] sm:text-xs text-white/50 mt-1">
              {portfolioStats.winningPositions}W / {portfolioStats.losingPositions}L
            </p>
          </WobbleCardSimple>
        </div>

        {/* Positions Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                All ({positionsWithMarkets.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-1 sm:flex-none">
                Active
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex-1 sm:flex-none">
                Resolved
              </TabsTrigger>
              {claimablePositions.length > 0 && (
                <TabsTrigger value="claimable" className="flex-1 sm:flex-none">
                  <Trophy className="h-3 w-3 mr-1" />
                  Claimable ({claimablePositions.length})
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value={activeTab}>
            {filteredPositions.length > 0 ? (
              <div className="space-y-4">
                {filteredPositions.map(({ position, market }) => {
                  if (!market) return null;
                  return (
                    <PositionCard
                      key={position.publicKey.toBase58()}
                      position={position}
                      market={market}
                      onClaim={handleClaim}
                      showClaimButton={activeTab === "claimable" || activeTab === "all" || activeTab === "resolved"}
                    />
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  {activeTab === "claimable" ? (
                    <>
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No winnings to claim</p>
                      <p className="text-sm text-muted-foreground">
                        When you win predictions, you can claim your winnings here.
                      </p>
                    </>
                  ) : activeTab === "active" ? (
                    <>
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No active positions</p>
                      <Link href="/explorer">
                        <Button>Browse Markets</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No positions found</p>
                      <Link href="/explorer">
                        <Button>Browse Markets</Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Trade History Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs">
                <History className="h-4 w-4 mr-1" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userPositions.length > 0 ? (
              <div className="space-y-3">
                {/* Mock trade history - in production, this would come from the backend */}
                {positionsWithMarkets.slice(0, 5).map(({ position, market }) => {
                  if (!market) return null;
                  return (
                    <div
                      key={`trade-${position.publicKey.toBase58()}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          position.pnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                        }`}>
                          {position.pnl >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{market.question}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-[10px]">
                              {market.category}
                            </Badge>
                            <span>•</span>
                            <span>
                              {position.yesShares > 0 && `${position.yesShares} Yes`}
                              {position.yesShares > 0 && position.noShares > 0 && ", "}
                              {position.noShares > 0 && `${position.noShares} No`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          position.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}>
                          {position.pnl >= 0 ? "+" : ""}${(position.pnl / 1_000_000).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${(position.currentValue / 1_000_000).toFixed(2)} value
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
