"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Clock, ArrowRightLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  percentage: number;
}

interface RecentTrade {
  id: string;
  outcome: "Yes" | "No";
  type: "buy" | "sell";
  shares: number;
  price: number;
  total: number;
  timestamp: Date;
  trader?: string;
}

interface OrderBookProps {
  yesPrice: number;
  noPrice: number;
  yesLiquidity: number;
  noLiquidity: number;
  recentTrades?: RecentTrade[];
  className?: string;
}

// Generate mock order book levels (in production, this would come from the backend)
function generateOrderLevels(
  basePrice: number,
  totalLiquidity: number,
  side: "yes" | "no"
): OrderBookEntry[] {
  const levels: OrderBookEntry[] = [];
  const spreadFactor = side === "yes" ? -1 : 1;
  
  for (let i = 0; i < 8; i++) {
    const priceOffset = (i + 1) * 0.01 * spreadFactor;
    const price = Math.max(0.01, Math.min(0.99, basePrice + priceOffset));
    const quantity = totalLiquidity * (0.3 - i * 0.03) + Math.random() * 1000;
    
    levels.push({
      price,
      quantity: Math.round(quantity),
      total: Math.round(price * quantity),
      percentage: (i + 1) * 12,
    });
  }
  
  return levels;
}

export function OrderBook({
  yesPrice,
  noPrice,
  yesLiquidity,
  noLiquidity,
  recentTrades = [],
  className,
}: OrderBookProps) {
  const yesLevels = generateOrderLevels(yesPrice, yesLiquidity, "yes");
  const noLevels = generateOrderLevels(noPrice, noLiquidity, "no");

  const totalLiquidity = yesLiquidity + noLiquidity;

  return (
    <Card className={className}>
      <Tabs defaultValue="orderbook" className="w-full">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Market Depth</CardTitle>
            <TabsList className="h-8">
              <TabsTrigger value="orderbook" className="text-xs">
                Order Book
              </TabsTrigger>
              <TabsTrigger value="trades" className="text-xs">
                Recent Trades
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <TabsContent value="orderbook" className="mt-0">
            {/* Liquidity Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-muted/50">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Yes Liquidity</div>
                <div className="text-lg font-bold text-emerald-500">
                  ${(yesLiquidity / 1_000_000).toFixed(2)}M
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">No Liquidity</div>
                <div className="text-lg font-bold text-red-500">
                  ${(noLiquidity / 1_000_000).toFixed(2)}M
                </div>
              </div>
            </div>

            {/* Order Book Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Yes Side */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">Yes</span>
                  <Badge variant="success" className="text-[10px] ml-auto">
                    ${yesPrice.toFixed(2)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground px-1">
                    <span>Price</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Total</span>
                  </div>
                  {yesLevels.map((level, idx) => (
                    <div
                      key={idx}
                      className="relative grid grid-cols-3 gap-1 text-xs py-1 px-1 rounded"
                    >
                      <div
                        className="absolute inset-0 bg-emerald-500/10 rounded"
                        style={{ width: `${level.percentage}%` }}
                      />
                      <span className="relative text-emerald-500 font-medium">
                        ${level.price.toFixed(2)}
                      </span>
                      <span className="relative text-center">
                        {level.quantity.toLocaleString()}
                      </span>
                      <span className="relative text-right text-muted-foreground">
                        ${(level.total / 1000).toFixed(1)}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* No Side */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">No</span>
                  <Badge variant="danger" className="text-[10px] ml-auto">
                    ${noPrice.toFixed(2)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground px-1">
                    <span>Price</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Total</span>
                  </div>
                  {noLevels.map((level, idx) => (
                    <div
                      key={idx}
                      className="relative grid grid-cols-3 gap-1 text-xs py-1 px-1 rounded"
                    >
                      <div
                        className="absolute inset-0 bg-red-500/10 rounded right-0"
                        style={{ width: `${level.percentage}%`, marginLeft: "auto" }}
                      />
                      <span className="relative text-red-500 font-medium">
                        ${level.price.toFixed(2)}
                      </span>
                      <span className="relative text-center">
                        {level.quantity.toLocaleString()}
                      </span>
                      <span className="relative text-right text-muted-foreground">
                        ${(level.total / 1000).toFixed(1)}k
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Spread Indicator */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-xs text-muted-foreground mb-1">Market Spread</div>
              <div className="text-lg font-bold">
                {((1 - yesPrice - noPrice) * 100).toFixed(2)}%
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trades" className="mt-0">
            <ScrollArea className="h-[400px]">
              {recentTrades.length > 0 ? (
                <div className="space-y-2">
                  {recentTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg",
                        trade.type === "buy" ? "bg-emerald-500/5" : "bg-red-500/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "p-1.5 rounded",
                            trade.type === "buy"
                              ? "bg-emerald-500/10"
                              : "bg-red-500/10"
                          )}
                        >
                          {trade.type === "buy" ? (
                            <TrendingUp
                              className={cn(
                                "h-3 w-3",
                                trade.outcome === "Yes"
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              )}
                            />
                          ) : (
                            <TrendingDown
                              className={cn(
                                "h-3 w-3",
                                trade.outcome === "Yes"
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              )}
                            />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium capitalize">
                              {trade.type}
                            </span>
                            <Badge
                              variant={trade.outcome === "Yes" ? "success" : "danger"}
                              className="text-[10px]"
                            >
                              {trade.outcome}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNow(trade.timestamp, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">
                          {trade.shares.toLocaleString()} shares
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          @ ${trade.price.toFixed(2)} = ${trade.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ArrowRightLeft className="h-8 w-8 mb-2" />
                  <p className="text-sm">No recent trades</p>
                  <p className="text-xs">Be the first to trade!</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
