"use client";

import { use, useMemo, useState, useEffect } from "react";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { useMarketPrice, useTradeFeed } from "@/lib/hooks/useWebSocket";
import { usePosition } from "@/lib/hooks/useUserPositions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WobbleCardSimple } from "@/components/ui/wobble-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradingPanel } from "@/components/market/TradingPanel";
import { PriceChart } from "@/components/charts/PriceChart";
import { OrderBook } from "@/components/market/OrderBook";
import { ClaimButton } from "@/components/market/ClaimButton";
import { 
  ChartSkeleton, 
  TradingPanelSkeleton, 
  OrderBookSkeleton 
} from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { 
  Clock, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Share2,
  AlertTriangle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PricePoint, MarketStatus, Outcome } from "@/lib/types";
import { toast } from "sonner";

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { markets, claimWinnings, userPositions, isLoading: isMarketsLoading } = useSolana();
  
  const market = useMemo(() => {
    return markets.find((m) => m.marketId === parseInt(id));
  }, [markets, id]);

  // Real-time price updates via WebSocket
  const { prices: livePrice, isConnected, error: wsError } = useMarketPrice(id);
  const { trades: recentTrades } = useTradeFeed(id);

  // User's position in this market
  const { position, hasPosition } = usePosition(parseInt(id), markets);

  // Use live prices if available, otherwise fall back to market data
  const currentYesPrice = livePrice?.yesPrice ?? market?.yesPrice ?? 0.5;
  const currentNoPrice = livePrice?.noPrice ?? market?.noPrice ?? 0.5;

  // Generate chart data with real-time updates
  const chartData: PricePoint[] = useMemo(() => {
    if (!market) return [];
    
    const now = Date.now();
    const points: PricePoint[] = [];
    
    // Generate historical data
    for (let i = 48; i >= 1; i--) {
      const timestamp = now - i * 30 * 60 * 1000; // 30 min intervals
      const variance = (Math.random() - 0.5) * 0.1;
      const yesPrice = Math.max(0.1, Math.min(0.9, (market?.yesPrice || 0.5) + variance));
      
      points.push({
        timestamp,
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: Math.random() * 10000,
      });
    }
    
    // Add current live price as the latest point
    points.push({
      timestamp: now,
      yesPrice: currentYesPrice,
      noPrice: currentNoPrice,
      volume: livePrice?.volume || 0,
    });
    
    return points;
  }, [market, currentYesPrice, currentNoPrice, livePrice]);

  // Format recent trades for OrderBook
  const formattedTrades = useMemo(() => {
    return recentTrades.map((trade, idx) => ({
      id: `${trade.timestamp}-${idx}`,
      outcome: trade.outcome,
      type: "buy" as const, // WebSocket trades are typically buys
      shares: trade.shares,
      price: trade.price,
      total: trade.shares * trade.price,
      timestamp: new Date(trade.timestamp),
    }));
  }, [recentTrades]);

  // Handle claim winnings
  const handleClaim = async (marketId: number) => {
    const tx = await claimWinnings(marketId);
    toast.success("Winnings claimed!", {
      description: `Transaction: ${tx.slice(0, 8)}...`,
    });
  };

  // Share market
  const handleShare = async () => {
    try {
      await navigator.share({
        title: market?.question,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isMarketsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-12 w-3/4 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ChartSkeleton />
            <OrderBookSkeleton />
          </div>
          <TradingPanelSkeleton />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Market Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The market you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </Card>
      </div>
    );
  }

  const timeRemaining = formatDistanceToNow(market.endTimestamp, { addSuffix: true });
  const yesPercentage = (currentYesPrice * 100).toFixed(1);
  const noPercentage = (currentNoPrice * 100).toFixed(1);
  
  const isResolved = market.status === MarketStatus.Resolved;
  const hasWinningShares = isResolved && position && (
    (market.winningOutcome === Outcome.Yes && position.yesShares > 0) ||
    (market.winningOutcome === Outcome.No && position.noShares > 0)
  );
  const claimableAmount = hasWinningShares
    ? market.winningOutcome === Outcome.Yes
      ? position!.yesShares
      : position!.noShares
    : 0;

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary">{market.category}</Badge>
            <Badge
              variant={
                market.status === "Active" ? "success" :
                market.status === "Resolved" ? "default" : "danger"
              }
            >
              {market.status}
            </Badge>
            {market.winningOutcome && (
              <Badge variant="success">Winner: {market.winningOutcome}</Badge>
            )}
            {/* WebSocket Connection Status */}
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="hidden sm:inline">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 w-8 p-0">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">{market.question}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">{market.description}</p>
        </div>

        {/* User Position Banner */}
        {hasPosition && position && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your Position</p>
                  <div className="flex items-center gap-4">
                    {position.yesShares > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">{position.yesShares.toLocaleString()} Yes</span>
                      </div>
                    )}
                    {position.noShares > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{position.noShares.toLocaleString()} No</span>
                      </div>
                    )}
                    <div className={`font-bold ${position.pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {position.pnl >= 0 ? "+" : ""}${(position.pnl / 1_000_000).toFixed(2)} P&L
                    </div>
                  </div>
                </div>
                {hasWinningShares && (
                  <ClaimButton
                    marketId={market.marketId}
                    claimableAmount={claimableAmount}
                    onClaim={handleClaim}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <WobbleCardSimple glowColor="34, 197, 94" className="p-4 sm:p-5">
            <span className="text-xs sm:text-sm font-medium text-white/60">Total Volume</span>
            <div className="flex items-center gap-2 mt-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-xl sm:text-2xl font-bold text-white">
                ${(market.totalVolume / 1_000_000).toFixed(2)}M
              </span>
            </div>
          </WobbleCardSimple>

          <WobbleCardSimple glowColor="168, 85, 247" className="p-4 sm:p-5">
            <span className="text-xs sm:text-sm font-medium text-white/60">Liquidity</span>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-xl sm:text-2xl font-bold text-white">
                ${((market.yesLiquidity + market.noLiquidity) / 1_000_000).toFixed(2)}M
              </span>
            </div>
          </WobbleCardSimple>

        <WobbleCardSimple glowColor="59, 130, 246" className="p-4 sm:p-5">
          <span className="text-xs sm:text-sm font-medium text-white/60">Total Shares</span>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xl sm:text-2xl font-bold text-white">
              {((market.totalYesShares + market.totalNoShares) / 1_000_000).toFixed(2)}M
            </span>
          </div>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="249, 115, 22" className="p-4 sm:p-5">
          <span className="text-xs sm:text-sm font-medium text-white/60">Time Remaining</span>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="text-lg sm:text-2xl font-bold text-white">{timeRemaining}</span>
          </div>
        </WobbleCardSimple>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Current Prices Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Prices</CardTitle>
                {isConnected && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Yes</div>
                  <div className="text-3xl sm:text-4xl font-bold text-green-600">{yesPercentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {market.totalYesShares.toLocaleString()} shares
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="text-sm text-muted-foreground">No</div>
                  <div className="text-3xl sm:text-4xl font-bold text-red-600">{noPercentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {market.totalNoShares.toLocaleString()} shares
                  </div>
                </div>
              </div>
              <div className="mt-4 relative h-3 rounded-full bg-red-200 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Price Chart */}
          <PriceChart data={chartData} />

          {/* Order Book */}
          <OrderBook
            yesPrice={currentYesPrice}
            noPrice={currentNoPrice}
            yesLiquidity={market.yesLiquidity}
            noLiquidity={market.noLiquidity}
            recentTrades={formattedTrades}
          />

          {/* Market Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Market Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{format(market.createdAt, "PPP")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Ends:</span>
                  <p className="font-medium">{format(market.endTimestamp, "PPP")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Resolution:</span>
                  <p className="font-medium">{format(market.resolutionTimestamp, "PPP")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Oracle:</span>
                  <p className="font-medium">{market.oracleSource}</p>
                </div>
              </div>
              
              {market.authority && (
                <div className="pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Market Creator:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {market.authority.toBase58().slice(0, 8)}...
                      {market.authority.toBase58().slice(-8)}
                    </code>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trading Panel Section */}
        <div className="space-y-6">
          {market.status === "Active" ? (
            <TradingPanel
              marketId={market.marketId}
              yesPrice={currentYesPrice}
              noPrice={currentNoPrice}
              userPosition={position}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Market {market.status}</CardTitle>
                <CardDescription>
                  {market.status === "Resolved" && market.winningOutcome
                    ? `This market has been resolved. ${market.winningOutcome} won!`
                    : "This market is no longer active."}
                </CardDescription>
              </CardHeader>
              {hasWinningShares && (
                <CardContent>
                  <ClaimButton
                    marketId={market.marketId}
                    claimableAmount={claimableAmount}
                    onClaim={handleClaim}
                    className="w-full"
                  />
                </CardContent>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                Purchase Yes or No shares based on your prediction. Prices reflect the market's
                collective belief in each outcome.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Buy shares at current market price</li>
                <li>• Sell anytime before market closes</li>
                <li>• Winning shares pay out $1 each</li>
                <li>• Small fee on each trade</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
