"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { MarketCard } from "@/components/market/MarketCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-[calc(100vh-10rem)] bg-background">
      <div className="container mx-auto px-5 py-8 space-y-10">
        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle>Total Volume</CardTitle>
              <DollarSign className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-semibold text-foreground tabular-nums">
                ${stats.totalVolume}M
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Across all markets</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle>Active Markets</CardTitle>
              <Activity className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-semibold text-foreground tabular-nums">
                {stats.activeMarkets}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Live prediction markets</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle>Total Liquidity</CardTitle>
              <TrendingUp className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-semibold text-foreground tabular-nums">
                ${stats.totalLiquidity}M
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Available for trading</p>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle>Total Markets</CardTitle>
              <Users className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-semibold text-foreground tabular-nums">
                {stats.totalMarkets}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">All time</p>
            </CardContent>
          </Card>
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
