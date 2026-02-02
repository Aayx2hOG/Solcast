"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { MarketCard } from "@/components/market/MarketCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Compass } from "lucide-react";
import { useState, useMemo } from "react";
import { MarketCategory, MarketStatus } from "@/lib/types";
import { motion } from "framer-motion";

export default function ExplorerPage() {
  const { markets, isLoading } = useSolana();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | "All">("All");
  const [sortBy, setSortBy] = useState<"volume" | "newest" | "ending_soon">("volume");

  const filteredMarkets = useMemo(() => {
    let filtered = markets;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter((m) => m.status === selectedStatus);
    }

    switch (sortBy) {
      case "volume":
        filtered.sort((a, b) => b.totalVolume - a.totalVolume);
        break;
      case "newest":
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case "ending_soon":
        filtered.sort((a, b) => a.endTimestamp.getTime() - b.endTimestamp.getTime());
        break;
    }

    return filtered;
  }, [markets, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const categories = ["All", ...Object.values(MarketCategory)];
  const statuses = ["All", ...Object.values(MarketStatus)];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Compass className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-lg font-medium text-white">Markets</h1>
          <p className="text-sm text-white/50">Browse prediction markets</p>
        </div>
      </motion.div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white/[0.03] border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:border-indigo-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-white/40">Category</span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === category 
                    ? "bg-indigo-500 text-white" 
                    : "bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-white/[0.08]"
                }`}
                onClick={() => setSelectedCategory(category as MarketCategory | "All")}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-white/40">Status</span>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((status) => (
              <button
                key={status}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedStatus === status 
                    ? "bg-indigo-500 text-white" 
                    : "bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-white/[0.08]"
                }`}
                onClick={() => setSelectedStatus(status as MarketStatus | "All")}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/[0.06]">
          <span className="text-xs text-white/40">Sort</span>
          <div className="flex gap-1.5">
            {[
              { key: "volume", label: "Volume" },
              { key: "newest", label: "Newest" },
              { key: "ending_soon", label: "Ending Soon" },
            ].map((option) => (
              <button
                key={option.key}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  sortBy === option.key 
                    ? "bg-emerald-500 text-white" 
                    : "bg-white/[0.03] text-white/50 hover:bg-white/[0.06] border border-white/[0.08]"
                }`}
                onClick={() => setSortBy(option.key as "volume" | "newest" | "ending_soon")}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-white/40">
        {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg animate-pulse bg-white/[0.02] border border-white/[0.06]" />
          ))}
        </div>
      ) : filteredMarkets.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredMarkets.map((market, index) => (
            <motion.div
              key={market.marketId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <MarketCard market={market} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-12 text-center">
          <Search className="h-8 w-8 mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/50">No markets found</p>
          <p className="text-xs text-white/30 mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
