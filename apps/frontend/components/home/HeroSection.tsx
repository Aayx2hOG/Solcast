"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { ParticleField, GradientMesh, GridPattern } from "@/components/effects/ParticleField";
import { LiveActivityTicker } from "@/components/ui/live-activity-feed";
import { ArrowRight, Wallet, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

interface HeroSectionProps {
  stats: {
    totalVolume: string;
    activeMarkets: number;
    totalLiquidity: string;
    totalMarkets: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <GradientMesh className="opacity-60" />
      <GridPattern className="opacity-30" />
      <ParticleField 
        particleCount={40} 
        color="#6366f1" 
        speed={0.3}
        className="opacity-40"
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm mb-8"
          >
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-xs font-medium text-white/70">Powered by Solana</span>
            <Sparkles className="h-3 w-3 text-purple-400" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-white">Trade the </span>
            <GradientText gradient="primary" animated>
              Future
            </GradientText>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Decentralized prediction markets on Solana. 
            Trade on real-world events with instant settlement and minimal fees.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <div className="wallet-adapter-button-trigger">
              <WalletMultiButton />
            </div>
            <Link href="/explorer">
              <Button
                variant="outline"
                size="lg"
                className="group border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white"
              >
                Explore Markets
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Live Activity Ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center mb-12"
          >
            <LiveActivityTicker className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]" />
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            <StatCard
              label="Total Volume"
              value={parseFloat(stats.totalVolume) * 1_000_000}
              format="currency"
              decimals={2}
              icon={<TrendingUp className="h-4 w-4" />}
              delay={0.6}
            />
            <StatCard
              label="Active Markets"
              value={stats.activeMarkets}
              icon={<Zap className="h-4 w-4" />}
              delay={0.7}
            />
            <StatCard
              label="Total Liquidity"
              value={parseFloat(stats.totalLiquidity) * 1_000_000}
              format="currency"
              decimals={2}
              icon={<Shield className="h-4 w-4" />}
              delay={0.8}
            />
            <StatCard
              label="All-Time Markets"
              value={stats.totalMarkets}
              icon={<Sparkles className="h-4 w-4" />}
              delay={0.9}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  format?: "number" | "currency" | "percentage";
  decimals?: number;
  icon: React.ReactNode;
  delay: number;
}

function StatCard({ label, value, format = "number", decimals = 0, icon, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative"
    >
      <div className="relative p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] hover:border-white/[0.1]">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-emerald-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {label}
            </span>
            <div className="text-white/30 group-hover:text-white/50 transition-colors">
              {icon}
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white">
            <AnimatedCounter 
              value={value} 
              format={format}
              decimals={decimals}
              duration={2}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Features section for below hero
export function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Settlement",
      description: "Trades settle in seconds on Solana with minimal fees.",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Fully Decentralized",
      description: "Non-custodial trading. Your keys, your funds.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Real-Time Prices",
      description: "AI-powered oracle for accurate market resolution.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
  ];

  return (
    <section className="py-16 border-t border-white/[0.04]">
      <div className="container mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all"
            >
              <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                <span className={feature.color}>{feature.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
