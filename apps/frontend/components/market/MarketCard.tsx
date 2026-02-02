"use client";

import { Market } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Link href={`/market/${market.marketId}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:border-white/[0.12] bg-white/[0.02] border-white/[0.06]">
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
            <div 
              className="bg-emerald-500 transition-all duration-300 rounded-l-full"
              style={{ width: `${yesPercentage}%` }}
            />
            <div 
              className="bg-red-500 transition-all duration-300 rounded-r-full"
              style={{ width: `${noPercentage}%` }}
            />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-white/40 pt-1">
            {showVolume && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                <span className="tabular-nums">${(market.totalVolume / 1_000_000).toFixed(1)}M</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{timeRemaining}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
