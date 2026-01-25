"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TradingChart, MiniChart } from "@/components/charts/TradingChart";
import { useConfetti } from "@/components/ui/confetti";
import { Outcome, UserPosition } from "@/lib/types";
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Settings2, 
  AlertTriangle,
  ChevronDown,
  Zap,
  Info
} from "lucide-react";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TradeMode = "buy" | "sell";

interface TradingPanelEnhancedProps {
  marketId: number;
  marketQuestion: string;
  yesPrice: number;
  noPrice: number;
  userPosition?: UserPosition;
  priceHistory?: { time: string; value: number }[];
  className?: string;
}

export function TradingPanelEnhanced({ 
  marketId,
  marketQuestion,
  yesPrice, 
  noPrice, 
  userPosition,
  priceHistory,
  className 
}: TradingPanelEnhancedProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>(Outcome.Yes);
  const [tradeMode, setTradeMode] = useState<TradeMode>("buy");
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slippage, setSlippage] = useState<string>("0.5");
  
  const { buyShares, sellShares } = useSolana();
  const { sideCanons } = useConfetti();

  const currentPrice = selectedOutcome === Outcome.Yes ? yesPrice : noPrice;
  
  // Quick amount buttons
  const quickAmounts = [10, 25, 50, 100];

  // Calculate available shares for selling
  const availableShares = useMemo(() => {
    if (!userPosition) return 0;
    return selectedOutcome === Outcome.Yes 
      ? userPosition.yesShares 
      : userPosition.noShares;
  }, [userPosition, selectedOutcome]);

  // Estimated shares for buy mode
  const estimatedShares = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    return parseFloat(amount) / currentPrice;
  }, [amount, currentPrice]);

  // Potential payout
  const potentialPayout = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    return estimatedShares; // Each share pays out $1 if correct
  }, [estimatedShares]);

  // Potential profit
  const potentialProfit = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    return potentialPayout - parseFloat(amount);
  }, [potentialPayout, amount]);

  // ROI percentage
  const roi = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    return (potentialProfit / parseFloat(amount)) * 100;
  }, [potentialProfit, amount]);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      if (tradeMode === "buy") {
        const tx = await buyShares(marketId, selectedOutcome, parseFloat(amount) * 1_000_000);
        toast.success(`Successfully bought ${estimatedShares.toFixed(2)} ${selectedOutcome} shares!`, {
          description: `Transaction: ${tx.slice(0, 8)}...`,
        });
        // Fire confetti on successful trade!
        sideCanons();
      } else {
        const tx = await sellShares(marketId, selectedOutcome, parseFloat(amount));
        toast.success(`Successfully sold shares!`, {
          description: `Transaction: ${tx.slice(0, 8)}...`,
        });
      }
      setAmount("");
    } catch (error: any) {
      toast.error("Transaction failed", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock chart data if not provided
  const chartData = useMemo(() => {
    if (priceHistory) return priceHistory;
    
    // Generate mock data
    const data = [];
    let price = 0.4 + Math.random() * 0.2;
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      price = Math.max(0.1, Math.min(0.9, price + (Math.random() - 0.5) * 0.05));
      data.push({
        time: date.toISOString().split('T')[0],
        value: price,
      });
    }
    // End with current price
    data[data.length - 1].value = yesPrice;
    return data;
  }, [priceHistory, yesPrice]);

  return (
    <Card className={cn("overflow-hidden bg-card/80 backdrop-blur-sm border-white/[0.06]", className)}>
      {/* Chart Section */}
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-white/90 line-clamp-1">{marketQuestion}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "text-lg font-bold tabular-nums",
                selectedOutcome === Outcome.Yes ? "text-emerald-400" : "text-red-400"
              )}>
                {(currentPrice * 100).toFixed(1)}%
              </span>
              <Badge variant="secondary" className="text-[9px]">
                {selectedOutcome}
              </Badge>
            </div>
          </div>
        </div>
        
        <TradingChart 
          data={chartData}
          height={180}
          lineColor={selectedOutcome === Outcome.Yes ? "#22c55e" : "#ef4444"}
          areaTopColor={selectedOutcome === Outcome.Yes ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}
          areaBottomColor="rgba(0,0,0,0)"
        />
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Outcome Selection */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedOutcome(Outcome.Yes)}
            className={cn(
              "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
              selectedOutcome === Outcome.Yes
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
            )}
          >
            <TrendingUp className={cn(
              "h-5 w-5 mb-1",
              selectedOutcome === Outcome.Yes ? "text-emerald-400" : "text-white/40"
            )} />
            <span className={cn(
              "text-sm font-semibold",
              selectedOutcome === Outcome.Yes ? "text-emerald-400" : "text-white/60"
            )}>
              YES
            </span>
            <span className={cn(
              "text-lg font-bold tabular-nums",
              selectedOutcome === Outcome.Yes ? "text-emerald-400" : "text-white/40"
            )}>
              {(yesPrice * 100).toFixed(0)}¢
            </span>
            {selectedOutcome === Outcome.Yes && (
              <motion.div
                layoutId="selectedOutcome"
                className="absolute inset-0 rounded-xl border-2 border-emerald-500"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedOutcome(Outcome.No)}
            className={cn(
              "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
              selectedOutcome === Outcome.No
                ? "border-red-500/50 bg-red-500/10"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
            )}
          >
            <TrendingDown className={cn(
              "h-5 w-5 mb-1",
              selectedOutcome === Outcome.No ? "text-red-400" : "text-white/40"
            )} />
            <span className={cn(
              "text-sm font-semibold",
              selectedOutcome === Outcome.No ? "text-red-400" : "text-white/60"
            )}>
              NO
            </span>
            <span className={cn(
              "text-lg font-bold tabular-nums",
              selectedOutcome === Outcome.No ? "text-red-400" : "text-white/40"
            )}>
              {(noPrice * 100).toFixed(0)}¢
            </span>
            {selectedOutcome === Outcome.No && (
              <motion.div
                layoutId="selectedOutcome"
                className="absolute inset-0 rounded-xl border-2 border-red-500"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        </div>

        {/* Trade Mode Toggle */}
        <div className="flex rounded-lg bg-white/[0.03] p-1">
          <button
            onClick={() => setTradeMode("buy")}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              tradeMode === "buy"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/70"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeMode("sell")}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              tradeMode === "sell"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white/70"
            )}
          >
            Sell
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/60">Amount</label>
            {userPosition && (
              <span className="text-xs text-white/40">
                Available: {availableShares.toFixed(2)} shares
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-7 pr-4 h-12 text-lg font-semibold bg-white/[0.03] border-white/[0.08] focus:border-white/[0.2]"
            />
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {quickAmounts.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="flex-1 py-1.5 text-xs font-medium rounded-md bg-white/[0.03] border border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-colors"
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Trade Summary */}
        <AnimatePresence>
          {amount && parseFloat(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]"
            >
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Est. Shares</span>
                <span className="text-white font-medium tabular-nums">
                  {estimatedShares.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Avg. Price</span>
                <span className="text-white font-medium tabular-nums">
                  {(currentPrice * 100).toFixed(1)}¢
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Potential Payout</span>
                <span className="text-emerald-400 font-medium tabular-nums">
                  ${potentialPayout.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/[0.06] pt-2 mt-2">
                <span className="text-white/50">Potential Profit</span>
                <span className={cn(
                  "font-semibold tabular-nums",
                  potentialProfit >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {potentialProfit >= 0 ? "+" : ""}${potentialProfit.toFixed(2)} ({roi.toFixed(0)}%)
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Settings */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <Settings2 className="h-3 w-3" />
          Advanced
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform",
            showAdvanced && "rotate-180"
          )} />
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60">Slippage Tolerance</label>
                <div className="flex gap-2">
                  {["0.1", "0.5", "1.0", "2.0"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlippage(s)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors",
                        slippage === s
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:text-white/70"
                      )}
                    >
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trade Button */}
        <Button
          onClick={handleTrade}
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
          className={cn(
            "w-full h-12 text-base font-semibold transition-all",
            selectedOutcome === Outcome.Yes
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-red-500 hover:bg-red-600"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              {tradeMode === "buy" ? "Buy" : "Sell"} {selectedOutcome}
            </>
          )}
        </Button>

        {/* Disclaimer */}
        <p className="text-[10px] text-white/30 text-center flex items-center justify-center gap-1">
          <Info className="h-3 w-3" />
          Trading involves risk. Only trade what you can afford to lose.
        </p>
      </CardContent>
    </Card>
  );
}
