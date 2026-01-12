"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WobbleCardSimple } from "@/components/ui/wobble-card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Target, Activity, Loader2 } from "lucide-react";
import { api } from "@/lib/services/api";

interface Trader {
  rank: number;
  address: string;
  totalPnl: number;
  totalVolume: number;
  winRate: number;
  activePositions: number;
  resolvedMarkets: number;
}

const getRankBadge = (rank: number) => {
  if (rank === 1) return "#1";
  if (rank === 2) return "#2";
  if (rank === 3) return "#3";
  return `#${rank}`;
};

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<Trader[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const result = await api.getLeaderboard();
        if (result.data?.traders) {
          setLeaderboardData(result.data.traders);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const topTrader = leaderboardData[0];

  if (!topTrader) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No Traders Yet</h2>
          <p className="text-muted-foreground">
            Be the first to make a trade and appear on the leaderboard!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top traders ranked by profit and performance
        </p>
      </div>

      <WobbleCardSimple glowColor="245, 158, 11" className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-6 w-6 text-yellow-400" />
          <span className="text-lg font-semibold text-white">Top Trader</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-white/50 mb-1">Trader</p>
            <p className="text-xl font-bold font-mono text-white">{topTrader.address}</p>
          </div>
          <div>
            <p className="text-sm text-white/50 mb-1">Total P&L</p>
            <p className="text-xl font-bold text-emerald-400">
              +${topTrader.totalPnl.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/50 mb-1">Win Rate</p>
            <p className="text-xl font-bold text-white">{topTrader.winRate}%</p>
          </div>
          <div>
            <p className="text-sm text-white/50 mb-1">Total Volume</p>
            <p className="text-xl font-bold text-white">${(topTrader.totalVolume / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </WobbleCardSimple>

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
                    <div className="text-3xl font-bold w-16 text-center">
                      {getRankBadge(trader.rank)}
                    </div>

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
