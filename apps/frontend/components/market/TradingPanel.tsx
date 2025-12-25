"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Outcome } from "@/lib/types";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { toast } from "sonner";

interface TradingPanelProps {
  marketId: number;
  yesPrice: number;
  noPrice: number;
}

export function TradingPanel({ marketId, yesPrice, noPrice }: TradingPanelProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>(Outcome.Yes);
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { buyShares } = useSolana();

  const estimatedShares = amount 
    ? parseFloat(amount) / (selectedOutcome === Outcome.Yes ? yesPrice : noPrice)
    : 0;

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      const tx = await buyShares(marketId, selectedOutcome, parseFloat(amount) * 1_000_000);
      toast.success(`Successfully bought ${estimatedShares.toFixed(2)} ${selectedOutcome} shares!`, {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Outcome Selection */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={selectedOutcome === Outcome.Yes ? "success" : "outline"}
            className="h-20 flex-col gap-2"
            onClick={() => setSelectedOutcome(Outcome.Yes)}
          >
            <TrendingUp className="h-5 w-5" />
            <div>
              <div className="text-xs">Yes</div>
              <div className="font-bold">${yesPrice.toFixed(2)}</div>
            </div>
          </Button>
          <Button
            variant={selectedOutcome === Outcome.No ? "danger" : "outline"}
            className="h-20 flex-col gap-2"
            onClick={() => setSelectedOutcome(Outcome.No)}
          >
            <TrendingDown className="h-5 w-5" />
            <div>
              <div className="text-xs">No</div>
              <div className="font-bold">${noPrice.toFixed(2)}</div>
            </div>
          </Button>
        </div>

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
          />
        </div>

        {/* Estimated Shares */}
        {amount && parseFloat(amount) > 0 && (
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">You'll receive</span>
              <span className="font-medium">{estimatedShares.toFixed(4)} shares</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg. price</span>
              <span className="font-medium">
                ${(parseFloat(amount) / estimatedShares).toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max payout</span>
              <span className="font-medium text-green-600">
                ${estimatedShares.toFixed(2)} USDC
              </span>
            </div>
          </div>
        )}

        {/* Buy Button */}
        <Button 
          className="w-full" 
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
            `Buy ${selectedOutcome}`
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Prices update based on liquidity pool ratios
        </p>
      </CardContent>
    </Card>
  );
}
