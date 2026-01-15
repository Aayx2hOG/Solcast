"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { MarketCard } from "@/components/market/MarketCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { MarketCategory, MarketStatus } from "@/lib/types";

export default function ExplorerPage() {
  const { markets, isLoading } = useSolana();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<MarketStatus | "All">("All");
  const [sortBy, setSortBy] = useState<"volume" | "newest" | "ending_soon">("volume");

  const filteredMarkets = useMemo(() => {
    let filtered = markets;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((m) => m.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== "All") {
      filtered = filtered.filter((m) => m.status === selectedStatus);
    }

    // Sort
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Market Explorer</h1>
        <p className="text-muted-foreground">
          Browse and discover prediction markets across all categories
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Category</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category as MarketCategory | "All")}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Badge
                key={status}
                variant={selectedStatus === status ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedStatus(status as MarketStatus | "All")}
              >
                {status}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Sort By</span>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "volume" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("volume")}
            >
              Highest Volume
            </Button>
            <Button
              variant={sortBy === "newest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("newest")}
            >
              Newest
            </Button>
            <Button
              variant={sortBy === "ending_soon" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("ending_soon")}
            >
              Ending Soon
            </Button>
          </div>
        </div>
      </Card>

      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""} found
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.marketId} market={market} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No markets found matching your criteria.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
