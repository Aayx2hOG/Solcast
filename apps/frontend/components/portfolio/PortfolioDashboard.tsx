"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { MiniChart } from "@/components/charts/TradingChart";
import { UserPosition, Market } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface PortfolioDashboardProps {
  positions: UserPosition[];
  markets: Market[];
  className?: string;
}

export function PortfolioDashboard({
  positions,
  markets,
  className,
}: PortfolioDashboardProps) {
  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalInvested = positions.reduce(
      (sum, p) => sum + p.totalInvested,
      0,
    );
    const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const pnlPercentage =
      totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalPnl,
      pnlPercentage,
      positionCount: positions.length,
    };
  }, [positions]);

  // Generate mock portfolio chart data
  const portfolioHistory = useMemo(() => {
    const data: number[] = [];
    let value = portfolioStats.totalValue * 0.7;

    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.4) * value * 0.05;
      value = Math.max(0, value + change);
      data.push(value);
    }
    data.push(portfolioStats.totalValue);
    return data;
  }, [portfolioStats.totalValue]);

  const isProfitable = portfolioStats.totalPnl >= 0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Portfolio Overview Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/[0.08]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Main Stats */}
            <div className="space-y-1">
              <p className="text-sm text-white/50 font-medium">
                Portfolio Value
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-white tabular-nums">
                  $
                  <AnimatedCounter
                    value={portfolioStats.totalValue / 1_000_000}
                    decimals={2}
                  />
                </span>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    isProfitable
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400",
                  )}
                >
                  {isProfitable ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {isProfitable ? "+" : ""}
                  {portfolioStats.pnlPercentage.toFixed(2)}%
                </div>
              </div>
              <p
                className={cn(
                  "text-sm font-medium tabular-nums",
                  isProfitable ? "text-emerald-400" : "text-red-400",
                )}
              >
                {isProfitable ? "+" : ""}$
                {(portfolioStats.totalPnl / 1_000_000).toFixed(2)}M all time
              </p>
            </div>

            {/* Mini Chart */}
            <div className="w-full md:w-64">
              <MiniChart
                data={portfolioHistory}
                width={256}
                height={80}
                color={isProfitable ? "#22c55e" : "#ef4444"}
              />
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/[0.06]">
            <div>
              <p className="text-xs text-white/40">Total Invested</p>
              <p className="text-lg font-semibold text-white tabular-nums">
                ${(portfolioStats.totalInvested / 1_000_000).toFixed(2)}M
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">Open Positions</p>
              <p className="text-lg font-semibold text-white tabular-nums">
                {portfolioStats.positionCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40">Win Rate</p>
              <p className="text-lg font-semibold text-emerald-400 tabular-nums">
                68%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Positions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Open Positions</h2>
          <Badge variant="secondary" className="text-[10px]">
            {positions.length} positions
          </Badge>
        </div>

        {positions.length === 0 ? (
          <Card className="p-8 text-center bg-white/[0.02] border-white/[0.06]">
            <Wallet className="h-12 w-12 mx-auto text-white/20 mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">
              No positions yet
            </h3>
            <p className="text-sm text-white/50 mb-4">
              Start trading to build your portfolio
            </p>
            <Link href="/explorer">
              <Button>Explore Markets</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {positions.map((position, index) => {
              const market = markets.find((m) =>
                m.publicKey.equals(position.market),
              );
              return (
                <PositionRow
                  key={position.publicKey.toString()}
                  position={position}
                  market={market}
                  index={index}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface PositionRowProps {
  position: UserPosition;
  market?: Market;
  index: number;
}

function PositionRow({ position, market, index }: PositionRowProps) {
  const isProfitable = position.pnl >= 0;
  const hasYesPosition = position.yesShares > 0;
  const hasNoPosition = position.noShares > 0;

  const positionHistory = useMemo(() => {
    const data: number[] = [];
    let value = position.totalInvested * 0.8;

    for (let i = 0; i < 15; i++) {
      const change = (Math.random() - 0.45) * value * 0.1;
      value = Math.max(0, value + change);
      data.push(value);
    }
    data.push(position.currentValue);
    return data;
  }, [position.totalInvested, position.currentValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={market ? `/market/${market.marketId}` : "#"}>
        <Card className="p-4 bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all cursor-pointer group">
          <div className="flex items-center gap-4">
            {/* Position indicator */}
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                isProfitable ? "bg-emerald-500/10" : "bg-red-500/10",
              )}
            >
              {isProfitable ? (
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>

            {/* Market info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-white/90">
                {market?.question || "Unknown Market"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {hasYesPosition && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-emerald-500/30 text-emerald-400"
                  >
                    {position.yesShares.toFixed(0)} YES
                  </Badge>
                )}
                {hasNoPosition && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-red-500/30 text-red-400"
                  >
                    {position.noShares.toFixed(0)} NO
                  </Badge>
                )}
                {market && (
                  <span className="text-[10px] text-white/40">
                    @ {(market.yesPrice * 100).toFixed(0)}¢
                  </span>
                )}
              </div>
            </div>

            {/* Mini chart */}
            <div className="hidden md:block w-24">
              <MiniChart
                data={positionHistory}
                width={96}
                height={32}
                color={isProfitable ? "#22c55e" : "#ef4444"}
              />
            </div>

            {/* P&L */}
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  isProfitable ? "text-emerald-400" : "text-red-400",
                )}
              >
                {isProfitable ? "+" : ""}
                {position.pnlPercentage.toFixed(2)}%
              </p>
              <p
                className={cn(
                  "text-xs tabular-nums",
                  isProfitable ? "text-emerald-400/70" : "text-red-400/70",
                )}
              >
                {isProfitable ? "+" : ""}$
                {(position.pnl / 1_000_000).toFixed(2)}
              </p>
            </div>

            {/* Action */}
            <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
