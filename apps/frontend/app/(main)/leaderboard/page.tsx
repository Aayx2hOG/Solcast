"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Activity } from "lucide-react";

// Mock data - in production this would come from the blockchain
const leaderboardData = [];

const getRankBadge = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

export default function LeaderboardPage() {
  const topTrader = leaderboardData[0];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">🏆 Leaderboard</h1>
        <p className="text-muted-foreground">
          Top traders ranked by profit and performance
        </p>
      </div>

      {/* Top Trader Highlight */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top Trader
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trader</p>
              <p className="text-2xl font-bold font-mono">{topTrader.address}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total P&L</p>
              <p className="text-2xl font-bold text-green-600">
                +${topTrader.totalPnl.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-bold">{topTrader.winRate}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
              <p className="text-2xl font-bold">${(topTrader.totalVolume / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Traders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData.map((trader) => (
              <Card
                key={trader.rank}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="text-3xl font-bold w-16 text-center">
                      {getRankBadge(trader.rank)}
                    </div>

                    {/* Address */}
                    <div className="flex-1">
                      <p className="font-mono font-bold text-lg">{trader.address}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          {trader.activePositions} active
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {trader.resolvedMarkets} resolved
                        </Badge>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-muted-foreground">P&L</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">
                          +${trader.totalPnl.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-muted-foreground">Win Rate</span>
                        </div>
                        <p className="text-lg font-bold">{trader.winRate}%</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Activity className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-muted-foreground">Volume</span>
                        </div>
                        <p className="text-lg font-bold">
                          ${(trader.totalVolume / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Rankings are based on total profit and loss (P&L) across all markets. Leaderboard
            updates every 5 minutes. Connect your wallet to see your ranking!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
