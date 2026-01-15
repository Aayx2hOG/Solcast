"use client";

import { Market } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, Users } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface MarketCardProps {
  market: Market;
  showVolume?: boolean;
}

export function MarketCard({ market, showVolume = true }: MarketCardProps) {
  const timeRemaining = formatDistanceToNow(market.endTimestamp, { addSuffix: true });
  const yesPercentage = (market.yesPrice * 100).toFixed(1);
  const noPercentage = (market.noPrice * 100).toFixed(1);
  const isPriceUp = (market.priceChange24h ?? 0) > 0;

  // Different glow colors based on market status
  const glowColor = market.status === "Active" 
    ? "76, 95, 213" // Purple-blue for active
    : market.status === "Resolved" 
      ? "34, 197, 94" // Green for resolved
      : "239, 68, 68"; // Red for closed/cancelled

  return (
    <Link href={`/market/${market.marketId}`}>
      <Card 
        className="group cursor-pointer transition-all duration-300 hover:translate-y-[-2px] bg-card/80 backdrop-blur-sm"
        enableGlow={true}
        glowColor={glowColor}
      >
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
              <h3 className="font-medium text-xs leading-tight text-foreground line-clamp-2">
                {market.question}
              </h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 pt-0">
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
          <div className="h-0.5 bg-secondary overflow-hidden flex">
            <div 
              className="bg-emerald-600/50 transition-all duration-500"
              style={{ width: `${yesPercentage}%` }}
            />
            <div 
              className="bg-red-600/50 transition-all duration-500"
              style={{ width: `${noPercentage}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/[0.06] pt-2.5">
            {showVolume && (
              <div className="flex items-center gap-1">
                <Users className="h-2.5 w-2.5" strokeWidth={1.5} />
                <span className="font-medium tabular-nums">${(market.totalVolume / 1_000_000).toFixed(1)}M</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" strokeWidth={1.5} />
              <span className="font-medium">{timeRemaining}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

