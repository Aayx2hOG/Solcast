"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { MarketCardEnhanced, MarketCardCompact } from "@/components/market/MarketCardEnhanced";
import { Button } from "@/components/ui/button";
import { HeroSection, FeaturesSection } from "@/components/home/HeroSection";
import { LiveActivityFeed } from "@/components/ui/live-activity-feed";
import { 
  TrendingUp, 
  Flame, 
  Sparkles, 
  Clock,
  ChevronRight,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const { markets, isLoading } = useSolana();

  const stats = useMemo(() => {
    const totalVolume = markets.reduce((sum, m) => sum + m.totalVolume, 0);
    const activeMarkets = markets.filter((m) => m.status === "Active").length;
    const totalLiquidity = markets.reduce(
      (sum, m) => sum + m.yesLiquidity + m.noLiquidity,
      0
    );
    
    return {
      totalVolume: (totalVolume / 1_000_000).toFixed(2),
      activeMarkets,
      totalLiquidity: (totalLiquidity / 1_000_000).toFixed(2),
      totalMarkets: markets.length,
    };
  }, [markets]);

  const featuredMarkets = useMemo(() => {
    return markets
      .filter((m) => m.status === "Active")
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 6);
  }, [markets]);

  const trendingMarkets = useMemo(() => {
    return markets
      .filter((m) => m.status === "Active" && m.volume24h)
      .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
      .slice(0, 5);
  }, [markets]);

  const newMarkets = useMemo(() => {
    return markets
      .filter((m) => m.status === "Active")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [markets]);

  const endingSoonMarkets = useMemo(() => {
    const now = new Date();
    return markets
      .filter((m) => m.status === "Active" && new Date(m.endTimestamp) > now)
      .sort((a, b) => new Date(a.endTimestamp).getTime() - new Date(b.endTimestamp).getTime())
      .slice(0, 4);
  }, [markets]);

  return (
    <div className="relative">
      <HeroSection stats={stats} />
      <FeaturesSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-white">Featured</h2>
                  <p className="text-xs text-white/40">Highest volume</p>
                </div>
              </div>
              <Link href="/explorer">
                <Button variant="ghost" size="sm" className="text-white/40 hover:text-white text-xs h-8 px-3">
                  View All <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-52 rounded-lg animate-pulse bg-white/[0.02] border border-white/[0.06]" />
                ))}
              </div>
            ) : featuredMarkets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredMarkets.slice(0, 4).map((market, index) => (
                  <MarketCardEnhanced 
                    key={market.marketId} 
                    market={market} 
                    showQuickBuy={true}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-medium text-white">Trending</h3>
              </div>
              <div className="space-y-2">
                {trendingMarkets.map((market, i) => (
                  <MarketCardCompact key={market.marketId} market={market} rank={i + 1} />
                ))}
                {trendingMarkets.length === 0 && (
                  <p className="text-xs text-white/30 text-center py-6">No trending markets</p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
              <LiveActivityFeed maxItems={4} />
            </div>
          </div>
        </section>

        {newMarkets.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-white">New</h2>
                  <p className="text-xs text-white/40">Recently created</p>
                </div>
              </div>
              <Link href="/explorer?sort=newest">
                <Button variant="ghost" size="sm" className="text-white/40 hover:text-white text-xs h-8 px-3">
                  View All <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {newMarkets.map((market, index) => (
                <MarketCardEnhanced key={market.marketId} market={market} index={index} />
              ))}
            </div>
          </section>
        )}

        {endingSoonMarkets.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                  <Clock className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-medium text-white">Ending Soon</h2>
                  <p className="text-xs text-white/40">Last chance to trade</p>
                </div>
              </div>
              <Link href="/explorer?sort=ending">
                <Button variant="ghost" size="sm" className="text-white/40 hover:text-white text-xs h-8 px-3">
                  View All <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {endingSoonMarkets.map((market, index) => (
                <MarketCardEnhanced key={market.marketId} market={market} index={index} />
              ))}
            </div>
          </section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-lg bg-gradient-to-r from-indigo-500/5 to-violet-500/5 border border-white/[0.06] p-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h2 className="text-base font-medium text-white mb-1">Create a Market</h2>
              <p className="text-sm text-white/50">Launch your own prediction market</p>
            </div>
            <Link href="/create">
              <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white h-9 px-4 text-sm">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Create Market
              </Button>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-10 text-center">
      <div className="h-12 w-12 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="h-6 w-6 text-white/40" />
      </div>
      <h3 className="text-sm font-medium text-white mb-1">No markets yet</h3>
      <p className="text-xs text-white/40 mb-4">Be the first to create a prediction market</p>
      <Link href="/create">
        <Button size="sm" className="h-8 px-4 text-xs bg-indigo-500 hover:bg-indigo-600">
          <Sparkles className="mr-1.5 h-3 w-3" />
          Create Market
        </Button>
      </Link>
    </div>
  );
}
