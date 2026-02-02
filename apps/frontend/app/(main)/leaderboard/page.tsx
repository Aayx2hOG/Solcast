"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2, Crown, Medal, Award } from "lucide-react";
import { api } from "@/lib/services/api";
import { motion } from "framer-motion";

interface Trader {
  rank: number;
  address: string;
  totalPnl: number;
  totalVolume: number;
  winRate: number;
  activePositions: number;
  resolvedMarkets: number;
}

const getRankStyle = (rank: number) => {
  if (rank === 1) return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" };
  if (rank === 2) return { bg: "bg-white/[0.05]", border: "border-white/[0.08]", text: "text-white/60" };
  if (rank === 3) return { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400" };
  return { bg: "bg-white/[0.02]", border: "border-white/[0.06]", text: "text-white/50" };
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-amber-400" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-white/60" />;
  if (rank === 3) return <Award className="h-4 w-4 text-orange-400" />;
  return null;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/20 mx-auto" />
          <p className="text-xs text-white/30 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  const topTrader = leaderboardData[0];

  if (!topTrader) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-white/[0.02] border-white/[0.06] p-12 text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
            <Trophy className="h-6 w-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-medium text-white mb-2">No Traders Yet</h2>
          <p className="text-sm text-white/50">Be the first on the leaderboard!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Trophy className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-medium text-white">Leaderboard</h1>
          <p className="text-sm text-white/50">Top traders by P&L</p>
        </div>
      </motion.div>

      <div className="p-5 rounded-lg bg-amber-500/5 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium text-white">Top Trader</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] text-white/40 mb-1">Wallet</p>
            <p className="font-mono text-xs text-white truncate">{topTrader.address}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-1">P&L</p>
            <p className="text-sm font-medium text-emerald-400">+${topTrader.totalPnl.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-1">Win Rate</p>
            <p className="text-sm font-medium text-white">{topTrader.winRate}%</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 mb-1">Volume</p>
            <p className="text-sm font-medium text-white">${(topTrader.totalVolume / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </div>

      <Card className="bg-white/[0.02] border-white/[0.06]">
        <CardHeader className="pb-3 pt-4 px-4">
          <CardTitle className="text-sm font-medium text-white">All Traders</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {leaderboardData.map((trader, index) => {
              const style = getRankStyle(trader.rank);
              return (
                <motion.div
                  key={trader.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center gap-4 p-3 rounded-lg ${style.bg} border ${style.border}`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.bg} border ${style.border} ${style.text} text-xs font-medium`}>
                    {getRankIcon(trader.rank) || `#${trader.rank}`}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-white/70 truncate">{trader.address}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{trader.activePositions} active positions</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-right shrink-0">
                    <div>
                      <p className="text-[9px] text-white/30">P&L</p>
                      <p className="text-xs font-medium text-emerald-400">+${trader.totalPnl.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30">Win</p>
                      <p className="text-xs font-medium text-white">{trader.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30">Vol</p>
                      <p className="text-xs font-medium text-white">${(trader.totalVolume / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[10px] text-white/30">
          Rankings by total P&L. Updates every 5 minutes.
        </p>
      </div>
    </div>
  );
}
