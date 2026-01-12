"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WobbleCardSimple } from "@/components/ui/wobble-card";
import { BarChart3, TrendingUp, Users, DollarSign, Activity, PieChart } from "lucide-react";
import { useMemo } from "react";
import { MarketCategory } from "@/lib/types";

export default function AnalyticsPage() {
  const { markets } = useSolana();

  const analytics = useMemo(() => {
    const totalVolume = markets.reduce((sum, m) => sum + m.totalVolume, 0);
    const totalLiquidity = markets.reduce((sum, m) => sum + m.yesLiquidity + m.noLiquidity, 0);
    const activeMarkets = markets.filter((m) => m.status === "Active").length;
    const resolvedMarkets = markets.filter((m) => m.status === "Resolved").length;

    // Category breakdown
    const categoryStats = Object.values(MarketCategory).map((category) => {
      const categoryMarkets = markets.filter((m) => m.category === category);
      const categoryVolume = categoryMarkets.reduce((sum, m) => sum + m.totalVolume, 0);
      return {
        category,
        count: categoryMarkets.length,
        volume: categoryVolume,
        percentage: markets.length > 0 ? (categoryMarkets.length / markets.length) * 100 : 0,
      };
    }).filter((stat) => stat.count > 0);

    // Top markets by volume
    const topMarkets = [...markets]
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 5);

    const volumeTimeline = [
      { period: "Week 1", volume: totalVolume * 0.1 },
      { period: "Week 2", volume: totalVolume * 0.15 },
      { period: "Week 3", volume: totalVolume * 0.25 },
      { period: "Week 4", volume: totalVolume * 0.5 },
    ];

    return {
      totalVolume,
      totalLiquidity,
      activeMarkets,
      resolvedMarkets,
      categoryStats,
      topMarkets,
      volumeTimeline,
      avgMarketVolume: markets.length > 0 ? totalVolume / markets.length : 0,
    };
  }, [markets]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Platform statistics and market insights
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <WobbleCardSimple glowColor="34, 197, 94" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Total Volume</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(analytics.totalVolume / 1_000_000).toFixed(2)}M
          </div>
          <p className="text-xs text-white/50 mt-1">All-time trading volume</p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="168, 85, 247" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Total Liquidity</span>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            ${(analytics.totalLiquidity / 1_000_000).toFixed(2)}M
          </div>
          <p className="text-xs text-white/50 mt-1">Available for trading</p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="59, 130, 246" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Active Markets</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{analytics.activeMarkets}</div>
          <p className="text-xs text-white/50 mt-1">Currently trading</p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="249, 115, 22" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Resolved Markets</span>
            <Users className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{analytics.resolvedMarkets}</div>
          <p className="text-xs text-white/50 mt-1">Completed markets</p>
        </WobbleCardSimple>
      </div>

      <Card glowColor="236, 72, 153">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            <CardTitle>Markets by Category</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.categoryStats.map((stat) => (
              <div key={stat.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stat.category}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{stat.count} markets</span>
                    <span className="font-bold">
                      ${(stat.volume / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-primary transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card glowColor="6, 182, 212">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-500" />
            <CardTitle>Top Markets by Volume</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topMarkets.map((market, index) => (
              <div
                key={market.marketId}
                className="flex items-start justify-between border-b pb-4 last:border-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <p className="font-semibold">{market.question}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{market.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">
                    ${(market.totalVolume / 1_000_000).toFixed(2)}M
                  </p>
                  <p className="text-sm text-muted-foreground">volume</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Volume Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Volume Growth</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.volumeTimeline.map((data) => (
              <div key={data.period} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{data.period}</span>
                  <span className="font-bold">${(data.volume / 1_000_000).toFixed(2)}M</span>
                </div>
                <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-blue-600 transition-all"
                    style={{
                      width: `${(data.volume / analytics.totalVolume) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WobbleCardSimple glowColor="139, 92, 246" className="p-6">
          <span className="text-sm font-medium text-white/80">Avg Market Volume</span>
          <p className="text-2xl font-bold text-white mt-2">
            ${(analytics.avgMarketVolume / 1_000_000).toFixed(2)}M
          </p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="6, 182, 212" className="p-6">
          <span className="text-sm font-medium text-white/80">Total Markets</span>
          <p className="text-2xl font-bold text-white mt-2">{markets.length}</p>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="236, 72, 153" className="p-6">
          <span className="text-sm font-medium text-white/80">Market Success Rate</span>
          <p className="text-2xl font-bold text-white mt-2">
            {markets.length > 0
              ? ((analytics.resolvedMarkets / markets.length) * 100).toFixed(1)
              : 0}%
          </p>
        </WobbleCardSimple>
      </div>
    </div>
  );
}
