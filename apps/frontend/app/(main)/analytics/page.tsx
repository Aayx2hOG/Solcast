"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  PieChart
} from "lucide-react";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const { markets } = useSolana();

  const stats = useMemo(() => {
    const totalVolume = markets.reduce((sum, m) => sum + m.totalVolume, 0);
    const totalLiquidity = markets.reduce((sum, m) => sum + m.yesLiquidity + m.noLiquidity, 0);
    const activeMarkets = markets.filter((m) => m.status === "Active").length;
    const resolvedMarkets = markets.filter((m) => m.status === "Resolved").length;
    const avgVolume = markets.length > 0 ? totalVolume / markets.length : 0;

    const categoryStats = markets.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const volume24h = markets.reduce((sum, m) => sum + (m.volume24h || 0), 0);

    return {
      totalVolume: (totalVolume / 1_000_000).toFixed(2),
      totalLiquidity: (totalLiquidity / 1_000_000).toFixed(2),
      totalMarkets: markets.length,
      activeMarkets,
      resolvedMarkets,
      avgVolume: (avgVolume / 1_000_000).toFixed(2),
      categoryStats,
      volume24h: (volume24h / 1_000_000).toFixed(2),
    };
  }, [markets]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-medium text-white">Analytics</h1>
          <p className="text-sm text-white/50">Platform statistics</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox label="Total Volume" value={`$${stats.totalVolume}M`} />
        <StatBox label="Liquidity" value={`$${stats.totalLiquidity}M`} />
        <StatBox label="24h Volume" value={`$${stats.volume24h}M`} />
        <StatBox label="Markets" value={stats.totalMarkets.toString()} subtitle={`${stats.activeMarkets} active`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-400" />
              Markets by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {Object.entries(stats.categoryStats).map(([category, count]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/50">{category}</span>
                    <span className="text-xs font-medium text-white">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / stats.totalMarkets) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
              {Object.keys(stats.categoryStats).length === 0 && (
                <div className="text-center py-8">
                  <PieChart className="h-5 w-5 text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/30">No data</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Active" value={stats.activeMarkets} />
              <MiniStat label="Resolved" value={stats.resolvedMarkets} />
              <MiniStat label="Avg Volume" value={`$${stats.avgVolume}M`} />
              <MiniStat 
                label="Resolution Rate" 
                value={`${stats.totalMarkets > 0 ? ((stats.resolvedMarkets / stats.totalMarkets) * 100).toFixed(0) : 0}%`} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
        <p className="text-[10px] text-white/30">
          Data refreshes every 5 minutes. All values in USD.
        </p>
      </div>
    </div>
  );
}

function StatBox({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]"
    >
      <div className="text-[10px] text-white/30 mb-1">{label}</div>
      <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
      {subtitle && <p className="text-[10px] text-white/30 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <div className="text-[10px] text-white/30 mb-1">{label}</div>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
