"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPosition, Market, MarketStatus, Outcome } from "@/lib/types";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  ChevronRight,
  Trophy,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ClaimButton } from "@/components/market/ClaimButton";

interface PositionCardProps {
  position: UserPosition;
  market: Market;
  onClaim?: (marketId: number) => Promise<void>;
  showClaimButton?: boolean;
  className?: string;
}

export function PositionCard({
  position,
  market,
  onClaim,
  showClaimButton = true,
  className,
}: PositionCardProps) {
  const isProfitable = position.pnl >= 0;
  const isResolved = market.status === MarketStatus.Resolved;
  const isInvalid = market.status === MarketStatus.Invalid;
  
  // Determine if user can claim winnings
  const hasWinningShares = isResolved && (
    (market.winningOutcome === Outcome.Yes && position.yesShares > 0) ||
    (market.winningOutcome === Outcome.No && position.noShares > 0)
  );
  
  const winningShares = hasWinningShares
    ? market.winningOutcome === Outcome.Yes
      ? position.yesShares
      : position.noShares
    : 0;
  
  const claimableAmount = winningShares; // Each winning share pays $1

  const timeRemaining = market.endTimestamp > new Date()
    ? formatDistanceToNow(market.endTimestamp, { addSuffix: true })
    : "Ended";

  return (
    <Card 
      className={cn(
        "group transition-all duration-200 hover:shadow-lg",
        hasWinningShares && "ring-2 ring-emerald-500/50",
        isInvalid && "opacity-75",
        className
      )}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left: Market Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">
                {market.category}
              </Badge>
              <Badge
                variant={
                  market.status === MarketStatus.Active ? "success" :
                  market.status === MarketStatus.Resolved ? "default" : "danger"
                }
                className="text-[10px]"
              >
                {market.status}
              </Badge>
              {hasWinningShares && (
                <Badge variant="success" className="text-[10px] bg-emerald-500">
                  <Trophy className="h-2.5 w-2.5 mr-1" />
                  Winner!
                </Badge>
              )}
              {isInvalid && (
                <Badge variant="danger" className="text-[10px]">
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                  Invalid
                </Badge>
              )}
            </div>
            
            <Link href={`/market/${market.marketId}`}>
              <h3 className="font-semibold text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
                {market.question}
              </h3>
            </Link>

            {/* Position Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm mt-3">
              <div>
                <span className="text-muted-foreground">Yes Shares</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="font-medium">{position.yesShares.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">No Shares</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="font-medium">{position.noShares.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Invested</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    ${(position.totalInvested / 1_000_000).toFixed(2)}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">
                  {isResolved ? "Resolution" : "Ends"}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-xs">{timeRemaining}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: P&L and Actions */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6">
            {/* P&L Display */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-0.5">
                {isResolved ? "Final P&L" : "Unrealized P&L"}
              </div>
              <div
                className={cn(
                  "text-lg sm:text-xl font-bold",
                  isProfitable ? "text-emerald-500" : "text-red-500"
                )}
              >
                {isProfitable ? "+" : ""}
                ${(position.pnl / 1_000_000).toFixed(2)}
              </div>
              <div
                className={cn(
                  "text-xs",
                  isProfitable ? "text-emerald-500/80" : "text-red-500/80"
                )}
              >
                {isProfitable ? "+" : ""}
                {position.pnlPercentage.toFixed(2)}%
              </div>
            </div>

            {/* Current Value */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Current Value</div>
              <div className="text-sm font-medium">
                ${(position.currentValue / 1_000_000).toFixed(2)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasWinningShares && showClaimButton && onClaim && (
                <ClaimButton
                  marketId={market.marketId}
                  claimableAmount={claimableAmount}
                  onClaim={onClaim}
                />
              )}
              
              <Link href={`/market/${market.marketId}`}>
                <Button variant="ghost" size="sm" className="h-8">
                  <span className="hidden sm:inline mr-1">View</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Winning Outcome Banner */}
        {isResolved && market.winningOutcome && (
          <div className={cn(
            "mt-4 p-3 rounded-lg text-center text-sm",
            hasWinningShares 
              ? "bg-emerald-500/10 border border-emerald-500/20" 
              : "bg-muted"
          )}>
            <span className="text-muted-foreground">Winning Outcome: </span>
            <Badge 
              variant={market.winningOutcome === Outcome.Yes ? "success" : "danger"}
              className="ml-1"
            >
              {market.winningOutcome}
            </Badge>
            {hasWinningShares && (
              <span className="ml-2 text-emerald-500 font-medium">
                You won ${claimableAmount.toFixed(2)}!
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Skeleton loading state
export function PositionCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted rounded" />
              <div className="h-5 w-14 bg-muted rounded" />
            </div>
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-4 w-12 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="h-3 w-20 bg-muted rounded ml-auto" />
            <div className="h-6 w-24 bg-muted rounded ml-auto" />
            <div className="h-3 w-12 bg-muted rounded ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
