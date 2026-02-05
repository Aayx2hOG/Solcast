"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useOracleWebSocket } from "@/lib/hooks/useOracleWebSocket";
import { Activity, TrendingUp, Shield, Zap } from "lucide-react";
import { useMemo } from "react";

export function OracleStats() {
  const { resolutions, isConnected, latestPrice } = useOracleWebSocket();

  const stats = useMemo(() => {
    if (resolutions.length === 0) {
      return {
        totalUpdates: 0,
        avgConfidence: 0,
        uniqueMarkets: 0,
        updatesPerMinute: 0,
      };
    }

    const confidences = resolutions.map(r => r.confidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    const uniqueMarkets = new Set(resolutions.map(r => r.marketId)).size;
    
    // Calculate updates per minute based on last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentUpdates = resolutions.filter(r => r.ts > fiveMinutesAgo).length;
    const updatesPerMinute = recentUpdates / 5;

    return {
      totalUpdates: resolutions.length,
      avgConfidence,
      uniqueMarkets,
      updatesPerMinute,
    };
  }, [resolutions]);

  const statCards = [
    {
      title: "Total Updates",
      value: stats.totalUpdates,
      icon: Activity,
      color: "text-blue-500",
    },
    {
      title: "Avg Confidence",
      value: `${(stats.avgConfidence * 100).toFixed(1)}%`,
      icon: Shield,
      color: "text-green-500",
    },
    {
      title: "Active Markets",
      value: stats.uniqueMarkets,
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      title: "Updates/Min",
      value: stats.updatesPerMinute.toFixed(1),
      icon: Zap,
      color: "text-yellow-500",
    },
  ];

  return (
    <>
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
