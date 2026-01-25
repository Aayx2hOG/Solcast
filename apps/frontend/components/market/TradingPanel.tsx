"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Outcome, UserPosition } from "@/lib/types";
import { TrendingUp, TrendingDown, Loader2, Settings2, AlertTriangle, ArrowUpDown } from "lucide-react";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TradeMode = "buy" | "sell";

interface TradingPanelProps {
  marketId: number;
  yesPrice: number;
  noPrice: number;
  userPosition?: UserPosition;
  className?: string;
}

export function TradingPanel({ 
  marketId, 
  yesPrice, 
  noPrice, 
  userPosition,
  className 
}: TradingPanelProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>(Outcome.Yes);
  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState<string>("");
  const [shares, setShares] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSlippage, setShowSlippage] = useState(false);
  const [slippage, setSlippage] = useState<string>("0.5");
  
  const { buyShares, sellShares } = useSolana();

  const currentPrice = selectedOutcome === Outcome.Yes ? yesPrice : noPrice;
  
  // Calculate available shares for selling
  const availableShares = useMemo(() => {
    if (!userPosition) return 0;
    return selectedOutcome === Outcome.Yes 
      ? userPosition.yesShares 
      : userPosition.noShares;
  }, [userPosition, selectedOutcome]);

  // Estimated shares for buy mode
  const estimatedSharesBuy = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    return parseFloat(amount) / currentPrice;
  }, [amount, currentPrice]);

  // Estimated return for sell mode
  const estimatedReturnSell = useMemo(() => {
    if (!shares || parseFloat(shares) <= 0) return 0;
    const shareCount = parseFloat(shares);
    const slippageMultiplier = 1 - (parseFloat(slippage) / 100);
    return shareCount * currentPrice * slippageMultiplier;
  }, [shares, currentPrice, slippage]);

  // Min return after slippage for buy
  const minSharesAfterSlippage = useMemo(() => {
    const slippageMultiplier = 1 - (parseFloat(slippage) / 100);
    return estimatedSharesBuy * slippageMultiplier;
  }, [estimatedSharesBuy, slippage]);

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const tx = await buyShares(marketId, selectedOutcome, parseFloat(amount) * 1_000_000);
      toast.success(`Successfully bought ${estimatedSharesBuy.toFixed(2)} ${selectedOutcome} shares!`, {
        description: `Transaction: ${tx.slice(0, 8)}...`,
      });
      setAmount("");
    } catch (error: any) {
      toast.error("Transaction failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async () => {
    if (!shares || parseFloat(shares) <= 0) {
      toast.error("Please enter a valid number of shares");
      return;
    }

    const shareCount = parseFloat(shares);
    if (shareCount > availableShares) {
      toast.error("Insufficient shares", {
        description: `You only have ${availableShares.toFixed(2)} ${selectedOutcome} shares`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const tx = await sellShares(marketId, selectedOutcome, shareCount * 1_000_000);
      toast.success(`Successfully sold ${shareCount.toFixed(2)} ${selectedOutcome} shares!`, {
        description: `Received ~$${estimatedReturnSell.toFixed(2)} USDC`,
      });
      setShares("");
    } catch (error: any) {
      toast.error("Transaction failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxShares = () => {
    setShares(availableShares.toString());
  };

  const presetAmounts = [10, 25, 50, 100];
  const presetSlippages = ["0.1", "0.5", "1.0", "2.0"];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trade</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSlippage(!showSlippage)}
            className="h-8 w-8 p-0"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Slippage Settings */}
        {showSlippage && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Max Slippage</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 h-7 text-sm text-right"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex gap-1">
              {presetSlippages.map((s) => (
                <Button
                  key={s}
                  variant={slippage === s ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => setSlippage(s)}
                >
                  {s}%
                </Button>
              ))}
            </div>
            {parseFloat(slippage) > 2 && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                <span>High slippage tolerance</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
          <Button
            variant={tradeMode === "buy" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTradeMode("buy")}
            className={cn(
              "relative",
              tradeMode === "buy" && "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            Buy
          </Button>
          <Button
            variant={tradeMode === "sell" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTradeMode("sell")}
            className={cn(
              "relative",
              tradeMode === "sell" && "bg-red-600 hover:bg-red-700"
            )}
          >
            Sell
          </Button>
        </div>

        {/* Outcome Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedOutcome === Outcome.Yes ? "success" : "outline"}
            className={cn(
              "h-16 sm:h-20 flex-col gap-1 sm:gap-2 transition-all",
              selectedOutcome === Outcome.Yes && "ring-2 ring-emerald-500/50"
            )}
            onClick={() => setSelectedOutcome(Outcome.Yes)}
          >
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <div>
              <div className="text-[10px] sm:text-xs">Yes</div>
              <div className="font-bold text-sm sm:text-base">${yesPrice.toFixed(2)}</div>
            </div>
          </Button>
          <Button
            variant={selectedOutcome === Outcome.No ? "danger" : "outline"}
            className={cn(
              "h-16 sm:h-20 flex-col gap-1 sm:gap-2 transition-all",
              selectedOutcome === Outcome.No && "ring-2 ring-red-500/50"
            )}
            onClick={() => setSelectedOutcome(Outcome.No)}
          >
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
            <div>
              <div className="text-[10px] sm:text-xs">No</div>
              <div className="font-bold text-sm sm:text-base">${noPrice.toFixed(2)}</div>
            </div>
          </Button>
        </div>

        {/* User Position Display */}
        {userPosition && (availableShares > 0 || tradeMode === "sell") && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
            Your {selectedOutcome} shares: <span className="font-medium text-foreground">{availableShares.toFixed(2)}</span>
          </div>
        )}

        {/* Buy Mode */}
        {tradeMode === "buy" && (
          <>
            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USDC)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                className="text-lg"
              />
              <div className="flex gap-1 flex-wrap">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[60px] h-7 text-xs"
                    onClick={() => setAmount(preset.toString())}
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Estimated Shares */}
            {amount && parseFloat(amount) > 0 && (
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. shares</span>
                  <span className="font-medium">{estimatedSharesBuy.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min. shares (after slippage)</span>
                  <span className="font-medium">{minSharesAfterSlippage.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg. price</span>
                  <span className="font-medium">
                    ${currentPrice.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Max payout</span>
                  <span className="font-medium text-green-600">
                    ${estimatedSharesBuy.toFixed(2)} USDC
                  </span>
                </div>
              </div>
            )}

            {/* Buy Button */}
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700" 
              size="lg"
              onClick={handleBuy}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Buy {selectedOutcome}
                </>
              )}
            </Button>
          </>
        )}

        {/* Sell Mode */}
        {tradeMode === "sell" && (
          <>
            {/* Shares Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Shares to Sell</label>
                {availableShares > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs"
                    onClick={handleMaxShares}
                  >
                    Max: {availableShares.toFixed(2)}
                  </Button>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                min="0"
                max={availableShares}
                step="0.01"
                className="text-lg"
              />
              {availableShares > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[60px] h-7 text-xs"
                      onClick={() => setShares((availableShares * percent / 100).toFixed(2))}
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated Return */}
            {shares && parseFloat(shares) > 0 && (
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shares to sell</span>
                  <span className="font-medium">{parseFloat(shares).toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current price</span>
                  <span className="font-medium">${currentPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Est. return (after slippage)</span>
                  <span className="font-medium text-green-600">
                    ${estimatedReturnSell.toFixed(2)} USDC
                  </span>
                </div>
                {parseFloat(shares) > availableShares && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Exceeds available shares</span>
                  </div>
                )}
              </div>
            )}

            {/* Sell Button */}
            <Button 
              className="w-full bg-red-600 hover:bg-red-700" 
              size="lg"
              onClick={handleSell}
              disabled={
                isLoading || 
                !shares || 
                parseFloat(shares) <= 0 || 
                parseFloat(shares) > availableShares ||
                availableShares === 0
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : availableShares === 0 ? (
                "No shares to sell"
              ) : (
                <>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Sell {selectedOutcome}
                </>
              )}
            </Button>
          </>
        )}

        <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
          Prices update based on liquidity pool ratios. Slippage: {slippage}%
        </p>
      </CardContent>
    </Card>
  );
}
