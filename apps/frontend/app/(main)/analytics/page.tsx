"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Platform statistics and market insights
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analytics.totalVolume / 1_000_000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">All-time trading volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Liquidity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(analytics.totalLiquidity / 1_000_000).toFixed(2)}M
            </div>
            <p className="text-xs text-muted-foreground">Available for trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Markets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeMarkets}</div>
            <p className="text-xs text-muted-foreground">Currently trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Markets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.resolvedMarkets}</div>
            <p className="text-xs text-muted-foreground">Completed markets</p>
          </CardContent>
        </Card>
      </div>

      <Card>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Market Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${(analytics.avgMarketVolume / 1_000_000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{markets.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Market Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {markets.length > 0
                ? ((analytics.resolvedMarkets / markets.length) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
