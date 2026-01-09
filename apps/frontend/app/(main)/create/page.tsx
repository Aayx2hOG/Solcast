"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MarketCategory } from "@/lib/types";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function CreateMarketPage() {
  const { connected } = useWallet();
  const { createMarket } = useSolana();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    question: "",
    description: "",
    category: MarketCategory.Other,
    endDate: "",
    endTime: "",
    resolutionDate: "",
    resolutionTime: "",
    oracleSource: "",
    initialLiquidity: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      toast.error("Please connect your wallet");
      return;
    }

    // Validation
    if (formData.question.length < 10 || formData.question.length > 200) {
      toast.error("Question must be between 10 and 200 characters");
      return;
    }

    if (formData.description.length < 20 || formData.description.length > 1000) {
      toast.error("Description must be between 20 and 1000 characters");
      return;
    }

    const initialLiquidity = parseFloat(formData.initialLiquidity);
    if (isNaN(initialLiquidity) || initialLiquidity < 1) {
      toast.error("Initial liquidity must be at least 1 USDC");
      return;
    }

    const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`).getTime() / 1000;
    const resolutionTimestamp = new Date(
      `${formData.resolutionDate}T${formData.resolutionTime}`
    ).getTime() / 1000;

    if (endTimestamp <= Date.now() / 1000) {
      toast.error("End date must be in the future");
      return;
    }

    if (resolutionTimestamp <= endTimestamp) {
      toast.error("Resolution date must be after end date");
      return;
    }

    setIsLoading(true);
    try {
      const marketId = Date.now(); // Simple ID generation
      
      const tx = await createMarket({
        marketId,
        question: formData.question,
        description: formData.description,
        category: { [formData.category.toLowerCase()]: {} },
        endTimestamp: Math.floor(endTimestamp),
        resolutionTimestamp: Math.floor(resolutionTimestamp),
        oracleSource: formData.oracleSource,
        initialLiquidity: initialLiquidity * 1_000_000,
      });

      toast.success("Market created successfully!", {
        description: `Transaction: ${tx.slice(0, 8)}...`,
      });

      // Reset form
      setFormData({
        question: "",
        description: "",
        category: MarketCategory.Other,
        endDate: "",
        endTime: "",
        resolutionDate: "",
        resolutionTime: "",
        oracleSource: "",
        initialLiquidity: "",
      });
    } catch (error: any) {
      toast.error("Failed to create market", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Please connect your wallet to create a market
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Create Market</h1>
          <p className="text-muted-foreground">
            Create a new prediction market for others to trade on
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Market Details</CardTitle>
            <CardDescription>
              Provide clear, unambiguous information about your market
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Question <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.question.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Provide detailed context about the market, resolution criteria, and data sources..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(MarketCategory).map((category) => (
                    <Badge
                      key={category}
                      variant={formData.category === category ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => setFormData({ ...formData, category })}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Trading End Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time <span className="text-red-500">*</span></label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Resolution Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.resolutionDate}
                    onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution Time <span className="text-red-500">*</span></label>
                  <Input
                    type="time"
                    value={formData.resolutionTime}
                    onChange={(e) => setFormData({ ...formData, resolutionTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Oracle/Data Source <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g., CoinGecko, Official Government Website, ESPN"
                  value={formData.oracleSource}
                  onChange={(e) => setFormData({ ...formData, oracleSource: e.target.value })}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Source that will be used to determine the outcome
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Initial Liquidity (USDC) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="1.00"
                  value={formData.initialLiquidity}
                  onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
                  min="1"
                  step="0.01"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 1 USDC. This will be split equally between Yes and No pools.
                </p>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Market...
                    </>
                  ) : (
                    "Create Market"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Important Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• Markets must have clear, objective resolution criteria</p>
            <p>• Resolution date must be within 7 days after trading ends</p>
            <p>• You'll be responsible for providing initial liquidity</p>
            <p>• You (or protocol admin) will resolve the market using the specified oracle</p>
            <p>• A small fee is collected on all trades to support the protocol</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
