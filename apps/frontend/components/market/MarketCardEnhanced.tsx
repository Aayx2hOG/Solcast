"use client";

import { Market } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, Users, ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface MarketCardEnhancedProps {
  market: Market;
  showVolume?: boolean;
  showQuickBuy?: boolean;
  index?: number;
}

function generatePriceHistory(currentPrice: number, points: number = 20): number[] {
  const history: number[] = [];
  let price = currentPrice * (0.8 + Math.random() * 0.4);
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * 0.1;
    price = Math.max(0.01, Math.min(0.99, price + change));
    history.push(price);
  }
  
  history[history.length - 1] = currentPrice;
  return history;
}

export function MarketCardEnhanced({ 
  market, 
  showVolume = true, 
  showQuickBuy = false,
  index = 0 
}: MarketCardEnhancedProps) {
  const timeRemaining = formatDistanceToNow(market.endTimestamp, { addSuffix: true });
  const yesPercentage = (market.yesPrice * 100).toFixed(1);
  const noPercentage = (market.noPrice * 100).toFixed(1);
  const isPriceUp = (market.priceChange24h ?? 0) > 0;

  const priceHistory = useMemo(() => generatePriceHistory(market.yesPrice), [market.yesPrice]);

  const isHot = market.status === "Active" && market.volume24h && market.volume24h > 10000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link href={`/market/${market.marketId}`}>
        <Card className="group relative cursor-pointer transition-all duration-200 hover:border-white/[0.12] bg-white/[0.02] border-white/[0.06]">
          {isHot && (
            <div className="absolute top-3 right-3 z-10">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                <Flame className="h-2.5 w-2.5 text-orange-400" />
                <span className="text-[9px] font-medium text-orange-400">Hot</span>
              </div>
            </div>
          )}

          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.05] text-white/50 border border-white/[0.08]">
                {market.category}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-medium",
                market.status === "Active" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                market.status === "Resolved" && "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
                market.status !== "Active" && market.status !== "Resolved" && "bg-red-500/10 text-red-400 border border-red-500/20"
              )}>
                {market.status}
              </span>
            </div>

            <h3 className="text-sm text-white/80 line-clamp-2 group-hover:text-white transition-colors leading-relaxed">
              {market.question}
            </h3>

            <div className="h-10 -mx-1">
              <Sparkline 
                data={priceHistory} 
                width={280} 
                height={40}
                strokeWidth={1.5}
                showGradient={true}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-white/30 mb-0.5">Yes</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold tabular-nums text-emerald-400">
                    {yesPercentage}%
                  </span>
                  {market.priceChange24h !== undefined && (
                    <span className={cn(
                      "flex items-center text-[10px] font-medium",
                      isPriceUp ? "text-emerald-400" : "text-red-400"
                    )}>
                      {isPriceUp ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                      {Math.abs(market.priceChange24h).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/30 mb-0.5">No</div>
                <span className="text-lg font-semibold tabular-nums text-red-400">
                  {noPercentage}%
                </span>
              </div>
            </div>

            <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden flex">
              <motion.div 
                className="bg-emerald-500 rounded-l-full"
                initial={{ width: 0 }}
                animate={{ width: `${yesPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div 
                className="bg-red-500 rounded-r-full"
                initial={{ width: 0 }}
                animate={{ width: `${noPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/40">
              <div className="flex items-center gap-4">
                {showVolume && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3" />
                    <span className="tabular-nums">${(market.totalVolume / 1_000_000).toFixed(2)}M</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  <span className="tabular-nums">{Math.floor(market.totalVolume / 500)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>{timeRemaining}</span>
              </div>
            </div>

            {showQuickBuy && market.status === "Active" && (
              <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                <Button 
                  size="sm" 
                  className="flex-1 h-8 text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                  onClick={(e) => e.preventDefault()}
                >
                  Yes ${((1 - market.yesPrice) * 10).toFixed(2)}
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 h-8 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                  onClick={(e) => e.preventDefault()}
                >
                  No ${((1 - market.noPrice) * 10).toFixed(2)}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

interface MarketCardCompactProps {
  market: Market;
  rank?: number;
}

export function MarketCardCompact({ market, rank }: MarketCardCompactProps) {
  const yesPercentage = (market.yesPrice * 100).toFixed(0);

  return (
    <Link href={`/market/${market.marketId}`}>
      <div className="group flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors">
        {rank && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.05] text-[10px] font-medium text-white/50">
            {rank}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/70 truncate group-hover:text-white transition-colors">
            {market.question}
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">
            ${(market.totalVolume / 1000).toFixed(0)}K vol
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-emerald-400 tabular-nums">{yesPercentage}%</div>
          <div className="text-[9px] text-white/30">Yes</div>
        </div>
        <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
      </div>
    </Link>
  );
}
