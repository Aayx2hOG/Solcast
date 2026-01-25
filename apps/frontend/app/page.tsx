"use client";

import { useSolana } from "@/lib/contexts/SolanaContext";
import { MarketCardEnhanced, MarketCardCompact } from "@/components/market/MarketCardEnhanced";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/home/HeroSection";
import { LiveActivityFeed } from "@/components/ui/live-activity-feed";
import { 
  TrendingUp, 
  ArrowRight, 
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
      {/* Hero Section */}
      <HeroSection stats={stats} />

      {/* Main Content */}
      <div className="container mx-auto px-5 py-8 space-y-12">
        
        {/* Trending Section with Sidebar */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Featured Markets */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Featured Markets
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Highest volume prediction markets
                  </p>
                </div>
              </div>
              <Link href="/explorer">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground text-xs h-8 group"
                >
                  View All 
                  <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="h-64 animate-pulse bg-card/50 border-white/[0.04]" />
                ))}
              </div>
            ) : featuredMarkets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Markets List */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Trending</h3>
              </div>
              <div className="space-y-2">
                {trendingMarkets.map((market, i) => (
                  <MarketCardCompact key={market.marketId} market={market} rank={i + 1} />
                ))}
                {trendingMarkets.length === 0 && (
                  <p className="text-xs text-white/40 text-center py-4">No trending markets</p>
                )}
              </div>
            </div>

            {/* Live Activity */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
              <LiveActivityFeed maxItems={4} />
            </div>
          </div>
        </section>

        {/* New Markets */}
        {newMarkets.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    New Markets
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Recently created prediction markets
                  </p>
                </div>
              </div>
              <Link href="/explorer?sort=newest">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground text-xs h-8 group"
                >
                  View All 
                  <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {newMarkets.map((market, index) => (
                <MarketCardEnhanced 
                  key={market.marketId} 
                  market={market}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Ending Soon */}
        {endingSoonMarkets.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                  <Clock className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Ending Soon
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Last chance to trade
                  </p>
                </div>
              </div>
              <Link href="/explorer?sort=ending">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground text-xs h-8 group"
                >
                  View All 
                  <ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {endingSoonMarkets.map((market, index) => (
                <MarketCardEnhanced 
                  key={market.marketId} 
                  market={market}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 border border-white/[0.08] p-8 md:p-12"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Have a prediction?
              </h2>
              <p className="text-white/60 max-w-md">
                Create your own market and let the world trade on your predictions.
              </p>
            </div>
            <Link href="/create">
              <Button size="lg" className="group bg-white text-black hover:bg-white/90">
                <Zap className="mr-2 h-4 w-4" />
                Create Market
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        </motion.section>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-card/50 border-white/[0.04] p-16 text-center">
      <div className="max-w-md mx-auto space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto">
          <TrendingUp className="h-8 w-8 text-white/40" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No markets yet</h3>
          <p className="text-sm text-muted-foreground">
            Be the first to create a prediction market and start trading.
          </p>
        </div>
        <Link href="/create">
          <Button className="mt-4">
            <Sparkles className="mr-2 h-4 w-4" />
            Create the First Market
          </Button>
        </Link>
      </div>
    </Card>
  );
}
