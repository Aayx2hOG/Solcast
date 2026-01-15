"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { MarketCard } from "@/components/market/MarketCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WobbleCardSimple } from "@/components/ui/wobble-card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function Home() {
  const { markets, isLoading } = useSolana();

  const stats = useMemo(() => {
    const totalVolume = markets.reduce((sum, m) => sum + m.totalVolume, 0);
    const activeMarkets = markets.filter((m) => m.status === "Active").length;
    const totalLiquidity = markets.reduce(
      (sum, m) => sum + m.yesLiquidity + m.noLiquidity,
      0
    );
    
    return {
      totalVolume: (totalVolume / 1_000_000).toFixed(2),
      activeMarkets,
      totalLiquidity: (totalLiquidity / 1_000_000).toFixed(2),
      totalMarkets: markets.length,
    };
  }, [markets]);

  const featuredMarkets = useMemo(() => {
    return markets
      .filter((m) => m.status === "Active")
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 6);
  }, [markets]);

  const trendingMarkets = useMemo(() => {
    return markets
      .filter((m) => m.status === "Active" && m.volume24h)
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, 3);
  }, [markets]);

  return (
    <div className="relative">
      <div className="container mx-auto px-5 py-6 pb-8 space-y-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <WobbleCardSimple glowColor="34, 197, 94" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Total Volume</span>
              <DollarSign className="h-4 w-4 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              ${stats.totalVolume}M
            </div>
            <p className="text-xs text-white/50 mt-1">Across all markets</p>
          </WobbleCardSimple>

          <WobbleCardSimple glowColor="59, 130, 246" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Active Markets</span>
              <Activity className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {stats.activeMarkets}
            </div>
            <p className="text-xs text-white/50 mt-1">Live prediction markets</p>
          </WobbleCardSimple>

          <WobbleCardSimple glowColor="168, 85, 247" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Total Liquidity</span>
              <TrendingUp className="h-4 w-4 text-purple-400" strokeWidth={1.5} />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              ${stats.totalLiquidity}M
            </div>
            <p className="text-xs text-white/50 mt-1">Available for trading</p>
          </WobbleCardSimple>

          <WobbleCardSimple glowColor="249, 115, 22" className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white/80">Total Markets</span>
              <Users className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">
              {stats.totalMarkets}
            </div>
            <p className="text-xs text-white/50 mt-1">All time</p>
          </WobbleCardSimple>
        </section>

        {/* Trending Markets */}
        {trendingMarkets.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Trending Markets</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Highest 24h volume</p>
              </div>
              <Link href="/explorer">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-[11px] h-7">
                  View All <ArrowRight className="ml-1 h-3 w-3" strokeWidth={1.5} />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trendingMarkets.map((market) => (
                <MarketCard key={market.marketId} market={market} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Markets */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Featured Markets</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">Top markets by volume</p>
            </div>
            <Link href="/explorer">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-[11px] h-7">
                View All <ArrowRight className="ml-1 h-3 w-3" strokeWidth={1.5} />
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-56 animate-pulse bg-card border-border/[0.06]" />
              ))}
            </div>
          ) : featuredMarkets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredMarkets.map((market) => (
                <MarketCard key={market.marketId} market={market} />
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border/[0.06] p-16 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="h-12 w-12 border border-border/[0.06] bg-secondary flex items-center justify-center mx-auto">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No markets yet</h3>
                  <p className="text-xs text-muted-foreground">Be the first to create a prediction market and start trading.</p>
                </div>
                <Link href="/create">
                  <Button size="sm" className="mt-2">
                    Create the First Market
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
