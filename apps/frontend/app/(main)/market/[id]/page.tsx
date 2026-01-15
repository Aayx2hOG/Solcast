"use client";

import { use, useMemo } from "react";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WobbleCardSimple } from "@/components/ui/wobble-card";
import { Badge } from "@/components/ui/badge";
import { TradingPanel } from "@/components/market/TradingPanel";
import { PriceChart } from "@/components/charts/PriceChart";
import { Clock, ExternalLink, TrendingUp, Users, DollarSign } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PricePoint } from "@/lib/types";

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { markets } = useSolana();
  
  const market = useMemo(() => {
    return markets.find((m) => m.marketId === parseInt(id));
  }, [markets, id]);

  const chartData: PricePoint[] = useMemo(() => {
    if (!market) return [];
    
    const now = Date.now();
    const points: PricePoint[] = [];
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = now - i * 60 * 60 * 1000;
      const variance = (Math.random() - 0.5) * 0.1;
      const yesPrice = Math.max(0.1, Math.min(0.9, market.yesPrice + variance));
      
      points.push({
        timestamp,
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: Math.random() * 10000,
      });
    }
    
    return points;
  }, [market]);

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Market not found</p>
        </Card>
      </div>
    );
  }

  const timeRemaining = formatDistanceToNow(market.endTimestamp, { addSuffix: true });
  const yesPercentage = (market.yesPrice * 100).toFixed(1);
  const noPercentage = (market.noPrice * 100).toFixed(1);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
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
        </div>
        <h1 className="text-4xl font-bold mb-3">{market.question}</h1>
        <p className="text-lg text-muted-foreground">{market.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <WobbleCardSimple glowColor="34, 197, 94" className="p-5">
          <span className="text-sm font-medium text-white/60">Total Volume</span>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="text-2xl font-bold text-white">
              ${(market.totalVolume / 1_000_000).toFixed(2)}M
            </span>
          </div>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="168, 85, 247" className="p-5">
          <span className="text-sm font-medium text-white/60">Liquidity</span>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="h-4 w-4 text-purple-400" />
            <span className="text-2xl font-bold text-white">
              ${((market.yesLiquidity + market.noLiquidity) / 1_000_000).toFixed(2)}M
            </span>
          </div>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="59, 130, 246" className="p-5">
          <span className="text-sm font-medium text-white/60">Total Shares</span>
          <div className="flex items-center gap-2 mt-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-2xl font-bold text-white">
              {((market.totalYesShares + market.totalNoShares) / 1_000_000).toFixed(2)}M
            </span>
          </div>
        </WobbleCardSimple>

        <WobbleCardSimple glowColor="249, 115, 22" className="p-5">
          <span className="text-sm font-medium text-white/60">Time Remaining</span>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="text-2xl font-bold text-white">{timeRemaining}</span>
          </div>
        </WobbleCardSimple>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Prices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Yes</div>
                  <div className="text-4xl font-bold text-green-600">{yesPercentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {market.totalYesShares.toLocaleString()} shares
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="text-sm text-muted-foreground">No</div>
                  <div className="text-4xl font-bold text-red-600">{noPercentage}%</div>
                  <div className="text-sm text-muted-foreground">
                    {market.totalNoShares.toLocaleString()} shares
                  </div>
                </div>
              </div>
              <div className="mt-4 relative h-2 rounded-full bg-red-200 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-green-600 transition-all"
                  style={{ width: `${yesPercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <PriceChart data={chartData} />

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

        <div className="space-y-6">
          {market.status === "Active" ? (
            <TradingPanel
              marketId={market.marketId}
              yesPrice={market.yesPrice}
              noPrice={market.noPrice}
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
  );
}
