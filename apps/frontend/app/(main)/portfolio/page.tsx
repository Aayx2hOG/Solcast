"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useClaimablePositions } from "@/lib/hooks/useUserPositions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PositionCard } from "@/components/portfolio/PositionCard";
import { PositionListSkeleton, StatsGridSkeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Trophy,
  RefreshCw,
  History,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MarketStatus } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PortfolioPage() {
  const { connected } = useWallet();
  const { userPositions, markets, claimWinnings, isLoading, refreshPositions } = useSolana();
  const [activeTab, setActiveTab] = useState("active");
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleClaim = async (marketId: number) => {
    try {
      const tx = await claimWinnings(marketId);
      toast.success("Claimed!", { description: `TX: ${tx.slice(0, 8)}...` });
    } catch (error: any) {
      toast.error("Failed", { description: error.message });
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPositions();
      toast.success("Refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-white/[0.02] border-white/[0.06] p-12 text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
            <Wallet className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-lg font-medium text-white mb-2">Connect Wallet</h2>
          <p className="text-sm text-white/50">Connect your wallet to view your portfolio</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-8 w-36 bg-white/[0.03] rounded animate-pulse" />
        <StatsGridSkeleton />
        <PositionListSkeleton />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Briefcase className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white">Portfolio</h1>
              <p className="text-sm text-white/50">Your positions</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 text-xs border-white/[0.08] text-white/50 hover:text-white bg-white/[0.03]"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>

        {totalClaimable > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Trophy className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Winnings available</p>
                <p className="text-xs text-white/50">${totalClaimable.toFixed(2)} from {claimablePositions.length} market(s)</p>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => setActiveTab("claimable")}
              className="bg-emerald-500 hover:bg-emerald-600 h-8 px-4 text-xs"
            >
              Claim
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBox label="Invested" value={`$${portfolioStats.totalInvested}`} />
          <StatBox label="Value" value={`$${portfolioStats.totalValue}`} />
          <StatBox 
            label="P&L" 
            value={`${portfolioStats.isProfitable ? "+" : ""}$${portfolioStats.totalPnl}`}
            valueColor={portfolioStats.isProfitable ? "text-emerald-400" : "text-red-400"}
            subtitle={`${portfolioStats.isProfitable ? "+" : ""}${portfolioStats.pnlPercentage}%`}
          />
          <StatBox 
            label="Win Rate" 
            value={`${portfolioStats.winRate}%`}
            subtitle={`${portfolioStats.winningPositions}W / ${portfolioStats.losingPositions}L`}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-9 bg-white/[0.03] border border-white/[0.08]">
            <TabsTrigger value="all" className="px-3 text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">
              All ({positionsWithMarkets.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="px-3 text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">
              Active
            </TabsTrigger>
            <TabsTrigger value="resolved" className="px-3 text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">
              Resolved
            </TabsTrigger>
            {claimablePositions.length > 0 && (
              <TabsTrigger value="claimable" className="px-3 text-xs data-[state=active]:bg-white/[0.08] data-[state=active]:text-white">
                <Trophy className="h-3 w-3 mr-1" />
                Claim ({claimablePositions.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredPositions.length > 0 ? (
              <div className="space-y-3">
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
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-12 text-center">
                <div className="h-10 w-10 rounded-lg bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="h-5 w-5 text-white/20" />
                </div>
                <p className="text-sm text-white/50 mb-3">No positions</p>
                <Link href="/explorer">
                  <Button size="sm" className="h-8 px-4 text-xs bg-indigo-500 hover:bg-indigo-600">Browse Markets</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <History className="h-4 w-4 text-white/30" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 text-white/40 hover:text-white">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {userPositions.length > 0 ? (
              <div className="space-y-2">
                {positionsWithMarkets.slice(0, 4).map(({ position, market }) => {
                  if (!market) return null;
                  return (
                    <div
                      key={`trade-${position.publicKey.toBase58()}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${position.pnl >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                          {position.pnl >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-white/70 truncate">{market.question}</p>
                          <p className="text-[10px] text-white/30 mt-0.5">
                            {position.yesShares > 0 && `${position.yesShares} Yes`}
                            {position.yesShares > 0 && position.noShares > 0 && ", "}
                            {position.noShares > 0 && `${position.noShares} No`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-medium ${position.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {position.pnl >= 0 ? "+" : ""}${(position.pnl / 1_000_000).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-5 w-5 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/30">No activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

function StatBox({ 
  label, 
  value, 
  subtitle, 
  valueColor = "text-white" 
}: { 
  label: string; 
  value: string; 
  subtitle?: string;
  valueColor?: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className="text-[10px] text-white/30 mb-1">{label}</div>
      <p className={`text-lg font-semibold tabular-nums ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-white/30 mt-0.5">{subtitle}</p>}
    </div>
  );
}
