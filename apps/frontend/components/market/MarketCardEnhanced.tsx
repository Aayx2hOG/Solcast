"use client";

import { Market } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/ui/sparkline";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, Users, Zap, ArrowRight } from "lucide-react";
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

// Generate mock price history for sparkline
function generatePriceHistory(currentPrice: number, points: number = 20): number[] {
  const history: number[] = [];
  let price = currentPrice * (0.8 + Math.random() * 0.4); // Start somewhere around current
  
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.5) * 0.1;
    price = Math.max(0.01, Math.min(0.99, price + change));
    history.push(price);
  }
  
  // End closer to current price
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

  // Generate sparkline data
  const priceHistory = useMemo(() => generatePriceHistory(market.yesPrice), [market.yesPrice]);

  // Glow colors based on market activity
  const glowColor = market.status === "Active" 
    ? "76, 95, 213" 
    : market.status === "Resolved" 
      ? "34, 197, 94" 
      : "239, 68, 68";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/market/${market.marketId}`}>
        <Card 
          className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:translate-y-[-2px] bg-card/80 backdrop-blur-sm"
          enableGlow={true}
          glowColor={glowColor}
        >
          {/* Live indicator for active markets */}
          {market.status === "Active" && market.volume24h && market.volume24h > 10000 && (
            <div className="absolute top-3 right-3 z-10">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </div>
                <span className="text-[9px] font-medium text-red-400">HOT</span>
              </div>
            </div>
          )}

          <CardHeader className="pb-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant="secondary" className="text-[9px]">
                    {market.category}
                  </Badge>
                  <Badge 
                    variant={
                      market.status === "Active" ? "success" :
                      market.status === "Resolved" ? "info" : "danger"
                    }
                    className="text-[9px]"
                  >
                    {market.status}
                  </Badge>
                </div>
                <h3 className="font-medium text-xs leading-tight text-foreground line-clamp-2 group-hover:text-white transition-colors">
                  {market.question}
                </h3>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 p-4 pt-0">
            {/* Sparkline Chart */}
            <div className="h-8 -mx-1">
              <Sparkline 
                data={priceHistory} 
                width={280} 
                height={32}
                strokeWidth={1.5}
                showGradient={true}
              />
            </div>

            {/* Price Display */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Yes</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold tabular-nums text-emerald-400/90">
                    {yesPercentage}%
                  </span>
                  {market.priceChange24h !== undefined && (
                    <div className={cn(
                      "flex items-center text-[9px]",
                      isPriceUp ? "text-emerald-400/70" : "text-red-400/70"
                    )}>
                      {isPriceUp ? <TrendingUp className="h-2 w-2 mr-0.5" strokeWidth={2} /> : <TrendingDown className="h-2 w-2 mr-0.5" strokeWidth={2} />}
                      <span className="font-medium tabular-nums">{Math.abs(market.priceChange24h).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 text-right">
                <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">No</div>
                <div className="text-base font-semibold tabular-nums text-red-400/90">
                  {noPercentage}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-secondary rounded-full overflow-hidden flex">
              <motion.div 
                className="bg-emerald-500/60 rounded-l-full"
                initial={{ width: 0 }}
                animate={{ width: `${yesPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <motion.div 
                className="bg-red-500/60 rounded-r-full"
                initial={{ width: 0 }}
                animate={{ width: `${noPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
              <div className="flex items-center gap-3">
                {showVolume && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
                    <span className="font-medium tabular-nums">
                      ${(market.totalVolume / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" strokeWidth={1.5} />
                  <span className="tabular-nums">{Math.floor(market.totalVolume / 500)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                <span className="capitalize">{timeRemaining}</span>
              </div>
            </div>

            {/* Quick Buy Buttons (optional) */}
            {showQuickBuy && market.status === "Active" && (
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 h-8 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle quick buy
                  }}
                >
                  Yes ${((1 - market.yesPrice) * 10).toFixed(2)}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 h-8 text-xs bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  onClick={(e) => {
                    e.preventDefault();
                    // Handle quick buy
                  }}
                >
                  No ${((1 - market.noPrice) * 10).toFixed(2)}
                </Button>
              </div>
            )}
          </CardContent>

          {/* Hover overlay effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] to-transparent" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

// Compact card variant for sidebars/lists
interface MarketCardCompactProps {
  market: Market;
  rank?: number;
}

export function MarketCardCompact({ market, rank }: MarketCardCompactProps) {
  const yesPercentage = (market.yesPrice * 100).toFixed(0);

  return (
    <Link href={`/market/${market.marketId}`}>
      <div className="group flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all">
        {rank && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.05] text-xs font-medium text-white/60">
            {rank}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/90 truncate group-hover:text-white transition-colors">
            {market.question}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            ${(market.totalVolume / 1000).toFixed(0)}K volume
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-emerald-400 tabular-nums">{yesPercentage}%</div>
          <div className="text-[9px] text-white/40">YES</div>
        </div>
        <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
