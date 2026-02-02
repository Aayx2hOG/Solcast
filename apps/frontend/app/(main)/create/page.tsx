"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketCategory } from "@/lib/types";
import { useSolana } from "@/lib/contexts/SolanaContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2, Wallet, Sparkles, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
      const marketId = Date.now();
      
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-white/[0.02] border-white/[0.06] p-12 text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
            <Wallet className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-lg font-medium text-white mb-2">Connect Wallet</h2>
          <p className="text-sm text-white/50">Connect your wallet to create a market</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-xl mx-auto space-y-5">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Plus className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-white">Create Market</h1>
            <p className="text-sm text-white/50">Launch a new prediction market</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardHeader className="pb-0 pt-5 px-5">
              <p className="text-xs text-white/40">Fill in the market details below</p>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">
                    Question <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="Will Bitcoin reach $100,000 by end of 2025?"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    maxLength={200}
                    required
                    className="h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:border-indigo-500/50 focus:ring-0"
                  />
                  <p className="text-xs text-white/30">{formData.question.length}/200</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 resize-none"
                    placeholder="Provide detailed resolution criteria..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    maxLength={1000}
                    required
                  />
                  <p className="text-xs text-white/30">{formData.description.length}/1000</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(MarketCategory).map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          formData.category === category 
                            ? "bg-indigo-500 text-white" 
                            : "bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-white/[0.08]"
                        }`}
                        onClick={() => setFormData({ ...formData, category })}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">
                      Trading Ends <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm focus:border-indigo-500/50 focus:ring-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">Time <span className="text-red-400">*</span></label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                      className="h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm focus:border-indigo-500/50 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">
                      Resolution Date <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.resolutionDate}
                      onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                      required
                      className="h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm focus:border-indigo-500/50 focus:ring-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-white/70">Time <span className="text-red-400">*</span></label>
                    <Input
                      type="time"
                      value={formData.resolutionTime}
                      onChange={(e) => setFormData({ ...formData, resolutionTime: e.target.value })}
                      required
                      className="h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm focus:border-indigo-500/50 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">
                    Oracle Source <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="e.g., CoinGecko, ESPN, Official Website"
                    value={formData.oracleSource}
                    onChange={(e) => setFormData({ ...formData, oracleSource: e.target.value })}
                    maxLength={100}
                    required
                    className="h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:border-indigo-500/50 focus:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/70">
                    Initial Liquidity (USDC) <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="10.00"
                    value={formData.initialLiquidity}
                    onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
                    min="1"
                    step="0.01"
                    required
                    className="h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:border-indigo-500/50 focus:ring-0"
                  />
                  <p className="text-xs text-white/30">Minimum 1 USDC, split between Yes/No pools</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Market
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <Info className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs text-white/40 space-y-1">
            <p>• Questions must have clear, objective resolution criteria</p>
            <p>• Resolution must occur within 7 days after trading ends</p>
            <p>• You are responsible for resolving the market truthfully</p>
          </div>
        </div>
      </div>
    </div>
  );
}
